-- SarcoScore: Supabase Postgres Schema & Row Level Security (RLS)
-- Use only fake demo data. Never store real patient data.

create extension if not exists "pgcrypto";

-- 1. PROFILES (four roles: admin, doctor, researcher, patient)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('admin', 'doctor', 'researcher', 'patient')),
  linked_patient_id uuid,
  created_at timestamptz not null default now()
);

-- Helper function to retrieve the current authenticated user's role
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 2. PATIENTS (fake 14-digit Egyptian national IDs only; internal UUID used in URLs)
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text unique not null,
  national_id text unique not null check (national_id ~ '^[0-9]{14}$'),
  full_name text not null,
  gender text not null check (gender in ('Female', 'Male')),
  dob date not null,
  phone text not null,
  history_summary text not null default '',
  recorded_diagnosis text not null default 'Under evaluation (biopsy pending)',
  patient_user_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  last_opened_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 3. TEMPORARY PATIENT FILES (no national ID)
create table if not exists public.temp_patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text unique not null,
  label text not null,
  gender text not null check (gender in ('Female', 'Male')),
  age integer not null check (age >= 0 and age <= 120),
  notes text not null default '',
  recorded_diagnosis text not null default 'Temporary evaluation',
  created_by uuid references public.profiles(id) on delete set null,
  last_opened_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 4. CLINICAL VISITS (stores symptoms jsonb, labs jsonb, score & model_version)
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  temp_patient_id uuid references public.temp_patients(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete set null,
  doctor_name text not null default 'Dr. Clinical Evaluator',
  date timestamptz not null default now(),
  symptoms jsonb not null default '[]'::jsonb,
  labs jsonb not null default '{}'::jsonb,
  investigations jsonb not null default '[]'::jsonb,
  clinical_notes text not null default '',
  total integer not null,
  probability numeric(5,4) not null,
  level text not null check (level in ('Low', 'Moderate', 'High')),
  model_version text not null,
  check (
    (patient_id is not null and temp_patient_id is null) or
    (patient_id is null and temp_patient_id is not null)
  )
);

-- 5. MEDICAL LISTS (Investigations, Symptoms with points, Diagnoses, Specialties)
create table if not exists public.medical_lists (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('investigation', 'symptom', 'diagnosis', 'specialty')),
  code text not null,
  name text not null,
  group_name text not null default 'General',
  points integer,
  updated_at timestamptz not null default now()
);

-- 6. LAB RANGES (normal ranges and max points for laboratory tests)
create table if not exists public.lab_ranges (
  id text primary key,
  label text not null,
  unit text not null,
  low numeric not null,
  high numeric not null,
  direction text not null check (direction in ('high', 'low')),
  max_points integer not null check (max_points >= 0),
  updated_at timestamptz not null default now()
);

-- 7. IMPORTED RESEARCH CASES (pending review queue; never alters live model automatically)
create table if not exists public.imported_cases (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_by_email text not null,
  file_name text not null,
  file_type text not null check (file_type in ('Excel', 'PDF')),
  data jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- 8. PATIENT SCAN & TEST RESULTS (for My Health - patient sees own data only)
create table if not exists public.patient_results (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  patient_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null check (category in ('Scan / Imaging', 'Laboratory Test')),
  value_summary text not null,
  reference_range text not null default '',
  date date not null,
  created_at timestamptz not null default now()
);

-- 9. AUDIT LOG (latest 200 changes: who, what, when)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  user_email text not null,
  user_role text not null,
  action text not null,
  target text not null,
  at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.temp_patients enable row level security;
alter table public.visits enable row level security;
alter table public.medical_lists enable row level security;
alter table public.lab_ranges enable row level security;
alter table public.imported_cases enable row level security;
alter table public.patient_results enable row level security;
alter table public.audit_log enable row level security;

-- PROFILES: Admin full access; users can read their own profile
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (auth.uid() = id or public.current_user_role() = 'admin');

create policy "profiles_admin_write" on public.profiles
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- PATIENTS: Doctor & Admin full clinical access; Patient can read own linked record only
create policy "patients_doctor_admin_all" on public.patients
  for all using (public.current_user_role() in ('admin', 'doctor'))
  with check (public.current_user_role() in ('admin', 'doctor'));

create policy "patients_patient_read_own" on public.patients
  for select using (
    public.current_user_role() = 'patient' and patient_user_id = auth.uid()
  );

-- TEMP PATIENTS: Doctor & Admin only
create policy "temp_patients_doctor_admin_all" on public.temp_patients
  for all using (public.current_user_role() in ('admin', 'doctor'))
  with check (public.current_user_role() in ('admin', 'doctor'));

-- VISITS: Doctor & Admin full access; Researcher read-only de-identified stats
create policy "visits_doctor_admin_all" on public.visits
  for all using (public.current_user_role() in ('admin', 'doctor'))
  with check (public.current_user_role() in ('admin', 'doctor'));

-- MEDICAL LISTS & LAB RANGES: Everyone authenticated can read; Admin only can modify
create policy "medical_lists_read_authenticated" on public.medical_lists
  for select using (auth.uid() is not null);

create policy "medical_lists_admin_write" on public.medical_lists
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "lab_ranges_read_authenticated" on public.lab_ranges
  for select using (auth.uid() is not null);

create policy "lab_ranges_admin_write" on public.lab_ranges
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- IMPORTED CASES: Researcher & Admin only
create policy "imported_cases_researcher_admin_read" on public.imported_cases
  for select using (public.current_user_role() in ('admin', 'researcher'));

create policy "imported_cases_researcher_admin_insert" on public.imported_cases
  for insert with check (public.current_user_role() in ('admin', 'researcher'));

create policy "imported_cases_admin_update" on public.imported_cases
  for update using (public.current_user_role() = 'admin');

-- PATIENT RESULTS (My Health): Patient reads ONLY own rows; Doctor & Admin can read/insert
create policy "patient_results_patient_own_only" on public.patient_results
  for select using (
    (public.current_user_role() = 'patient' and patient_user_id = auth.uid())
    or public.current_user_role() in ('admin', 'doctor')
  );

create policy "patient_results_doctor_admin_write" on public.patient_results
  for insert with check (public.current_user_role() in ('admin', 'doctor'));

-- AUDIT LOG: Any authenticated user can insert own audit log entries; Admin only can read; NO ONE can update or delete
create policy "audit_log_insert_authenticated" on public.audit_log
  for insert with check (auth.uid() is not null and user_id = auth.uid());

create policy "audit_log_admin_select" on public.audit_log
  for select using (public.current_user_role() = 'admin');

-- Prevent any UPDATE or DELETE on audit_log (append-only immutable audit trail)
create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only and cannot be modified or deleted';
end;
$$;

drop trigger if exists trg_audit_log_immutable on public.audit_log;
create trigger trg_audit_log_immutable
before update or delete on public.audit_log
for each row execute function public.prevent_audit_log_mutation();

-- Prevent any user (including admin) from escalating or changing their own role via SQL
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.id = auth.uid() and new.role is distinct from old.role then
    raise exception 'Users cannot change their own role';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_change on public.profiles;
create trigger trg_prevent_self_role_change
before update on public.profiles
for each row execute function public.prevent_self_role_change();

-- Explicitly revoke anonymous access on all public tables
revoke all on all tables in schema public from anon;

-- STORAGE BUCKET RLS: research_uploads (5 MB limit, Excel/PDF only, Researcher & Admin only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'research_uploads',
  'research_uploads',
  false,
  5242880,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880;

create policy "research_uploads_select_researcher_admin" on storage.objects
  for select using (
    bucket_id = 'research_uploads'
    and public.current_user_role() in ('admin', 'researcher')
  );

create policy "research_uploads_insert_researcher_admin" on storage.objects
  for insert with check (
    bucket_id = 'research_uploads'
    and public.current_user_role() in ('admin', 'researcher')
  );


