import { Router } from 'express';
import { registerUser, getUser } from '../controllers/userController';
import { validateBody, validateParams } from '../middlewares/validate';
import { userIdParamsSchema, userRegisterBodySchema } from '../schemas/requestSchemas';

const router = Router();

router.post('/register', validateBody(userRegisterBodySchema), registerUser);
router.get('/:id', validateParams(userIdParamsSchema), getUser);

export default router;
