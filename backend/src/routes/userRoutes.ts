import { Router } from 'express';
import { loginUser, registerUser, getUser, getCurrentUser, logoutUser, updateCurrentUser } from '../controllers/userController';
import { requireAuth } from '../middlewares/auth';
import { validateBody, validateParams } from '../middlewares/validate';
import { userIdParamsSchema, userLoginBodySchema, userRegisterBodySchema, userUpdateBodySchema } from '../schemas/requestSchemas';

const router = Router();

router.post('/register', validateBody(userRegisterBodySchema), registerUser);
router.post('/login', validateBody(userLoginBodySchema), loginUser);
router.post('/logout', logoutUser);
router.get('/me', requireAuth, getCurrentUser);
router.put('/me', requireAuth, validateBody(userUpdateBodySchema), updateCurrentUser);
router.get('/:id', validateParams(userIdParamsSchema), getUser);

export default router;
