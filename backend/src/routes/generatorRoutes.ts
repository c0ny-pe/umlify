import { Router } from 'express';
import { generateCode } from '../controllers/generatorController';

const router = Router();

router.post('/', generateCode);

export default router;