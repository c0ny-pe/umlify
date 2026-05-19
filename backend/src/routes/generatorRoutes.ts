import { Router } from 'express';
import { generateCode } from '../controllers/generatorController';
import { validateBody } from '../middlewares/validate';
import { generateCodeBodySchema } from '../schemas/requestSchemas';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.post('/', requireAuth, validateBody(generateCodeBodySchema), generateCode);

export default router;