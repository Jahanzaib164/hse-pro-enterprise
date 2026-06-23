import nodemailer, { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

const FROM = `"HSE Pro Enterprise" <${process.env.SMTP_USER || 'noreply@hse-pro.com'}>`;
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function layout(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0}
    .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    .header{background:#0f172a;padding:24px 32px;text-align:center}
    .header h1{color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:.5px}
    .header span{color:#38bdf8;font-size:13px}
    .body{padding:32px}
    .body h2{color:#0f172a;font-size:18px;margin-top:0}
    .body p{color:#374151;line-height:1.6;margin:12px 0}
    .btn{display:inline-block;margin:20px 0;padding:12px 28px;background:#0ea5e9;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px}
    .info-box{background:#f0f9ff;border-left:4px solid #0ea5e9;padding:12px 16px;border-radius:4px;margin:16px 0}
    .info-box p{margin:4px 0;font-size:13px;color:#0369a1}
    .footer{background:#f8fafc;padding:16px 32px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#0f172a;color:#fff;padding:8px 12px;text-align:left;font-size:13px}
    td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151}
    tr:nth-child(even) td{background:#f8fafc}
  </style></head><body>
  <div class="wrap">
    <div class="header"><h1>HSE Pro Enterprise</h1><span>Health, Safety &amp; Environment Management</span></div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>This is an automated message from HSE Pro Enterprise. Do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} HSE Pro Enterprise. All rights reserved.</p>
    </div>
  </div></body></html>`;
}

async function send(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.log(`[email:disabled] "${subject}" → ${to}`);
    return false;
  }
  try {
    await t.sendMail({ from: FROM, to, subject, html });
    return true;
  } catch (err) {
    console.error('Email send failed:', err);
    return false;
  }
}

// Legacy generic
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  return send(to, subject, layout(html));
}

export async function sendWelcomeEmail(user: { email: string; first_name: string; last_name: string; role: string }): Promise<boolean> {
  const html = layout(`
    <h2>Welcome to HSE Pro Enterprise, ${user.first_name}!</h2>
    <p>Your account has been created. You now have access to the HSE Pro Enterprise platform.</p>
    <div class="info-box">
      <p><strong>Name:</strong> ${user.first_name} ${user.last_name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Role:</strong> ${user.role}</p>
    </div>
    <p>Click below to log in to your account:</p>
    <a href="${BASE_URL}/login" class="btn">Log In to HSE Pro</a>
    <p>If you did not expect this email, please contact your system administrator.</p>
  `);
  return send(user.email, 'Welcome to HSE Pro Enterprise', html);
}

export async function sendPasswordResetEmail(user: { email: string; first_name: string }, token: string): Promise<boolean> {
  const link = `${BASE_URL}/reset-password?token=${token}`;
  const html = layout(`
    <h2>Password Reset Request</h2>
    <p>Hello ${user.first_name},</p>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <a href="${link}" class="btn">Reset Password</a>
    <p>This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email or contact your administrator.</p>
    <p style="font-size:12px;color:#9ca3af">If the button doesn't work, copy this URL: ${link}</p>
  `);
  return send(user.email, 'Password Reset – HSE Pro Enterprise', html);
}

export async function sendIncidentAlert(
  incident: { reference_no: string; title: string; severity: string; incident_type: string; location: string },
  assignees: { email: string; first_name: string }[]
): Promise<void> {
  const severityColor: Record<string, string> = { CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#d97706', LOW: '#16a34a' };
  const color = severityColor[incident.severity] || '#374151';
  const html = layout(`
    <h2>New Incident Reported</h2>
    <p>A new incident has been reported and requires your attention.</p>
    <div class="info-box">
      <p><strong>Reference:</strong> ${incident.reference_no}</p>
      <p><strong>Title:</strong> ${incident.title}</p>
      <p><strong>Type:</strong> ${incident.incident_type.replace(/_/g, ' ')}</p>
      <p><strong>Severity:</strong> <span style="color:${color};font-weight:700">${incident.severity}</span></p>
      <p><strong>Location:</strong> ${incident.location}</p>
    </div>
    <a href="${BASE_URL}/incidents" class="btn">View Incident</a>
  `);
  for (const a of assignees) {
    await send(a.email, `[${incident.severity}] New Incident: ${incident.reference_no}`, html);
  }
}

export async function sendActionDueSoonAlert(
  action: { id: string; title: string; due_date: string; priority: string },
  assignee: { email: string; first_name: string }
): Promise<boolean> {
  const html = layout(`
    <h2>Corrective Action Due Soon</h2>
    <p>Hello ${assignee.first_name},</p>
    <p>The following corrective action is due in <strong>3 days</strong>:</p>
    <div class="info-box">
      <p><strong>Action:</strong> ${action.title}</p>
      <p><strong>Priority:</strong> ${action.priority}</p>
      <p><strong>Due Date:</strong> ${new Date(action.due_date).toLocaleDateString()}</p>
    </div>
    <a href="${BASE_URL}/actions/${action.id}" class="btn">View Action</a>
  `);
  return send(assignee.email, `Action Due Soon: ${action.title}`, html);
}

export async function sendActionOverdueAlert(
  action: { id: string; title: string; due_date: string; priority: string },
  assignee: { email: string; first_name: string }
): Promise<boolean> {
  const html = layout(`
    <h2 style="color:#dc2626">⚠ Corrective Action OVERDUE</h2>
    <p>Hello ${assignee.first_name},</p>
    <p>The following corrective action is <strong style="color:#dc2626">OVERDUE</strong> and requires immediate attention:</p>
    <div class="info-box" style="border-color:#dc2626;background:#fef2f2">
      <p><strong>Action:</strong> ${action.title}</p>
      <p><strong>Priority:</strong> ${action.priority}</p>
      <p><strong>Was Due:</strong> ${new Date(action.due_date).toLocaleDateString()}</p>
    </div>
    <a href="${BASE_URL}/actions/${action.id}" class="btn" style="background:#dc2626">Take Action Now</a>
  `);
  return send(assignee.email, `OVERDUE: ${action.title}`, html);
}

export async function sendPermitApprovalRequest(
  permit: { id: string; permit_number: string; title: string; permit_type: string; risk_level: string },
  approver: { email: string; first_name: string }
): Promise<boolean> {
  const html = layout(`
    <h2>Permit to Work – Approval Required</h2>
    <p>Hello ${approver.first_name},</p>
    <p>A Permit to Work is awaiting your approval:</p>
    <div class="info-box">
      <p><strong>Permit #:</strong> ${permit.permit_number}</p>
      <p><strong>Title:</strong> ${permit.title}</p>
      <p><strong>Type:</strong> ${permit.permit_type.replace(/_/g, ' ')}</p>
      <p><strong>Risk Level:</strong> ${permit.risk_level}</p>
    </div>
    <a href="${BASE_URL}/permits/${permit.id}" class="btn">Review &amp; Approve</a>
  `);
  return send(approver.email, `Permit Approval Required: ${permit.permit_number}`, html);
}

export async function sendPermitApproved(
  permit: { id: string; permit_number: string; title: string },
  requester: { email: string; first_name: string }
): Promise<boolean> {
  const html = layout(`
    <h2 style="color:#16a34a">✓ Permit Approved</h2>
    <p>Hello ${requester.first_name},</p>
    <p>Your Permit to Work has been <strong style="color:#16a34a">approved</strong>:</p>
    <div class="info-box" style="border-color:#16a34a;background:#f0fdf4">
      <p><strong>Permit #:</strong> ${permit.permit_number}</p>
      <p><strong>Title:</strong> ${permit.title}</p>
    </div>
    <a href="${BASE_URL}/permits/${permit.id}" class="btn" style="background:#16a34a">View Permit</a>
  `);
  return send(requester.email, `Permit Approved: ${permit.permit_number}`, html);
}

export async function sendPermitRejected(
  permit: { id: string; permit_number: string; title: string },
  requester: { email: string; first_name: string },
  reason: string
): Promise<boolean> {
  const html = layout(`
    <h2 style="color:#dc2626">✗ Permit Rejected</h2>
    <p>Hello ${requester.first_name},</p>
    <p>Your Permit to Work has been <strong style="color:#dc2626">rejected</strong>:</p>
    <div class="info-box" style="border-color:#dc2626;background:#fef2f2">
      <p><strong>Permit #:</strong> ${permit.permit_number}</p>
      <p><strong>Title:</strong> ${permit.title}</p>
      <p><strong>Reason:</strong> ${reason}</p>
    </div>
    <a href="${BASE_URL}/permits/${permit.id}" class="btn" style="background:#dc2626">View Details</a>
    <p>Please revise and resubmit or contact your supervisor.</p>
  `);
  return send(requester.email, `Permit Rejected: ${permit.permit_number}`, html);
}

export async function sendTrainingExpiryAlert(
  record: { course_name: string; expiry_date: string },
  user: { email: string; first_name: string }
): Promise<boolean> {
  const html = layout(`
    <h2>Training Certificate Expiring Soon</h2>
    <p>Hello ${user.first_name},</p>
    <p>The following training certificate will expire in <strong>30 days</strong>:</p>
    <div class="info-box">
      <p><strong>Course:</strong> ${record.course_name}</p>
      <p><strong>Expiry Date:</strong> ${new Date(record.expiry_date).toLocaleDateString()}</p>
    </div>
    <p>Please schedule a renewal to maintain compliance.</p>
    <a href="${BASE_URL}/training/records" class="btn">View Training Records</a>
  `);
  return send(user.email, `Training Expiring: ${record.course_name}`, html);
}

export async function sendSystemOwnerLoginAlert(
  user: { email: string; first_name: string },
  device: string,
  ip: string
): Promise<boolean> {
  const html = layout(`
    <h2 style="color:#dc2626">🔐 SYSTEM_OWNER Login Alert</h2>
    <p>Hello ${user.first_name},</p>
    <p>A login to your SYSTEM_OWNER account was detected:</p>
    <div class="info-box" style="border-color:#dc2626;background:#fef2f2">
      <p><strong>Time:</strong> ${new Date().toUTCString()}</p>
      <p><strong>IP Address:</strong> ${ip}</p>
      <p><strong>Device:</strong> ${device}</p>
    </div>
    <p>If this was not you, immediately revoke all sessions in your profile settings and contact your security team.</p>
    <a href="${BASE_URL}/profile" class="btn" style="background:#dc2626">Review Sessions</a>
  `);
  return send(user.email, '🔐 SYSTEM_OWNER Login Alert – HSE Pro Enterprise', html);
}

export async function sendMFACode(user: { email: string; first_name: string }, code: string): Promise<boolean> {
  const html = layout(`
    <h2>Your MFA Verification Code</h2>
    <p>Hello ${user.first_name},</p>
    <p>Your one-time verification code is:</p>
    <div style="text-align:center;padding:24px;background:#f0f9ff;border-radius:8px;margin:20px 0">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0f172a">${code}</span>
    </div>
    <p>This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
  `);
  return send(user.email, 'HSE Pro – MFA Verification Code', html);
}

export async function sendDrillReminder(
  drill: { id: string; drill_type: string; scheduled_date: string; scenario_description: string },
  participants: { email: string; first_name: string }[]
): Promise<void> {
  const html = layout(`
    <h2>Emergency Drill Reminder</h2>
    <p>This is a reminder that an emergency drill is scheduled:</p>
    <div class="info-box">
      <p><strong>Type:</strong> ${drill.drill_type.replace(/_/g, ' ')} Drill</p>
      <p><strong>Date:</strong> ${new Date(drill.scheduled_date).toLocaleDateString()}</p>
      <p><strong>Scenario:</strong> ${drill.scenario_description}</p>
    </div>
    <p>Please ensure all personnel are aware and prepared.</p>
    <a href="${BASE_URL}/emergency/drills/${drill.id}" class="btn">View Drill Details</a>
  `);
  for (const p of participants) {
    await send(p.email, `Drill Reminder: ${drill.drill_type} – ${new Date(drill.scheduled_date).toLocaleDateString()}`, html);
  }
}

export async function sendAuditScheduled(
  audit: { id: string; reference_no: string; title: string; planned_date: string },
  auditee: { email: string; first_name: string }
): Promise<boolean> {
  const html = layout(`
    <h2>Audit Scheduled</h2>
    <p>Hello ${auditee.first_name},</p>
    <p>An audit has been scheduled that requires your participation:</p>
    <div class="info-box">
      <p><strong>Reference:</strong> ${audit.reference_no}</p>
      <p><strong>Title:</strong> ${audit.title}</p>
      <p><strong>Date:</strong> ${new Date(audit.planned_date).toLocaleDateString()}</p>
    </div>
    <a href="${BASE_URL}/audits/${audit.id}" class="btn">View Audit</a>
  `);
  return send(auditee.email, `Audit Scheduled: ${audit.reference_no}`, html);
}
