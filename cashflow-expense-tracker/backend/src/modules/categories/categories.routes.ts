import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../utils/schemas.js';
import * as controller from './categories.controller.js';
import { categorySchema, updateCategorySchema } from './categories.schemas.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', controller.listCategories);
categoriesRouter.post('/', validate(categorySchema), controller.createCategory);
categoriesRouter.put('/:id', validate(idParamSchema, 'params'), validate(updateCategorySchema), controller.updateCategory);
categoriesRouter.delete('/:id', validate(idParamSchema, 'params'), controller.deleteCategory);
