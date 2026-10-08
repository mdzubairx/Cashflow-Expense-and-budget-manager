import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../utils/schemas.js';
import * as controller from './budgets.controller.js';
import { budgetSchema, copyBudgetsSchema, listBudgetsQuerySchema, updateBudgetSchema } from './budgets.schemas.js';

export const budgetsRouter = Router();

budgetsRouter.get('/', validate(listBudgetsQuerySchema, 'query'), controller.listBudgets);
budgetsRouter.post('/', validate(budgetSchema), controller.createBudget);
budgetsRouter.post('/copy', validate(copyBudgetsSchema), controller.copyBudgets);
budgetsRouter.put('/:id', validate(idParamSchema, 'params'), validate(updateBudgetSchema), controller.updateBudget);
budgetsRouter.delete('/:id', validate(idParamSchema, 'params'), controller.deleteBudget);
