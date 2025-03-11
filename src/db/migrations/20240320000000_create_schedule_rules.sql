-- Create schedule_rules table
CREATE TABLE IF NOT EXISTS public.schedule_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    employee_id UUID REFERENCES public.employees(id),
    work_days INTEGER[] NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on employee_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_schedule_rules_employee_id ON public.schedule_rules(employee_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schedule_rules_updated_at
    BEFORE UPDATE ON public.schedule_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 