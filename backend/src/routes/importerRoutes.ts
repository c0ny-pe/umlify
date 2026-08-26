import { Router } from 'express';
import { importScalaCode } from '../controllers/importerController';
import { validateBody } from '../middlewares/validate';
import { importCodeBodySchema } from '../schemas/requestSchemas';

const router = Router();

router.post('/', validateBody(importCodeBodySchema), importScalaCode);

export default router;
