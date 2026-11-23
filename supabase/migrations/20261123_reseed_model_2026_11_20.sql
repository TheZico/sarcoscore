-- Migration: Re-seed scored items, points, and lab ranges from model.json (version 2026-11-20)
-- Preserves all existing patients and clinical visits.
-- Existing visits retain their saved total, probability, level, and original model_version (never recalculated).
-- New visits created after this migration store model_version = '2026-11-20'.

begin;

-- 1. Re-seed all 24 scored symptom/finding items in public.medical_lists (category = 'symptom')
delete from public.medical_lists where category = 'symptom';

insert into public.medical_lists (category, code, name, group_name, points, updated_at)
values
  ('symptom', 'fever_fatigue', 'Fever / fatigue', 'General', -1, '2026-11-20T00:00:00Z'),
  ('symptom', 'night_sweats', 'Night sweats', 'General', -1, '2026-11-20T00:00:00Z'),
  ('symptom', 'weight_loss', 'Weight loss', 'General', -1, '2026-11-20T00:00:00Z'),
  ('symptom', 'muscle_pain', 'Muscle pain', 'General', 0, '2026-11-20T00:00:00Z'),
  ('symptom', 'joint_back_pain', 'Joint / back pain', 'General', 2, '2026-11-20T00:00:00Z'),
  ('symptom', 'dry_cough', 'Dry cough', 'Chest', 2, '2026-11-20T00:00:00Z'),
  ('symptom', 'shortness_of_breath', 'Shortness of breath', 'Chest', 1, '2026-11-20T00:00:00Z'),
  ('symptom', 'palpitations_heart_block', 'Palpitations / heart block', 'Chest', 1, '2026-11-20T00:00:00Z'),
  ('symptom', 'skin_lesions_itching', 'Skin lesions / itching', 'Skin, nose & mouth', 3, '2026-11-20T00:00:00Z'),
  ('symptom', 'blocked_nose', 'Blocked nose', 'Skin, nose & mouth', 1, '2026-11-20T00:00:00Z'),
  ('symptom', 'oral_ulcers', 'Oral ulcers', 'Skin, nose & mouth', 1, '2026-11-20T00:00:00Z'),
  ('symptom', 'abdominal_pain', 'Abdominal pain', 'Abdomen', 0, '2026-11-20T00:00:00Z'),
  ('symptom', 'chronic_diarrhea', 'Chronic diarrhea', 'Abdomen', -2, '2026-11-20T00:00:00Z'),
  ('symptom', 'nausea_vomiting', 'Nausea / vomiting', 'Abdomen', 0, '2026-11-20T00:00:00Z'),
  ('symptom', 'jaundice', 'Jaundice', 'Abdomen', 0, '2026-11-20T00:00:00Z'),
  ('symptom', 'enlarged_liver', 'Enlarged liver', 'Abdomen', 0, '2026-11-20T00:00:00Z'),
  ('symptom', 'enlarged_spleen', 'Enlarged spleen', 'Abdomen', 0, '2026-11-20T00:00:00Z'),
  ('symptom', 'enlarged_lymph_nodes', 'Enlarged lymph nodes', 'Other', 2, '2026-11-20T00:00:00Z'),
  ('symptom', 'nerve_pain_numbness', 'Nerve pain / numbness', 'Other', 0, '2026-11-20T00:00:00Z'),
  ('symptom', 'paralysis_weakness', 'Paralysis / weakness', 'Other', 1, '2026-11-20T00:00:00Z'),
  ('symptom', 'imaging_enlarged_chest_lymph_nodes', 'Imaging: enlarged chest lymph nodes', 'Imaging & tests', 3, '2026-11-20T00:00:00Z'),
  ('symptom', 'imaging_lung_nodules_infiltrates', 'Imaging: lung nodules / infiltrates', 'Imaging & tests', 1, '2026-11-20T00:00:00Z'),
  ('symptom', 'heart_tests_abnormal_ecg_echo_mri', 'Heart tests abnormal (ECG / echo / MRI)', 'Imaging & tests', 1, '2026-11-20T00:00:00Z'),
  ('symptom', 'liver_tests_abnormal', 'Liver tests abnormal', 'Imaging & tests', 1, '2026-11-20T00:00:00Z');

-- 2. Re-seed all 8 laboratory normal ranges and max points in public.lab_ranges
insert into public.lab_ranges (id, label, unit, low, high, direction, max_points, updated_at)
values
  ('ace', 'ACE', 'U/L', 8, 52, 'high', 5, '2026-11-20T00:00:00Z'),
  ('serum_calcium', 'Serum calcium', 'mg/dL', 8.5, 10.5, 'high', 4, '2026-11-20T00:00:00Z'),
  ('lymphocyte_count', 'Lymphocyte count', 'x10^3/uL', 1.0, 4.8, 'low', 2, '2026-11-20T00:00:00Z'),
  ('alp', 'ALP', 'U/L', 44, 147, 'high', 2, '2026-11-20T00:00:00Z'),
  ('crp', 'CRP', 'mg/L', 0, 5, 'high', 1, '2026-11-20T00:00:00Z'),
  ('esr', 'ESR', 'mm/hr', 0, 20, 'high', 1, '2026-11-20T00:00:00Z'),
  ('ldh', 'LDH', 'U/L', 140, 280, 'high', 1, '2026-11-20T00:00:00Z'),
  ('wbc', 'WBC', 'x10^3/uL', 4.0, 11.0, 'high', 1, '2026-11-20T00:00:00Z')
on conflict (id) do update
set
  label = excluded.label,
  unit = excluded.unit,
  low = excluded.low,
  high = excluded.high,
  direction = excluded.direction,
  max_points = excluded.max_points,
  updated_at = excluded.updated_at;

-- 3. Record model migration in audit_log (append-only)
insert into public.audit_log (user_email, user_role, action, target)
values (
  'system@migration',
  'admin',
  'RESEED_MODEL_PARAMETERS',
  'Re-seeded 24 scored items and 8 lab ranges from model.json v2026-11-20 (existing patients and visits preserved without recalculation)'
);

commit;
