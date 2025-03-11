import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { generateSchedules } from '@/lib/api/schedules';
import { useAuth } from '@/lib/auth';

export default function GenerateSchedulesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!user) return;

    try {
      setIsGenerating(true);
      await generateSchedules();
      toast({
        title: 'Success',
        description: 'Schedules have been generated successfully.',
      });
    } catch (error) {
      console.error('Error generating schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate schedules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Generate schedules for all employees based on the current rules.
              This will create schedules for the next 30 days.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Schedules'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 