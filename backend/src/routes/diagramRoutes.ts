import { Router } from 'express';
import { uploadDiagram, listUserDiagrams } from '../controllers/diagramController';
import { validateBody, validateParams } from '../middlewares/validate';
import { uploadDiagramBodySchema, userDiagramsParamsSchema } from '../schemas/requestSchemas';

const router = Router();

router.post('/', validateBody(uploadDiagramBodySchema), uploadDiagram);
router.get('/:user_id', validateParams(userDiagramsParamsSchema), listUserDiagrams);

export default router;
