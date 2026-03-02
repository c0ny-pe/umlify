import { Router } from 'express';
import { uploadDiagram, listUserDiagrams } from '../controllers/diagramController';

const router = Router();

router.post('/upload', uploadDiagram);
router.get('/:user_id', listUserDiagrams);

export default router;
