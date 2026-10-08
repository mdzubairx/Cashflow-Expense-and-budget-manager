import type { Request, Response } from 'express';
import { currentMonth } from '../../utils/dates.js';
import * as service from './dashboard.service.js';

export async function getDashboardSummary(_req: Request, res: Response) {
  const month = res.locals.query.month ?? currentMonth();
  const data = await service.getDashboard(res.locals.userId, month);
  res.json({ data });
}
