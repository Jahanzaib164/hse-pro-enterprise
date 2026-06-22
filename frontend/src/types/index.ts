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

export interface Incident {
  id: string;
  reference_no: string;
  incident_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  title: string;
  description?: string;
  incident_date?: string;
  location?: string;
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
