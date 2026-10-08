import type { Request, Response } from 'express';
import { toCsv, toXlsx } from './reports.export.js';
import type { ExportQuery } from './reports.schemas.js';
import * as service from './reports.service.js';

export async function getReport(_req: Request, res: Response) {
  const data = await service.buildReport(res.locals.userId, res.locals.query);
  res.json({ data });
}

export async function exportReport(_req: Request, res: Response) {
  const query: ExportQuery = res.locals.query;
  const report = await service.buildReport(res.locals.userId, query);
  const suffix = query.period === 'monthly' ? `${query.year}-${String(query.month).padStart(2, '0')}` : `${query.year}`;
  const filename = `expense-report-${suffix}.${query.format}`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  if (query.format === 'xlsx') {
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(await toXlsx(report));
  } else {
    res.type('text/csv; charset=utf-8').send(toCsv(report));
  }
}
