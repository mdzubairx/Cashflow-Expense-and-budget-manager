import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import * as controller from './reports.controller.js';
import { exportQuerySchema, reportQuerySchema } from './reports.schemas.js';

export const reportsRouter = Router();

reportsRouter.get('/', validate(reportQuerySchema, 'query'), controller.getReport);
reportsRouter.get('/export', validate(exportQuerySchema, 'query'), controller.exportReport);
