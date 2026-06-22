# HSE Pro Enterprise

A production-ready Enterprise Health, Safety & Environment (HSE) Management System.

## Features

- **Incident Management** — incidents, near-misses, investigations (5-Why / fishbone), witnesses, attachments
- **Hazard Observations** — unsafe acts/conditions, positive observations, QR-code reporting
- **Risk Assessment** — HIRA / JSA / JHA with before/after risk scoring
- **CAPA** — corrective & preventive actions tied to any source
- **Audits & Inspections** — templates, findings, NCRs, compliance scoring
- **Permit To Work** — hot work, confined space, electrical, lifting, work at height with multi-step approvals
- **Training** — courses, records, competency matrix, certificate expiry tracking
- **Emergency Management** — plans, contacts, drills
- **Environmental** — readings, waste tracking
- **Occupational Health** — medical records, exposure monitoring
- **Document Management (IMS)** — ISO 9001 / 14001 / 45001 controlled documents and versions
- **Contractor Management** — prequalification, evaluations, document validity
- **Dashboard** — real-time KPIs aggregated across all modules, incident trend charts
- **Security** — JWT access + refresh tokens, TOTP MFA, RBAC, audit logging, account lockout

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Next.js 15, React 18, TypeScript, TailwindCSS, Recharts, React Query, Axios |
| Backend  | Node.js, Express, TypeScript, Socket.IO |
| Database | PostgreSQL 16 |
| Cache    | Redis 7 |
| Auth     | JWT, refresh tokens, TOTP MFA (speakeasy) |
| Storage  | Local disk + S3-compatible |
| Deploy   | Docker, Docker Compose, Nginx |

## Project Structure

```
hse-pro-enterprise/
├── frontend/          # Next.js 15 app
├── backend/           # Express.js API
├── database/          # schema.sql + seed.sql
├── nginx/             # reverse proxy config
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

## Quick Start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Through Nginx: http://localhost

The database schema and seed data load automatically on first start.

## Demo Credentials

| Role           | Email                  | Password      |
|----------------|------------------------|---------------|
| System Owner   | admin@hse-pro.com      | Password123!  |
| Org Admin      | org.admin@acme.com     | Password123!  |
| Safety Officer | safety@acme.com        | Password123!  |
| Supervisor     | supervisor@acme.com    | Password123!  |
| Worker         | worker@acme.com        | Password123!  |

## Local Development

### Backend
```bash
cd backend
npm install
npm run dev      # ts-node-dev on :3001
npm run typecheck
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Next.js on :3000
```

## API Overview

All routes are under `/api`. Protected routes require `Authorization: Bearer <accessToken>`.

- `POST /api/auth/login` — login (returns access + refresh tokens; supports MFA)
- `POST /api/auth/refresh` — rotate access token
- `POST /api/auth/mfa/setup` — generate TOTP secret + QR
- `GET  /api/dashboard/kpis` — aggregated KPIs
- `GET  /api/dashboard/incident-trend` — 12-month trend
- CRUD under `/api/incidents`, `/api/observations`, `/api/risk-assessments`,
  `/api/corrective-actions`, `/api/audits`, `/api/permits`, `/api/training`,
  `/api/emergency`, `/api/environmental`, `/api/health`, `/api/documents`,
  `/api/contractors`
- `GET /api/reports/export/:entity` — CSV export

## Security Notes

- Change all secrets in `.env` before production.
- All data is scoped by `org_id` for multi-tenancy.
- Mutating actions on key entities are recorded in `audit_logs` (app + DB triggers).
