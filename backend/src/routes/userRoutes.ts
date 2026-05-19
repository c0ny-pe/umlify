import { Router } from 'express';
import { loginUser, registerUser, getUser } from '../controllers/userController';
import { validateBody, validateParams } from '../middlewares/validate';
import { userIdParamsSchema, userLoginBodySchema, userRegisterBodySchema } from '../schemas/requestSchemas';

const router = Router();

router.post('/register', validateBody(userRegisterBodySchema), registerUser);
router.post('/login', validateBody(userLoginBodySchema), loginUser);
router.get('/:id', validateParams(userIdParamsSchema), getUser);

export default router;
