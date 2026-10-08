import type { Request, Response } from 'express';
import * as service from './budgets.service.js';

export async function listBudgets(_req: Request, res: Response) {
  const data = await service.list(res.locals.userId, res.locals.query.month);
  res.json({ data });
}

export async function createBudget(_req: Request, res: Response) {
  const data = await service.create(res.locals.userId, res.locals.body);
  res.status(201).json({ data });
}

export async function copyBudgets(_req: Request, res: Response) {
  const result = await service.copy(res.locals.userId, res.locals.body);
  res.json(result);
}

export async function updateBudget(_req: Request, res: Response) {
  const data = await service.update(res.locals.userId, res.locals.params.id, res.locals.body.amount);
  res.json({ data });
}

export async function deleteBudget(_req: Request, res: Response) {
  await service.remove(res.locals.userId, res.locals.params.id);
  res.status(204).end();
}
