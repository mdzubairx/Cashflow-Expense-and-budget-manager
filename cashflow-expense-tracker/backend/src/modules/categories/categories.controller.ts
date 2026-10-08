import type { Request, Response } from 'express';
import * as service from './categories.service.js';

export async function listCategories(_req: Request, res: Response) {
  const data = await service.list(res.locals.userId);
  res.json({ data });
}

export async function createCategory(_req: Request, res: Response) {
  const data = await service.create(res.locals.userId, res.locals.body);
  res.status(201).json({ data });
}

export async function updateCategory(_req: Request, res: Response) {
  const data = await service.update(res.locals.userId, res.locals.params.id, res.locals.body);
  res.json({ data });
}

export async function deleteCategory(_req: Request, res: Response) {
  await service.remove(res.locals.userId, res.locals.params.id);
  res.status(204).end();
}
