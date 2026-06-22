-- HSE Pro Enterprise - PostgreSQL Schema
-- Requires pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Trigger function: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Core / Auth
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(120),
  logo_url TEXT,
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'worker'
    CHECK (role IN ('system_owner','admin','safety_officer','supervisor','worker','auditor','contractor')),
  department VARCHAR(120),
  job_title VARCHAR(120),
  phone VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  mfa_secret TEXT,
  last_login TIMESTAMPTZ,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_users_role ON users(role);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_roles_org ON roles(org_id);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_org ON audit_logs(org_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50),
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_departments_org ON departments(org_id);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','planned','on_hold','completed','cancelled')),
  industry VARCHAR(120),
  location VARCHAR(255),
  start_date DATE,
  end_date DATE,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_org ON projects(org_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  gps_lat NUMERIC(10,7),
  gps_lng NUMERIC(10,7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sites_org ON sites(org_id);
CREATE INDEX idx_sites_project ON sites(project_id);

-- ============================================================
-- Incident Management
-- ============================================================
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  reference_no VARCHAR(50) NOT NULL UNIQUE,
  incident_type VARCHAR(30) NOT NULL
    CHECK (incident_type IN ('INCIDENT','NEAR_MISS','OBSERVATION','PROPERTY_DAMAGE','VEHICLE','ENVIRONMENTAL')),
  severity VARCHAR(20) NOT NULL DEFAULT 'LOW'
    CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status VARCHAR(30) NOT NULL DEFAULT 'REPORTED'
    CHECK (status IN ('REPORTED','UNDER_INVESTIGATION','ASSIGNED','VERIFIED','CLOSED')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  incident_date DATE,
  incident_time TIME,
  location VARCHAR(255),
  gps_lat NUMERIC(10,7),
  gps_lng NUMERIC(10,7),
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  injured_person_name VARCHAR(255),
  injury_type VARCHAR(120),
  body_part_affected VARCHAR(120),
  treatment_provided TEXT,
  lost_time_days INT DEFAULT 0,
  property_damage_cost NUMERIC(14,2) DEFAULT 0,
  root_cause TEXT,
  contributing_factors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_incidents_org ON incidents(org_id);
CREATE INDEX idx_incidents_project ON incidents(project_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_created ON incidents(created_at);
CREATE TRIGGER trg_incidents_updated BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE incident_witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  witness_name VARCHAR(255),
  witness_contact VARCHAR(120),
  statement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_incident_witnesses_incident ON incident_witnesses(incident_id);

CREATE TABLE incident_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  file_path TEXT,
  file_type VARCHAR(120),
  file_size BIGINT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_incident_attachments_incident ON incident_attachments(incident_id);

CREATE TABLE incident_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  investigator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  findings TEXT,
  five_why_1 TEXT,
  five_why_2 TEXT,
  five_why_3 TEXT,
  five_why_4 TEXT,
  five_why_5 TEXT,
  root_cause_analysis TEXT,
  fishbone_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_investigations_incident ON incident_investigations(incident_id);
CREATE TRIGGER trg_investigations_updated BEFORE UPDATE ON incident_investigations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL
    CHECK (source_type IN ('INCIDENT','AUDIT','OBSERVATION','RISK')),
  source_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_type VARCHAR(20) NOT NULL DEFAULT 'CORRECTIVE'
    CHECK (action_type IN ('CORRECTIVE','PREVENTIVE')),
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'
    CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','IN_PROGRESS','COMPLETED','VERIFIED','CLOSED','OVERDUE')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  completed_date DATE,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_date DATE,
  evidence_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_capa_org ON corrective_actions(org_id);
CREATE INDEX idx_capa_status ON corrective_actions(status);
CREATE INDEX idx_capa_source ON corrective_actions(source_type, source_id);
CREATE TRIGGER trg_capa_updated BEFORE UPDATE ON corrective_actions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Hazard Observations
-- ============================================================
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  reference_no VARCHAR(50),
  observation_type VARCHAR(30) NOT NULL
    CHECK (observation_type IN ('UNSAFE_ACT','UNSAFE_CONDITION','POSITIVE','GOOD_CATCH')),
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','IN_PROGRESS','CLOSED')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  gps_lat NUMERIC(10,7),
  gps_lng NUMERIC(10,7),
  risk_rating VARCHAR(20) DEFAULT 'LOW'
    CHECK (risk_rating IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  observed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  observation_date DATE,
  closed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_observations_org ON observations(org_id);
CREATE INDEX idx_observations_status ON observations(status);
CREATE INDEX idx_observations_created ON observations(created_at);
CREATE TRIGGER trg_observations_updated BEFORE UPDATE ON observations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE observation_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id UUID NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
  file_path TEXT,
  file_type VARCHAR(120),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  code VARCHAR(120) NOT NULL UNIQUE,
  label VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Risk Assessment
-- ============================================================
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  reference_no VARCHAR(50),
  assessment_type VARCHAR(20) NOT NULL
    CHECK (assessment_type IN ('HIRA','JSA','JHA','ENVIRONMENTAL')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  activity VARCHAR(255),
  department VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','REVIEW','APPROVED','SUPERSEDED')),
  risk_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_risk_org ON risk_assessments(org_id);
CREATE INDEX idx_risk_status ON risk_assessments(status);
CREATE TRIGGER trg_risk_updated BEFORE UPDATE ON risk_assessments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE risk_hazards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
  hazard_description TEXT,
  hazard_type VARCHAR(120),
  persons_at_risk VARCHAR(255),
  existing_controls TEXT,
  likelihood_before INT,
  severity_before INT,
  risk_score_before INT,
  risk_level_before VARCHAR(20),
  control_measures TEXT,
  likelihood_after INT,
  severity_after INT,
  risk_score_after INT,
  risk_level_after VARCHAR(20),
  residual_risk_acceptable BOOLEAN,
  responsible_person_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_risk_hazards_assessment ON risk_hazards(assessment_id);

-- ============================================================
-- Audit & Inspection
-- ============================================================
CREATE TABLE audit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  audit_type VARCHAR(20) NOT NULL DEFAULT 'INTERNAL'
    CHECK (audit_type IN ('INTERNAL','EXTERNAL','INSPECTION')),
  industry VARCHAR(120),
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_templates_org ON audit_templates(org_id);
CREATE TRIGGER trg_audit_templates_updated BEFORE UPDATE ON audit_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  template_id UUID REFERENCES audit_templates(id) ON DELETE SET NULL,
  reference_no VARCHAR(50),
  audit_type VARCHAR(20) NOT NULL DEFAULT 'INTERNAL'
    CHECK (audit_type IN ('INTERNAL','EXTERNAL','INSPECTION')),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PLANNED'
    CHECK (status IN ('PLANNED','IN_PROGRESS','COMPLETED','CLOSED')),
  lead_auditor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  planned_date DATE,
  actual_date DATE,
  score NUMERIC(10,2),
  max_score NUMERIC(10,2),
  compliance_percentage NUMERIC(5,2),
  findings_count INT DEFAULT 0,
  ncr_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audits_org ON audits(org_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE TRIGGER trg_audits_updated BEFORE UPDATE ON audits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  finding_type VARCHAR(20) NOT NULL
    CHECK (finding_type IN ('MAJOR_NC','MINOR_NC','OBSERVATION','POSITIVE')),
  reference VARCHAR(80),
  description TEXT,
  standard_clause VARCHAR(120),
  evidence TEXT,
  recommendation TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','IN_PROGRESS','CLOSED')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  closed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_findings_audit ON audit_findings(audit_id);

CREATE TABLE ncr_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES audit_findings(id) ON DELETE SET NULL,
  ncr_number VARCHAR(50) NOT NULL UNIQUE,
  standard_clause VARCHAR(120),
  requirement TEXT,
  nonconformance_description TEXT,
  objective_evidence TEXT,
  raised_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','UNDER_REVIEW','ACCEPTED','REJECTED','CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ncr_audit ON ncr_records(audit_id);
CREATE TRIGGER trg_ncr_updated BEFORE UPDATE ON ncr_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Permit To Work
-- ============================================================
CREATE TABLE permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  permit_number VARCHAR(50) NOT NULL UNIQUE,
  permit_type VARCHAR(30) NOT NULL
    CHECK (permit_type IN ('HOT_WORK','CONFINED_SPACE','ELECTRICAL','EXCAVATION','LIFTING','WORK_AT_HEIGHT','GENERAL')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  work_location VARCHAR(255),
  risk_level VARCHAR(20) DEFAULT 'MEDIUM'
    CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','ACTIVE','SUSPENDED','CLOSED','EXPIRED','REJECTED')),
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  issuer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  contractor_id UUID,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  actual_end_datetime TIMESTAMPTZ,
  precautions TEXT,
  ppe_required JSONB DEFAULT '[]'::jsonb,
  gas_test_required BOOLEAN DEFAULT false,
  gas_test_results JSONB DEFAULT '{}'::jsonb,
  attendant_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_permits_org ON permits(org_id);
CREATE INDEX idx_permits_status ON permits(status);
CREATE TRIGGER trg_permits_updated BEFORE UPDATE ON permits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE permit_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID NOT NULL REFERENCES permits(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  role_in_approval VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  comments TEXT,
  signature_data TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_permit_approvals_permit ON permit_approvals(permit_id);

CREATE TABLE permit_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID NOT NULL REFERENCES permits(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  new_end_datetime TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Training
-- ============================================================
CREATE TABLE training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  category VARCHAR(120),
  duration_hours NUMERIC(6,2),
  validity_months INT,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  competency_level VARCHAR(20) DEFAULT 'AWARENESS'
    CHECK (competency_level IN ('AWARENESS','BASIC','INTERMEDIATE','ADVANCED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_courses_org ON training_courses(org_id);
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON training_courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PLANNED'
    CHECK (status IN ('PLANNED','IN_PROGRESS','COMPLETED','FAILED','EXPIRED')),
  start_date DATE,
  completion_date DATE,
  expiry_date DATE,
  score NUMERIC(6,2),
  pass_mark NUMERIC(6,2),
  certificate_path TEXT,
  training_provider VARCHAR(255),
  instructor VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_training_records_org ON training_records(org_id);
CREATE INDEX idx_training_records_user ON training_records(user_id);
CREATE INDEX idx_training_records_status ON training_records(status);
CREATE TRIGGER trg_training_records_updated BEFORE UPDATE ON training_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE training_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES training_courses(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Emergency Management
-- ============================================================
CREATE TABLE emergency_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  plan_type VARCHAR(20) NOT NULL
    CHECK (plan_type IN ('FIRE','EVACUATION','MEDICAL','SPILL','EARTHQUAKE','GENERAL')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0',
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('ACTIVE','DRAFT','SUPERSEDED')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_date DATE,
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_emergency_plans_org ON emergency_plans(org_id);
CREATE TRIGGER trg_emergency_plans_updated BEFORE UPDATE ON emergency_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(120),
  phone_primary VARCHAR(50),
  phone_secondary VARCHAR(50),
  email VARCHAR(255),
  available_24_7 BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_emergency_contacts_org ON emergency_contacts(org_id);

CREATE TABLE emergency_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  drill_type VARCHAR(20) NOT NULL
    CHECK (drill_type IN ('FIRE','EVACUATION','MEDICAL','SPILL','LOCKDOWN')),
  status VARCHAR(20) NOT NULL DEFAULT 'PLANNED'
    CHECK (status IN ('PLANNED','COMPLETED','CANCELLED')),
  scheduled_date DATE,
  actual_date DATE,
  duration_minutes INT,
  participants_count INT,
  scenario_description TEXT,
  objectives TEXT,
  results TEXT,
  findings TEXT,
  lessons_learned TEXT,
  conducted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  report_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_drills_org ON emergency_drills(org_id);
CREATE TRIGGER trg_drills_updated BEFORE UPDATE ON emergency_drills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Environmental
-- ============================================================
CREATE TABLE environmental_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  reading_type VARCHAR(20) NOT NULL
    CHECK (reading_type IN ('WASTE','WATER','FUEL','ELECTRICITY','EMISSIONS','NOISE','AIR_QUALITY')),
  value NUMERIC(16,4),
  unit VARCHAR(40),
  reading_date DATE,
  reading_source VARCHAR(120),
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_env_readings_org ON environmental_readings(org_id);
CREATE INDEX idx_env_readings_type ON environmental_readings(reading_type);

CREATE TABLE waste_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  waste_type VARCHAR(120),
  waste_category VARCHAR(20) NOT NULL DEFAULT 'NON_HAZARDOUS'
    CHECK (waste_category IN ('HAZARDOUS','NON_HAZARDOUS','RECYCLABLE','ORGANIC')),
  quantity NUMERIC(16,4),
  unit VARCHAR(40),
  disposal_method VARCHAR(120),
  disposal_company VARCHAR(255),
  manifest_number VARCHAR(120),
  disposal_date DATE,
  cost NUMERIC(14,2),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_waste_org ON waste_records(org_id);

-- ============================================================
-- Occupational Health
-- ============================================================
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  record_type VARCHAR(30) NOT NULL
    CHECK (record_type IN ('PRE_EMPLOYMENT','PERIODIC','FITNESS_FOR_DUTY','POST_INCIDENT','EXIT')),
  examination_date DATE,
  examining_physician VARCHAR(255),
  facility VARCHAR(255),
  fitness_status VARCHAR(30) DEFAULT 'PENDING'
    CHECK (fitness_status IN ('FIT','FIT_WITH_RESTRICTIONS','UNFIT','PENDING')),
  restrictions TEXT,
  next_exam_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_medical_org ON medical_records(org_id);
CREATE INDEX idx_medical_user ON medical_records(user_id);
CREATE TRIGGER trg_medical_updated BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE health_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  monitoring_type VARCHAR(20) NOT NULL
    CHECK (monitoring_type IN ('HEAT_STRESS','NOISE','DUST','CHEMICAL','ERGONOMICS')),
  reading_value NUMERIC(16,4),
  unit VARCHAR(40),
  threshold_limit NUMERIC(16,4),
  status VARCHAR(20) DEFAULT 'NORMAL'
    CHECK (status IN ('NORMAL','WARNING','CRITICAL')),
  recorded_at TIMESTAMPTZ,
  location VARCHAR(255),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_health_mon_org ON health_monitoring(org_id);

-- ============================================================
-- Document Management (IMS)
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_number VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  document_type VARCHAR(30) NOT NULL
    CHECK (document_type IN ('POLICY','PROCEDURE','WORK_INSTRUCTION','FORM','RECORD','MANUAL')),
  category VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','REVIEW','APPROVED','SUPERSEDED','OBSOLETE')),
  version VARCHAR(20) DEFAULT '1.0',
  iso_standard VARCHAR(20) DEFAULT 'NONE'
    CHECK (iso_standard IN ('ISO_9001','ISO_14001','ISO_45001','NONE')),
  current_file_path TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  effective_date DATE,
  review_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_org ON documents(org_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version VARCHAR(20),
  file_path TEXT,
  change_summary TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doc_versions_document ON document_versions(document_id);

-- ============================================================
-- Contractor Management
-- ============================================================
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(120),
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  contractor_type VARCHAR(120),
  prequalification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (prequalification_status IN ('PENDING','APPROVED','REJECTED','SUSPENDED')),
  risk_category VARCHAR(20) DEFAULT 'LOW'
    CHECK (risk_category IN ('LOW','MEDIUM','HIGH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contractors_org ON contractors(org_id);
CREATE TRIGGER trg_contractors_updated BEFORE UPDATE ON contractors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE contractor_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  evaluation_date DATE,
  evaluator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  safety_score NUMERIC(6,2),
  quality_score NUMERIC(6,2),
  compliance_score NUMERIC(6,2),
  overall_score NUMERIC(6,2),
  status VARCHAR(20) DEFAULT 'APPROVED'
    CHECK (status IN ('APPROVED','CONDITIONAL','REJECTED')),
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contractor_eval_contractor ON contractor_evaluations(contractor_id);

CREATE TABLE contractor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  document_type VARCHAR(30) NOT NULL
    CHECK (document_type IN ('INSURANCE','LICENSE','CERTIFICATION','SAFETY_PLAN','METHOD_STATEMENT')),
  file_path TEXT,
  expiry_date DATE,
  status VARCHAR(20) DEFAULT 'VALID'
    CHECK (status IN ('VALID','EXPIRED','PENDING')),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contractor_docs_contractor ON contractor_documents(contractor_id);

-- ============================================================
-- Generic audit-log trigger function (attach to key tables)
-- ============================================================
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  BEGIN
    IF TG_OP = 'DELETE' THEN
      v_org_id := OLD.org_id;
    ELSE
      v_org_id := NEW.org_id;
    END IF;
  EXCEPTION WHEN undefined_column THEN
    v_org_id := NULL;
  END;

  INSERT INTO audit_logs(org_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    v_org_id,
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_incidents AFTER INSERT OR UPDATE OR DELETE ON incidents
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER trg_audit_permits AFTER INSERT OR UPDATE OR DELETE ON permits
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER trg_audit_capa AFTER INSERT OR UPDATE OR DELETE ON corrective_actions
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
