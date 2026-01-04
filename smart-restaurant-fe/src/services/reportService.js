import api from "./api";

// [GET] /api/reports/summary - Lấy thống kê tổng quan
const getSummary = async (
  period = "week",
  startDate = null,
  endDate = null
) => {
  const params = { period };
  if (period === "custom" && startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  return api.get("/reports/summary", { params });
};

// [GET] /api/reports/revenue-over-time - Lấy doanh thu theo thời gian
const getRevenueOverTime = async (
  period = "week",
  groupBy = "daily",
  startDate = null,
  endDate = null
) => {
  const params = { period, groupBy };
  if (period === "custom" && startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  return api.get("/reports/revenue-over-time", { params });
};

// [GET] /api/reports/peak-hours - Lấy thống kê giờ cao điểm
const getPeakHours = async (
  period = "week",
  startDate = null,
  endDate = null
) => {
  const params = { period };
  if (period === "custom" && startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  return api.get("/reports/peak-hours", { params });
};

// [GET] /api/reports/top-items - Lấy danh sách món bán chạy nhất
const getTopItems = async (
  period = "week",
  limit = 10,
  startDate = null,
  endDate = null
) => {
  const params = { period, limit };
  if (period === "custom" && startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  return api.get("/reports/top-items", { params });
};

const getPeakHourDetails = async (
  hour,
  period = "week",
  startDate = null,
  endDate = null
) => {
  const params = { period };
  if (period === "custom" && startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  return api.get(`/reports/peak-hours/${hour}/details`, { params });
};

// [GET] /api/reports/item-details/:itemId - Lấy chi tiết món ăn
const getItemDetails = async (
  itemId,
  period = "week",
  startDate = null,
  endDate = null
) => {
  const params = { period };
  if (period === "custom" && startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  return api.get(`/reports/item-details/${itemId}`, { params });
};

// [GET] /api/reports/export/pdf - Export PDF
const exportPDF = async (period = "week", startDate = null, endDate = null) => {
  const params = { period };
  if (period === "custom" && startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  return api.get("/reports/export/pdf", {
    params,
    responseType: "blob", // Important for file download
  });
};

// [GET] /api/reports/export/csv - Export CSV
const exportCSV = async (period = "week", startDate = null, endDate = null) => {
  const params = { period };
  if (period === "custom" && startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  return api.get("/reports/export/csv", {
    params,
    responseType: "blob", // Important for file download
  });
};

export const reportService = {
  getSummary,
  getRevenueOverTime,
  getPeakHours,
  getTopItems,
  getPeakHourDetails,
  getItemDetails,
  exportPDF,
  exportCSV,
};
