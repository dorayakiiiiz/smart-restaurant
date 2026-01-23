// ============ HELPER FUNCTIONS FOR REPORTS ============

import Restaurant from "../models/Restaurant.mjs";
import Order from "../models/Order.mjs";
import OrderSession from "../models/OrderSession.mjs";

// Lấy restaurantId từ user
export const getRestaurantId = async (user) => {
  if (user.restaurantId) {
    return user.restaurantId;
  }
  const restaurant = await Restaurant.findOne({ adminId: user._id });
  return restaurant?._id || null;
};

// Lấy sessions đã paid trong khoảng thời gian
export const getPaidSessions = async (restaurantId, startDate, endDate) => {
  return await OrderSession.find({
    restaurantId,
    paymentStatus: "paid",
    endTime: { $gte: startDate, $lte: endDate },
  });
};

// Lấy orders có acceptedAt và readyAt để tính prep time
export const getOrdersForPrepTime = async (
  restaurantId,
  startDate,
  endDate,
) => {
  return await Order.find({
    restaurantId,
    createdAt: { $gte: startDate, $lte: endDate },
    acceptedAt: { $exists: true },
    readyAt: { $exists: true },
  });
};

// Tính toán date range dựa trên period
export const getDateRange = (period, startDate, endDate) => {
  const now = new Date();
  let currentStart, currentEnd, previousStart, previousEnd;

  if (period === "custom" && startDate && endDate) {
    currentStart = new Date(startDate);
    currentEnd = new Date(endDate);
    currentEnd.setHours(23, 59, 59, 999);

    const diffTime = currentEnd - currentStart;
    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);
    previousStart = new Date(previousEnd - diffTime);
  } else if (period === "today") {
    currentStart = new Date(now.setHours(0, 0, 0, 0));
    currentEnd = new Date(now.setHours(23, 59, 59, 999));

    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 1);
    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);
  } else if (period === "yesterday") {
    currentEnd = new Date(now.setHours(0, 0, 0, 0));
    currentEnd.setMilliseconds(-1);
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate());
    currentStart.setHours(0, 0, 0, 0);

    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 1);
    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);
  } else if (period === "week") {
    currentEnd = new Date(now);
    currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 7);

    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);
    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 7);
  } else if (period === "month") {
    currentEnd = new Date(now);
    currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 30);

    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);
    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 30);
  } else {
    // Default: last 7 days
    currentEnd = new Date(now);
    currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 7);

    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);
    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 7);
  }

  return { currentStart, currentEnd, previousStart, previousEnd };
};

// Tính toán metrics từ sessions và orders
export const calculateMetrics = (sessions, orders) => {
  // Total Revenue: Tổng totalAmount từ sessions đã paid
  const totalRevenue = sessions.reduce(
    (sum, session) => sum + (session.totalAmount || 0),
    0,
  );

  // Total Orders: Đếm số sessions đã paid
  const totalOrders = sessions.length;

  // Avg Order Value: Revenue / Orders
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Avg Prep Time: Tính từ tất cả orders có acceptedAt và readyAt
  let totalPrepTime = 0;
  let prepTimeCount = 0;

  orders.forEach((order) => {
    if (order.acceptedAt && order.readyAt) {
      const prepTime =
        (new Date(order.readyAt) - new Date(order.acceptedAt)) / 1000; // seconds
      totalPrepTime += prepTime;
      prepTimeCount++;
    }
  });

  const avgPrepTime =
    prepTimeCount > 0 ? Math.round(totalPrepTime / prepTimeCount) : 0;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    avgPrepTime, // in seconds
  };
};

// Tính % thay đổi giữa current và previous
export const calculateTrend = (current, previous, lowerIsBetter = false) => {
  if (previous === 0) {
    return {
      value: current > 0 ? 100 : 0,
      direction: current > 0 ? "up" : "down",
      isPositive: current > 0 ? !lowerIsBetter : lowerIsBetter,
    };
  }

  const percentChange = ((current - previous) / previous) * 100;
  const roundedChange = Math.round(percentChange * 10) / 10;

  // Nếu lower is better (như prep time), đảo ngược dấu
  const isPositive = lowerIsBetter ? roundedChange < 0 : roundedChange > 0;

  return {
    value: Math.abs(roundedChange),
    direction: roundedChange >= 0 ? "up" : "down",
    isPositive,
  };
};

// Format giờ thành dạng "11 AM", "12 PM"
export const formatHour = (hour) => {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

// Các hàm tiện ích tính toán và xử lý dữ liệu báo cáo doanh thu, đơn hàng, xu hướng
