export interface User {
  id: string;
  org_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  job_title?: string;
  phone?: string;
  avatar_url?: string;
  mfa_enabled?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  mfa_required?: boolean;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface Incident {
  id: string;
  reference_no: string;
  incident_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  title: string;
  description?: string;
  incident_date?: string;
  incident_time?: string;
  location?: string;
  gps_lat?: number;
  gps_lng?: number;
  injured_person_name?: string;
  injury_type?: string;
  body_part_affected?: string;
  treatment_provided?: string;
  lost_time_days?: number;
  property_damage_cost?: number;
  root_cause?: string;
  contributing_factors?: string;
  assigned_to?: string;
  created_at: string;
}

export interface Observation {
  id: string;
  reference_no: string;
  observation_type: 'UNSAFE_ACT' | 'UNSAFE_CONDITION' | 'POSITIVE' | 'GOOD_CATCH';
  status: string;
  title: string;
  description?: string;
  location?: string;
  gps_lat?: number;
  gps_lng?: number;
  risk_rating?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  observation_date?: string;
  closed_date?: string;
  assigned_to?: string;
  created_at: string;
}

export interface RiskAssessment {
  id: string;
  reference_no: string;
  assessment_type: 'HIRA' | 'JSA' | 'JHA' | 'ENVIRONMENTAL';
  title: string;
  description?: string;
  activity?: string;
  department?: string;
  status: string;
  review_date?: string;
  created_at: string;
}

export interface CorrectiveAction {
  id: string;
  source_type?: string;
  source_id?: string;
  title: string;
  description?: string;
  action_type?: 'CORRECTIVE' | 'PREVENTIVE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  assigned_to?: string;
  due_date?: string;
  completed_date?: string;
  verified_by?: string;
  verified_date?: string;
  evidence_path?: string;
  created_at: string;
}

export interface Audit {
  id: string;
  reference_no: string;
  audit_type: string;
  title: string;
  status: string;
  planned_date?: string;
  actual_date?: string;
  score?: number;
  max_score?: number;
  compliance_percentage?: number;
  findings_count?: number;
  ncr_count?: number;
  created_at: string;
}

export interface AuditTemplate {
  id: string;
  name: string;
  audit_type: string;
  description?: string;
  category?: string;
  created_at: string;
}

export interface Permit {
  id: string;
  permit_number: string;
  permit_type: string;
  title: string;
  description?: string;
  work_location?: string;
  risk_level: string;
  status: string;
  start_datetime?: string;
  end_datetime?: string;
  precautions?: string;
  ppe_required?: string;
  gas_test_required?: boolean;
  created_at: string;
}

export interface TrainingCourse {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  duration_hours?: number;
  validity_months?: number;
  is_mandatory?: boolean;
  competency_level?: string;
  created_at: string;
}

export interface TrainingRecord {
  id: string;
  user_id?: string;
  course_id?: string;
  status: string;
  start_date?: string;
  completion_date?: string;
  expiry_date?: string;
  score?: number;
  pass_mark?: number;
  training_provider?: string;
  instructor?: string;
  created_at: string;
}

export interface EmergencyPlan {
  id: string;
  plan_type: string;
  title: string;
  description?: string;
  version?: string;
  status: string;
  review_date?: string;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role?: string;
  phone_primary?: string;
  phone_secondary?: string;
  email?: string;
  available_24_7?: boolean;
  created_at: string;
}

export interface EmergencyDrill {
  id: string;
  drill_type: string;
  status: string;
  scheduled_date?: string;
  actual_date?: string;
  duration_minutes?: number;
  participants_count?: number;
  scenario_description?: string;
  objectives?: string;
  results?: string;
  findings?: string;
  lessons_learned?: string;
  created_at: string;
}

export interface EnvironmentalReading {
  id: string;
  reading_type: string;
  value?: number;
  unit?: string;
  reading_date?: string;
  reading_source?: string;
  notes?: string;
  created_at: string;
}

export interface WasteRecord {
  id: string;
  waste_type?: string;
  waste_category: string;
  quantity?: number;
  unit?: string;
  disposal_method?: string;
  disposal_company?: string;
  manifest_number?: string;
  disposal_date?: string;
  cost?: number;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  user_id?: string;
  record_type: string;
  examination_date?: string;
  examining_physician?: string;
  facility?: string;
  fitness_status?: string;
  restrictions?: string;
  next_exam_date?: string;
  notes?: string;
  created_at: string;
}

export interface HealthMonitoring {
  id: string;
  monitoring_type: string;
  reading_value?: number;
  unit?: string;
  threshold_limit?: number;
  status: string;
  recorded_at?: string;
  location?: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  document_number?: string;
  title: string;
  document_type: string;
  category?: string;
  status: string;
  version?: string;
  iso_standard?: string;
  current_file_path?: string;
  effective_date?: string;
  review_date?: string;
  created_at: string;
}

export interface Contractor {
  id: string;
  company_name: string;
  registration_number?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  contractor_type?: string;
  prequalification_status: string;
  risk_category?: string;
  created_at: string;
}

export interface ContractorEvaluation {
  id: string;
  contractor_id: string;
  evaluation_date?: string;
  safety_score?: number;
  quality_score?: number;
  compliance_score?: number;
  overall_score?: number;
  status?: string;
  valid_until?: string;
  notes?: string;
  created_at: string;
}

export interface DashboardKpis {
  totals: {
    incidents: number;
    open_incidents: number;
    observations: number;
    open_observations: number;
    corrective_actions: number;
    overdue_actions: number;
    permits: number;
    active_permits: number;
    completed_training: number;
    audits: number;
  };
  incidents_by_severity: { severity: string; c: number }[];
  lost_time: { days: number; lti_count: number };
}

export interface IncidentTrendPoint {
  month: string;
  total: number;
  near_misses: number;
  incidents: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  read_at?: string | null;
  created_at: string;
}
