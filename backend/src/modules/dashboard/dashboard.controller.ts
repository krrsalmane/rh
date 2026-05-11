import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getDashboardData(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
