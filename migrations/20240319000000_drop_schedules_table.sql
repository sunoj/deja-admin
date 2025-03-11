-- Drop schedules table and related objects
DROP TRIGGER IF EXISTS update_schedules_updated_at ON public.schedules;
DROP FUNCTION IF EXISTS update_schedules_updated_at();
DROP INDEX IF EXISTS idx_schedules_employee_date;
DROP TABLE IF EXISTS public.schedules; 