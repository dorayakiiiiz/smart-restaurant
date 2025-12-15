import { Router } from "express";
import tableController from "../controllers/TableController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();
router.use(authMiddleware);

router.get('/', tableController.getTables);
router.post('/', tableController.createTable);
router.put('/:id', tableController.updateTable); // Edit
router.delete('/:id', tableController.deleteTable); // Hard Delete
router.patch('/:id/toggle-active', tableController.toggleActive); // Deactivate/Activate
router.post('/:id/regenerate', tableController.regenerateQR); // New QR
router.get('/:id/download-pdf', tableController.downloadPDF); // Download PDF
router.get('/batch/download-zip', tableController.downloadBatchZIP); // Zip
router.get('/batch/download-pdf', tableController.downloadBatchPDF); // Batch PDF
router.get('/:id/download-png', tableController.downloadPNG); // Batch Zip



export default router;