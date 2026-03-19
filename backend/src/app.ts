import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

import authRoutes from './modules/auth/auth.routes';
import employeesRoutes from './modules/employees/employees.routes';
import templatesRoutes from './modules/templates/templates.routes';
import documentsRoutes from './modules/documents/documents.routes';
import timeRoutes from './modules/time/time.routes';
import workSchedulesRoutes from './modules/work-schedules/workSchedules.routes';
import absencesRoutes from './modules/absences/absences.routes';
import leavesRoutes from './modules/leaves/leaves.routes';
import leaveTypesRoutes from './modules/leave-types/leaveTypes.routes';
import usersRoutes from './modules/users/users.routes';
import settingsRoutes from './modules/settings/settings.routes';
import publicHolidaysRoutes from './modules/public-holidays/publicHolidays.routes';
import auditLogsRoutes from './modules/audit-logs/auditLogs.routes';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/time-entries', timeRoutes);
app.use('/api/work-schedules', workSchedulesRoutes);
app.use('/api/absences', absencesRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/leave-types', leaveTypesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/public-holidays', publicHolidaysRoutes);
app.use('/api/audit-logs', auditLogsRoutes);

app.use(errorHandler);
