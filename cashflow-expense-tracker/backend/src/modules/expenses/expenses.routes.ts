import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../utils/schemas.js';
import * as controller from './expenses.controller.js';
import { expenseSchema, listExpensesQuerySchema, updateExpenseSchema } from './expenses.schemas.js';

export const expensesRouter = Router();

expensesRouter.get('/', validate(listExpensesQuerySchema, 'query'), controller.listExpenses);
expensesRouter.get('/:id', validate(idParamSchema, 'params'), controller.getExpenseById);
expensesRouter.post('/', validate(expenseSchema), controller.createExpense);
expensesRouter.put('/:id', validate(idParamSchema, 'params'), validate(updateExpenseSchema), controller.updateExpense);
expensesRouter.delete('/:id', validate(idParamSchema, 'params'), controller.deleteExpense);
