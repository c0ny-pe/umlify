import { Router } from 'express';
import { generateCode } from '../controllers/generatorController';
import { validateBody } from '../middlewares/validate';
import { generateCodeBodySchema } from '../schemas/requestSchemas';

const router = Router();

router.post('/', validateBody(generateCodeBodySchema), generateCode);

export default router;