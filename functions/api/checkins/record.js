import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  const supabaseUrl = context.env.SUPABASE_URL;
  const supabaseKey = context.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({
      error: 'Supabase configuration is missing'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  try {
    const { employeeId } = await context.request.json();
    
    if (!employeeId) {
      return new Response(JSON.stringify({
        error: 'Employee ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();
    
    if (employeeError || !employee) {
      return new Response(JSON.stringify({
        error: 'Employee not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const now = new Date();
    const checkinTime = now.toISOString();
    
    // Check if employee has already checked in today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingCheckin } = await supabase
      .from('checkins')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('created_at', today + 'T00:00:00Z')
      .lte('created_at', today + 'T23:59:59Z');
    
    if (existingCheckin && existingCheckin.length > 0) {
      return new Response(JSON.stringify({ 
        status: 'already_checked_in',
        checkin: existingCheckin[0]
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Calculate late status and penalties
    const lateStatus = calculateLateStatus(now);
    
    // Check for exemption eligibility
    const exemptionApplied = await checkAndApplyExemption(supabase, employeeId, lateStatus);
    
    // Get client IP address
    const ipAddress = getClientIp(context.request);
    
    // Get User Agent
    const userAgent = context.request.headers.get('user-agent') || '';
    
    // Get IP information
    let ipInfo = {};
    try {
      const ipInfoResponse = await fetch(`https://ipinfo.io/${ipAddress}?token=de3e03f0fe9efc`);
      if (ipInfoResponse.ok) {
        ipInfo = await ipInfoResponse.json();
      }
    } catch (error) {
      console.error('Error fetching IP info:', error);
    }
    
    // Check if the IP belongs to the shop's WiFi network
    const connectedToShopWifi = checkIfShopWifi(ipInfo);

    // Calculate meal allowance
    const mealAllowance = calculateMealAllowance(lateStatus.status);
    
    const { data, error } = await supabase
      .from('checkins')
      .insert([
        { 
          employee_id: employeeId,
          created_at: checkinTime,
          late_status: lateStatus.status,
          penalty_percentage: exemptionApplied ? 0 : lateStatus.penalty,
          exemption_applied: exemptionApplied,
          user_agent: userAgent,
          ip_address: ipAddress,
          ip_info: ipInfo,
          is_shop_wifi: connectedToShopWifi,
          meal_allowance: mealAllowance
        }
      ])
      .select();
    
    if (error) {
      return new Response(JSON.stringify({
        error: 'Failed to record check-in',
        details: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(JSON.stringify({ 
      status: 'success',
      checkin: data[0],
      lateStatus,
      exemptionApplied,
      mealAllowance,
      isShopWifi: connectedToShopWifi
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Helper function to calculate late status and penalties
function calculateLateStatus(date) {
  // Convert to Bangkok timezone (UTC+7)
  const bangkokTime = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (7 * 60 * 60000));
  const hours = bangkokTime.getHours();
  const minutes = bangkokTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  if (timeInMinutes < 480) {
    // Before 8:00 AM - perfect on time
    return { status: 'perfect_on_time', penalty: 0, message: 'Perfect on time' };
  } else if (timeInMinutes < 490) {
    // Between 8:00 AM and 8:10 AM - on time
    return { status: 'on_time', penalty: 0, message: 'On time' };
  } else if (timeInMinutes < 510) {
    // Between 8:10 AM and 8:30 AM - late with 10% penalty
    return { status: 'late_10', penalty: 10, message: 'Late (10% penalty)' };
  } else {
    // After 8:30 AM - late with 15% penalty
    return { status: 'late_15', penalty: 15, message: 'Late (15% penalty)' };
  }
}

// Check if employee is eligible for exemption and apply it
async function checkAndApplyExemption(supabase, employeeId, lateStatus) {
  // Only apply exemption for 10% penalty (8:10-8:30)
  if (lateStatus.status !== 'late_10') {
    return false;
  }
  
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  // Get the date for last Wednesday (start of the week for our purposes)
  const startDate = new Date(now);
  const daysToSubtract = (dayOfWeek + 4) % 7; // Calculate days to go back to Wednesday
  startDate.setDate(startDate.getDate() - daysToSubtract);
  startDate.setHours(0, 0, 0, 0);
  
  // Get all check-ins for this week
  const { data: weekCheckins, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('created_at', startDate.toISOString())
    .lt('created_at', now.toISOString());
  
  if (error) {
    console.error('Error checking exemption eligibility:', error);
    return false;
  }
  
  // Check if exemption already used this week
  const exemptionUsed = weekCheckins.some(checkin => checkin.exemption_applied);
  if (exemptionUsed) {
    return false;
  }
  
  // Check if there's at least one perfect attendance (before 8:00 AM) this week
  const perfectAttendance = weekCheckins.some(checkin => {
    const checkinDate = new Date(checkin.created_at);
    const checkinHours = checkinDate.getHours();
    const checkinMinutes = checkinDate.getMinutes();
    return (checkinHours < 8 || (checkinHours === 8 && checkinMinutes === 0));
  });
  
  return perfectAttendance;
}

// Get client IP address
function getClientIp(request) {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }
  
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Get the first IP in the list (client's original IP)
    return forwardedFor.split(',')[0].trim();
  }
  
  return '127.0.0.1';
}

// Check if the IP belongs to the shop's WiFi network
function checkIfShopWifi(ipInfo) {
  const knownShopIsps = [
    'AIS Fibre',
    'Advance Wireless Network',
    '3BB',
  ];
  
  const isMobileNetwork = ipInfo.carrier && ipInfo.carrier.name;
  
  const isDataCenter = ipInfo.privacy && (
    ipInfo.privacy.hosting || 
    ipInfo.privacy.proxy || 
    ipInfo.privacy.vpn || 
    ipInfo.privacy.tor
  );

  const shopAns = ['AS133481', 'AS131445']
  
  const isKnownIsp = ipInfo.asn && 
    knownShopIsps.some(isp => 
      (ipInfo.asn.name && ipInfo.asn.name.includes(isp)) || 
      (ipInfo.company && ipInfo.company.name && ipInfo.company.name.includes(isp))
      || ipInfo.asn.asn && shopAns.includes(ipInfo.asn.asn)
    );
  
  return isKnownIsp && !isMobileNetwork && !isDataCenter;
} 

function calculateMealAllowance(status) {
  if (status === 'perfect_on_time') {
    return 50;
  } else {
    return 0;
  }
}
