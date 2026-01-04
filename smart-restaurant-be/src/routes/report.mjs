import { Router } from "express";
import ReportController from "../controllers/ReportController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();

// Middleware: Chỉ admin và staff có restaurantId mới được truy cập reports
router.use(authMiddleware);

// [GET] /api/reports/summary - Thống kê tổng quan
router.get("/summary", ReportController.getSummary);

// [GET] /api/reports/revenue-over-time - Doanh thu theo thời gian
router.get("/revenue-over-time", ReportController.getRevenueOverTime);

// [GET] /api/reports/peak-hours - Giờ cao điểm
router.get("/peak-hours", ReportController.getPeakHours);

// [GET] /api/reports/peak-hours/:hour/details - Chi tiết giờ cao điểm
router.get("/peak-hours/:hour/details", ReportController.getPeakHourDetails);

// [GET] /api/reports/top-items - Món bán chạy nhất
router.get("/top-items", ReportController.getTopItems);

// [GET] /api/reports/item-details/:itemId - Chi tiết món ăn
router.get("/item-details/:itemId", ReportController.getItemDetails);

// [GET] /api/reports/export/pdf - Export PDF
router.get("/export/pdf", ReportController.exportPDF);

// [GET] /api/reports/export/csv - Export CSV
router.get("/export/csv", ReportController.exportCSV);

export default router;
