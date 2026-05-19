import { Router } from 'express';
import { uploadDiagram, listUserDiagrams, getDiagram, updateDiagramHandler, deleteDiagramHandler } from '../controllers/diagramController';
import { validateBody } from '../middlewares/validate';
import { uploadDiagramBodySchema, updateDiagramBodySchema } from '../schemas/requestSchemas';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// Protected: uses authenticated user
router.post('/', requireAuth, validateBody(uploadDiagramBodySchema), uploadDiagram);
router.get('/', requireAuth, listUserDiagrams);
router.get('/:id', requireAuth, getDiagram);
router.put('/:id', requireAuth, validateBody(updateDiagramBodySchema), updateDiagramHandler);
router.delete('/:id', requireAuth, deleteDiagramHandler);

export default router;
