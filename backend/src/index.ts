import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { Server as SocketServer } from 'socket.io';

import { pool } from './config/database';
import { connectRedis } from './config/redis';
import { setSocketServer } from './services/notificationService';
import { setSocketIO } from './services/socketService';
import { startScheduler } from './services/schedulerService';
import { verifyAccessToken } from './middleware/auth';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import incidentRoutes from './routes/incidents';
import observationRoutes from './routes/observations';
import riskRoutes from './routes/riskAssessments';
import capaRoutes from './routes/corrective-actions';
import auditRoutes from './routes/audits';
import permitRoutes from './routes/permits';
import trainingRoutes from './routes/training';
import emergencyRoutes from './routes/emergency';
import environmentalRoutes from './routes/environmental';
import healthRoutes from './routes/health';
import documentRoutes from './routes/documents';
import contractorRoutes from './routes/contractors';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import uploadRoutes from './routes/upload';
import qrRoutes from './routes/qr';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use('/api', limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use('/api/auth/login', authLimiter);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/risk-assessments', riskRoutes);
app.use('/api/corrective-actions', capaRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/permits', permitRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/environmental', environmentalRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/contractors', contractorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/qr', qrRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Socket.IO
const io = new SocketServer(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
});
setSocketServer(io);
setSocketIO(io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const user = verifyAccessToken(token);
    (socket.data as any).user = user;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const user = (socket.data as any).user;
  if (user) {
    socket.join(`user:${user.id}`);
    socket.join(`org:${user.org_id}`);
    if (user.role) socket.join(`role:${user.org_id}:${user.role}`);
  }
});

async function start(): Promise<void> {
  await connectRedis();
  try {
    await pool.query('SELECT 1');
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
  startScheduler();
  server.listen(PORT, () => {
    console.log(`HSE Pro backend listening on port ${PORT}`);
  });
}

start();

export { app, server };
