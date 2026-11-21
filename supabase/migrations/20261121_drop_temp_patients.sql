-- Migration: Remove temporary patient files (temp_patients) and all dependencies
-- 1. Drop RLS policy on temp_patients
drop policy if exists "temp_patients_doctor_admin_all" on public.temp_patients;

-- 2. Remove any visits linked only to temp_patients and drop temp_patient_id column from visits
delete from public.visits where patient_id is null;

alter table public.visits
  drop constraint if exists visits_check,
  drop column if exists temp_patient_id,
  alter column patient_id set not null;

-- 3. Drop the temp_patients table
drop table if exists public.temp_patients;
