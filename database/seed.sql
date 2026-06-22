-- HSE Pro Enterprise - Seed Data
-- All seeded users have password: Password123!
-- bcrypt hash (cost 10) below corresponds to "Password123!"

DO $$
DECLARE
  v_org UUID := '11111111-1111-1111-1111-111111111111';
  v_owner UUID := '22222222-2222-2222-2222-222222222201';
  v_admin UUID := '22222222-2222-2222-2222-222222222202';
  v_safety UUID := '22222222-2222-2222-2222-222222222203';
  v_super UUID := '22222222-2222-2222-2222-222222222204';
  v_worker UUID := '22222222-2222-2222-2222-222222222205';
  v_proj UUID := '33333333-3333-3333-3333-333333333301';
  v_site UUID := '44444444-4444-4444-4444-444444444401';
  v_dept UUID := '55555555-5555-5555-5555-555555555501';
  v_pw TEXT := '$2a$10$bocxESUJjCYG2d9smea7I./i5UWIoVs8FwBwOiSVXpvCQJ4NlgaOi';
  v_course UUID := '66666666-6666-6666-6666-666666666601';
  v_ra UUID := '77777777-7777-7777-7777-777777777701';
BEGIN
  INSERT INTO organizations(id, name, industry, subscription_plan)
  VALUES (v_org, 'Acme Construction Group', 'Construction', 'enterprise');

  INSERT INTO users(id, org_id, email, password_hash, first_name, last_name, role, department, job_title)
  VALUES
    (v_owner, v_org, 'admin@hse-pro.com', v_pw, 'System', 'Owner', 'system_owner', 'IT', 'System Owner'),
    (v_admin, v_org, 'org.admin@acme.com', v_pw, 'Alice', 'Admin', 'admin', 'Administration', 'HSE Manager'),
    (v_safety, v_org, 'safety@acme.com', v_pw, 'Sam', 'Safety', 'safety_officer', 'HSE', 'Safety Officer'),
    (v_super, v_org, 'supervisor@acme.com', v_pw, 'Sue', 'Supervisor', 'supervisor', 'Operations', 'Site Supervisor'),
    (v_worker, v_org, 'worker@acme.com', v_pw, 'Will', 'Worker', 'worker', 'Operations', 'Field Worker');

  INSERT INTO departments(id, org_id, name, code, manager_id)
  VALUES (v_dept, v_org, 'Operations', 'OPS', v_super);

  INSERT INTO projects(id, org_id, name, code, status, industry, location, manager_id, start_date)
  VALUES (v_proj, v_org, 'Downtown Tower Build', 'PRJ-001', 'active', 'Construction', 'Metro City', v_admin, CURRENT_DATE - 90);

  INSERT INTO sites(id, org_id, project_id, name, address, gps_lat, gps_lng)
  VALUES (v_site, v_org, v_proj, 'Tower Site A', '100 Main St, Metro City', 40.7128000, -74.0060000);

  INSERT INTO incidents(org_id, project_id, site_id, reference_no, incident_type, severity, status, title, description, incident_date, location, reported_by, assigned_to)
  VALUES
    (v_org, v_proj, v_site, 'INC-2026-0001', 'INCIDENT', 'HIGH', 'UNDER_INVESTIGATION', 'Worker slip on wet floor', 'A worker slipped near the scaffold base.', CURRENT_DATE - 5, 'Level 3', v_worker, v_safety),
    (v_org, v_proj, v_site, 'INC-2026-0002', 'NEAR_MISS', 'MEDIUM', 'REPORTED', 'Falling object near walkway', 'A bolt fell from height, no injury.', CURRENT_DATE - 2, 'Walkway B', v_super, v_safety),
    (v_org, v_proj, v_site, 'INC-2026-0003', 'PROPERTY_DAMAGE', 'LOW', 'CLOSED', 'Minor forklift scrape', 'Forklift scraped a wall.', CURRENT_DATE - 20, 'Warehouse', v_worker, v_super);

  INSERT INTO observations(org_id, project_id, site_id, reference_no, observation_type, status, title, description, location, risk_rating, observed_by, assigned_to, observation_date)
  VALUES
    (v_org, v_proj, v_site, 'OBS-2026-0001', 'UNSAFE_CONDITION', 'OPEN', 'Missing guardrail', 'Edge protection missing on level 4.', 'Level 4', 'HIGH', v_safety, v_super, CURRENT_DATE - 3),
    (v_org, v_proj, v_site, 'OBS-2026-0002', 'POSITIVE', 'CLOSED', 'Good housekeeping', 'Excellent housekeeping observed.', 'Level 1', 'LOW', v_super, NULL, CURRENT_DATE - 1);

  INSERT INTO risk_assessments(id, org_id, project_id, site_id, reference_no, assessment_type, title, activity, status, risk_owner_id)
  VALUES (v_ra, v_org, v_proj, v_site, 'RA-2026-0001', 'JSA', 'Working at Height JSA', 'Scaffold erection', 'APPROVED', v_safety);

  INSERT INTO risk_hazards(assessment_id, hazard_description, hazard_type, persons_at_risk, existing_controls, likelihood_before, severity_before, risk_score_before, risk_level_before, control_measures, likelihood_after, severity_after, risk_score_after, risk_level_after, residual_risk_acceptable, responsible_person_id)
  VALUES (v_ra, 'Fall from height', 'Physical', 'Workers', 'Harness', 4, 5, 20, 'CRITICAL', 'Full body harness, edge protection, trained workers', 2, 5, 10, 'HIGH', true, v_safety);

  INSERT INTO corrective_actions(org_id, source_type, source_id, title, description, action_type, priority, status, assigned_to, assigned_by, due_date)
  VALUES (v_org, 'OBSERVATION', NULL, 'Install guardrail level 4', 'Install missing edge protection.', 'CORRECTIVE', 'HIGH', 'IN_PROGRESS', v_super, v_safety, CURRENT_DATE + 3);

  INSERT INTO training_courses(id, org_id, name, code, category, duration_hours, validity_months, is_mandatory, competency_level)
  VALUES (v_course, v_org, 'Working at Heights', 'TRN-WAH', 'Safety', 8, 24, true, 'INTERMEDIATE');

  INSERT INTO training_records(org_id, user_id, course_id, status, completion_date, expiry_date, score, pass_mark)
  VALUES
    (v_org, v_worker, v_course, 'COMPLETED', CURRENT_DATE - 30, CURRENT_DATE + 700, 88, 70),
    (v_org, v_super, v_course, 'PLANNED', NULL, NULL, NULL, 70);

  INSERT INTO audit_templates(org_id, name, description, audit_type, sections, created_by)
  VALUES (v_org, 'Monthly Site Safety Inspection', 'Standard monthly inspection template', 'INSPECTION',
    '[{"title":"PPE","items":["Hard hats worn","Hi-vis worn"]},{"title":"Housekeeping","items":["Walkways clear","Waste segregated"]}]'::jsonb,
    v_safety);

  INSERT INTO emergency_contacts(org_id, name, role, phone_primary, available_24_7)
  VALUES (v_org, 'Emergency Response Team', 'First Responder', '+1-555-0100', true);

  INSERT INTO environmental_readings(org_id, project_id, site_id, reading_type, value, unit, reading_date, recorded_by)
  VALUES (v_org, v_proj, v_site, 'ELECTRICITY', 1250.5, 'kWh', CURRENT_DATE - 1, v_safety);

END $$;
