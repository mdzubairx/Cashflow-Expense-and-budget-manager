import type { Request, Response } from 'express';
import * as service from './expenses.service.js';

export async function listExpenses(_req: Request, res: Response) {
  const result = await service.list(res.locals.userId, res.locals.query);
  res.json(result);
}

export async function getExpenseById(_req: Request, res: Response) {
  const data = await service.getById(res.locals.userId, res.locals.params.id);
  res.json({ data });
}

export async function createExpense(_req: Request, res: Response) {
  const data = await service.create(res.locals.userId, res.locals.body);
  res.status(201).json({ data });
}

export async function updateExpense(_req: Request, res: Response) {
  const data = await service.update(res.locals.userId, res.locals.params.id, res.locals.body);
  res.json({ data });
}

export async function deleteExpense(_req: Request, res: Response) {
  await service.remove(res.locals.userId, res.locals.params.id);
  res.status(204).end();
}
