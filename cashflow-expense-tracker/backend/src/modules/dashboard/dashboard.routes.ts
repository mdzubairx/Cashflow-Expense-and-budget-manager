import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { isoMonth } from '../../utils/schemas.js';
import * as controller from './dashboard.controller.js';

const querySchema = z.object({ month: isoMonth.optional() });

export const dashboardRouter = Router();

dashboardRouter.get('/', validate(querySchema, 'query'), controller.getDashboardSummary);
