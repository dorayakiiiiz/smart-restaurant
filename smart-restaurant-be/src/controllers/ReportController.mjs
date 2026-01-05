import Order from "../models/Order.mjs";
import OrderSession from "../models/OrderSession.mjs";
import Restaurant from "../models/Restaurant.mjs";
import mongoose from "mongoose";
import { generateSalesReportPDF } from "../utils/pdfGenerator.mjs";
import { generateSalesReportCSV } from "../utils/csvGenerator.mjs";
import { 
    getRestaurantId, 
    getPaidSessions, 
    getOrdersForPrepTime, 
    getDateRange, 
    calculateMetrics, 
    calculateTrend, 
    formatHour 
} from "../utils/reportHelpers.mjs";

class ReportController {
    // [GET] /api/reports/summary
    async getSummary(req, res) {
        try {
            const { period = 'week', startDate, endDate } = req.query;
            
            const restaurantId = await getRestaurantId(req.user);
            if (!restaurantId) {
                return res.status(404).json({ message: "Restaurant not found for this user" });
            }

            const { currentStart, currentEnd, previousStart, previousEnd } = getDateRange(
                period,
                startDate,
                endDate
            );

            const [currentSessions, previousSessions, currentOrders, previousOrders] = await Promise.all([
                getPaidSessions(restaurantId, currentStart, currentEnd),
                getPaidSessions(restaurantId, previousStart, previousEnd),
                getOrdersForPrepTime(restaurantId, currentStart, currentEnd),
                getOrdersForPrepTime(restaurantId, previousStart, previousEnd)
            ]);

            const currentMetrics = calculateMetrics(currentSessions, currentOrders);
            const previousMetrics = calculateMetrics(previousSessions, previousOrders);

            const trends = {
                revenue: calculateTrend(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
                orders: calculateTrend(currentMetrics.totalOrders, previousMetrics.totalOrders),
                avgOrderValue: calculateTrend(currentMetrics.avgOrderValue, previousMetrics.avgOrderValue),
                avgPrepTime: calculateTrend(currentMetrics.avgPrepTime, previousMetrics.avgPrepTime, true)
            };

            res.status(200).json({
                period,
                dateRange: { start: currentStart, end: currentEnd },
                summary: currentMetrics,
                trends,
                comparison: { previous: previousMetrics }
            });
        } catch (error) {
            console.error("Get summary error:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // [GET] /api/reports/revenue-over-time
    async getRevenueOverTime(req, res) {
        try {
            const { period = 'week', groupBy = 'daily', startDate, endDate } = req.query;
            
            const restaurantId = await getRestaurantId(req.user);
            if (!restaurantId) {
                return res.status(404).json({ message: "Restaurant not found for this user" });
            }

            const { currentStart, currentEnd } = getDateRange(period, startDate, endDate);

            const groupByFormat = {
                daily: { $dateToString: { format: "%Y-%m-%d", date: "$endTime" } },
                weekly: { $dateToString: { format: "%Y-W%V", date: "$endTime" } },
                monthly: { $dateToString: { format: "%Y-%m", date: "$endTime" } }
            };

            const revenueData = await OrderSession.aggregate([
                {
                    $match: {
                        restaurantId: mongoose.Types.ObjectId.createFromHexString(restaurantId.toString()),
                        paymentStatus: 'paid',
                        endTime: { $gte: currentStart, $lte: currentEnd }
                    }
                },
                {
                    $group: {
                        _id: groupByFormat[groupBy] || groupByFormat.daily,
                        revenue: { $sum: "$totalAmount" },
                        orderCount: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        date: "$_id",
                        revenue: { $round: ["$revenue", 2] },
                        orderCount: 1,
                        _id: 0
                    }
                },
                { $sort: { date: 1 } }
            ]);

            res.status(200).json({
                period,
                groupBy,
                dateRange: { start: currentStart, end: currentEnd },
                data: revenueData
            });
        } catch (error) {
            console.error("Get revenue over time error:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // [GET] /api/reports/peak-hours
    async getPeakHours(req, res) {
        try {
            const { period = 'week', startDate, endDate } = req.query;
            
            const restaurantId = await getRestaurantId(req.user);
            if (!restaurantId) {
                return res.status(404).json({ message: "Restaurant not found for this user" });
            }

            const { currentStart, currentEnd } = getDateRange(period, startDate, endDate);

            const peakHoursData = await Order.aggregate([
                {
                    $match: {
                        restaurantId: mongoose.Types.ObjectId.createFromHexString(restaurantId.toString()),
                        createdAt: { $gte: currentStart, $lte: currentEnd },
                        status: { $ne: 'rejected' }
                    }
                },
                {
                    $lookup: {
                        from: "ordersessions",
                        localField: "sessionId",
                        foreignField: "_id",
                        as: "session"
                    }
                },
                { $unwind: "$session" },
                { $match: { "session.paymentStatus": "paid" } },
                {
                    $project: {
                        hour: {
                            $hour: {
                                date: "$createdAt",
                                timezone: "Asia/Ho_Chi_Minh"
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$hour",
                        orderCount: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        hour: "$_id",
                        orderCount: 1,
                        _id: 0
                    }
                },
                { $sort: { hour: 1 } }
            ]);

            const formattedData = peakHoursData.map(item => ({
                hour: item.hour,
                hourLabel: formatHour(item.hour),
                orderCount: item.orderCount
            }));

            res.status(200).json({
                period,
                dateRange: { start: currentStart, end: currentEnd },
                data: formattedData
            });
        } catch (error) {
            console.error("Get peak hours error:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // [GET] /api/reports/top-items
    async getTopItems(req, res) {
        try {
            const { period = 'week', limit = 10, startDate, endDate } = req.query;
            
            const restaurantId = await getRestaurantId(req.user);
            if (!restaurantId) {
                return res.status(404).json({ message: "Restaurant not found for this user" });
            }

            const { currentStart, currentEnd, previousStart, previousEnd } = getDateRange(
                period,
                startDate,
                endDate
            );

            const [currentSessions, previousSessions] = await Promise.all([
                getPaidSessions(restaurantId, currentStart, currentEnd),
                getPaidSessions(restaurantId, previousStart, previousEnd)
            ]);

            const currentSessionIds = currentSessions.map(s => s._id);
            const previousSessionIds = previousSessions.map(s => s._id);

            // Lấy top items hiện tại
            const currentTopItems = await Order.aggregate([
                {
                    $match: {
                        restaurantId: mongoose.Types.ObjectId.createFromHexString(restaurantId.toString()),
                        sessionId: { $in: currentSessionIds },
                        status: { $ne: 'rejected' }
                    }
                },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: {
                            menuItemId: "$items.menuItemId",
                            name: "$items.name"
                        },
                        totalQuantity: { $sum: "$items.quantity" },
                        totalRevenue: {
                            $sum: { $multiply: ["$items.price", "$items.quantity"] }
                        },
                        orderCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "menuitems",
                        localField: "_id.menuItemId",
                        foreignField: "_id",
                        as: "menuItem"
                    }
                },
                { $unwind: { path: "$menuItem", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "categories",
                        localField: "menuItem.categoryId",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        menuItemId: "$_id.menuItemId",
                        name: "$_id.name",
                        totalQuantity: 1,
                        totalRevenue: { $round: ["$totalRevenue", 2] },
                        orderCount: 1,
                        category: {
                            _id: "$category._id",
                            name: "$category.name"
                        },
                        image: {
                            $cond: {
                                if: { $gt: [{ $size: { $ifNull: ["$menuItem.images", []] } }, 0] },
                                then: {
                                    $let: {
                                        vars: {
                                            primaryImage: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$menuItem.images",
                                                            as: "img",
                                                            cond: { $eq: ["$$img.isPrimary", true] }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        },
                                        in: {
                                            $ifNull: [
                                                "$$primaryImage.url",
                                                { $arrayElemAt: ["$menuItem.images.url", 0] }
                                            ]
                                        }
                                    }
                                },
                                else: null
                            }
                        },
                        price: "$menuItem.price",
                        _id: 0
                    }
                },
                { $sort: { totalRevenue: -1 } },
                { $limit: parseInt(limit) }
            ]);

            // Lấy revenue map của kỳ trước để tính trend
            const previousItems = await Order.aggregate([
                {
                    $match: {
                        restaurantId: mongoose.Types.ObjectId.createFromHexString(restaurantId.toString()),
                        sessionId: { $in: previousSessionIds },
                        status: { $ne: 'rejected' }
                    }
                },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: {
                            menuItemId: "$items.menuItemId",
                            name: "$items.name"
                        },
                        totalRevenue: {
                            $sum: { $multiply: ["$items.price", "$items.quantity"] }
                        }
                    }
                }
            ]);

            const previousRevenueMap = previousItems.reduce((map, item) => {
                const key = item._id.menuItemId?.toString() || item._id.name;
                map[key] = item.totalRevenue;
                return map;
            }, {});

            // Thêm trend cho mỗi item
            const itemsWithTrend = currentTopItems.map((item, index) => {
                const key = item.menuItemId?.toString() || item.name;
                const previousRevenue = previousRevenueMap[key] || 0;
                const trend = calculateTrend(item.totalRevenue, previousRevenue);

                return {
                    rank: index + 1,
                    ...item,
                    trend
                };
            });

            res.status(200).json({
                period,
                dateRange: { start: currentStart, end: currentEnd },
                data: itemsWithTrend
            });
        } catch (error) {
            console.error("Get top items error:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // [GET] /api/reports/peak-hours/:hour/details
    async getPeakHourDetails(req, res) {
        try {
            const { hour } = req.params;
            const { period = 'week', startDate, endDate } = req.query;
            
            const restaurantId = await getRestaurantId(req.user);
            if (!restaurantId) {
                return res.status(404).json({ message: "Restaurant not found for this user" });
            }

            const { currentStart, currentEnd } = getDateRange(period, startDate, endDate);

            const orders = await Order.aggregate([
                {
                    $match: {
                        restaurantId: mongoose.Types.ObjectId.createFromHexString(restaurantId.toString()),
                        createdAt: { $gte: currentStart, $lte: currentEnd },
                        status: { $ne: 'rejected' }
                    }
                },
                {
                    $addFields: {
                        hourVN: {
                            $hour: {
                                date: "$createdAt",
                                timezone: "Asia/Ho_Chi_Minh"
                            }
                        }
                    }
                },
                { $match: { hourVN: parseInt(hour) } },
                {
                    $lookup: {
                        from: "ordersessions",
                        localField: "sessionId",
                        foreignField: "_id",
                        as: "session"
                    }
                },
                { $unwind: "$session" },
                { $match: { "session.paymentStatus": "paid" } },
                {
                    $lookup: {
                        from: "tables",
                        localField: "session.tableId",
                        foreignField: "_id",
                        as: "table"
                    }
                },
                { $unwind: { path: "$table", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        createdAt: 1,
                        tableName: { $ifNull: ["$table.name", "Unknown"] },
                        itemCount: { $size: "$items" },
                        totalAmount: {
                            $sum: {
                                $map: {
                                    input: "$items",
                                    as: "item",
                                    in: { $multiply: ["$$item.price", "$$item.quantity"] }
                                }
                            }
                        }
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);

            res.status(200).json({
                hour: parseInt(hour),
                hourLabel: formatHour(parseInt(hour)),
                period,
                dateRange: { start: currentStart, end: currentEnd },
                totalOrders: orders.length,
                orders: orders.map(order => ({
                    time: order.createdAt,
                    tableName: order.tableName,
                    itemCount: order.itemCount,
                    amount: Math.round(order.totalAmount * 100) / 100
                }))
            });
        } catch (error) {
            console.error("Get peak hour details error:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // [GET] /api/reports/item-details/:itemId
    async getItemDetails(req, res) {
        try {
            const { itemId } = req.params;
            const { period = 'week', startDate, endDate } = req.query;
            
            const restaurantId = await getRestaurantId(req.user);
            if (!restaurantId) {
                return res.status(404).json({ message: "Restaurant not found for this user" });
            }

            const { currentStart, currentEnd } = getDateRange(period, startDate, endDate);
            const sessions = await getPaidSessions(restaurantId, currentStart, currentEnd);
            const sessionIds = sessions.map(s => s._id);

            const ordersWithItem = await Order.aggregate([
                {
                    $match: {
                        restaurantId: mongoose.Types.ObjectId.createFromHexString(restaurantId.toString()),
                        sessionId: { $in: sessionIds },
                        status: { $ne: 'rejected' }
                    }
                },
                { $unwind: "$items" },
                {
                    $match: {
                        "items.menuItemId": mongoose.Types.ObjectId.createFromHexString(itemId)
                    }
                },
                {
                    $lookup: {
                        from: "ordersessions",
                        localField: "sessionId",
                        foreignField: "_id",
                        as: "session"
                    }
                },
                { $unwind: { path: "$session", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "tables",
                        localField: "session.tableId",
                        foreignField: "_id",
                        as: "table"
                    }
                },
                { $unwind: { path: "$table", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        orderId: "$_id",
                        createdAt: 1,
                        tableName: { $ifNull: ["$table.name", "Unknown"] },
                        quantity: "$items.quantity",
                        price: "$items.price",
                        itemTotal: {
                            $round: [
                                { $multiply: ["$items.price", "$items.quantity"] },
                                2
                            ]
                        },
                        status: 1
                    }
                },
                { $sort: { createdAt: -1 } },
                { $limit: 50 }
            ]);

            res.status(200).json({
                itemId,
                period,
                dateRange: { start: currentStart, end: currentEnd },
                totalOrders: ordersWithItem.length,
                orders: ordersWithItem
            });
        } catch (error) {
            console.error("Get item details error:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // [GET] /api/reports/export/pdf
    async exportPDF(req, res) {
        try {
            const { period = 'week', startDate, endDate } = req.query;
            
            const restaurantId = await getRestaurantId(req.user);
            if (!restaurantId) {
                return res.status(404).json({ message: "Restaurant not found for this user" });
            }

            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found" });
            }

            const { currentStart, currentEnd, previousStart, previousEnd } = getDateRange(
                period,
                startDate,
                endDate
            );

            const [currentSessions, previousSessions, currentOrders, previousOrders] = await Promise.all([
                getPaidSessions(restaurantId, currentStart, currentEnd),
                getPaidSessions(restaurantId, previousStart, previousEnd),
                getOrdersForPrepTime(restaurantId, currentStart, currentEnd),
                getOrdersForPrepTime(restaurantId, previousStart, previousEnd)
            ]);

            const currentMetrics = calculateMetrics(currentSessions, currentOrders);
            const previousMetrics = calculateMetrics(previousSessions, previousOrders);

            const trends = {
                revenue: calculateTrend(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
                orders: calculateTrend(currentMetrics.totalOrders, previousMetrics.totalOrders),
                avgOrderValue: calculateTrend(currentMetrics.avgOrderValue, previousMetrics.avgOrderValue),
                avgPrepTime: calculateTrend(currentMetrics.avgPrepTime, previousMetrics.avgPrepTime, true)
            };

            const currentSessionIds = currentSessions.map(s => s._id);

            const [revenueData, topItems] = await Promise.all([
                OrderSession.aggregate([
                    { $match: { _id: { $in: currentSessionIds } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$endTime" } },
                            revenue: { $sum: "$totalAmount" },
                            orderCount: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            date: "$_id",
                            revenue: { $round: ["$revenue", 2] },
                            orderCount: 1,
                            _id: 0
                        }
                    },
                    { $sort: { date: 1 } }
                ]),
                Order.aggregate([
                    {
                        $match: {
                            restaurantId: restaurant._id,
                            sessionId: { $in: currentSessionIds },
                            status: { $ne: 'rejected' }
                        }
                    },
                    { $unwind: "$items" },
                    {
                        $group: {
                            _id: { name: "$items.name" },
                            totalRevenue: {
                                $sum: { $multiply: ["$items.price", "$items.quantity"] }
                            },
                            totalQuantity: { $sum: "$items.quantity" }
                        }
                    },
                    {
                        $project: {
                            name: "$_id.name",
                            totalRevenue: { $round: ["$totalRevenue", 2] },
                            totalQuantity: 1,
                            _id: 0
                        }
                    },
                    { $sort: { totalRevenue: -1 } },
                    { $limit: 5 }
                ])
            ]);

            const exportData = {
                restaurant,
                period,
                currentStart,
                currentEnd,
                currentMetrics,
                trends,
                revenueData,
                topItems
            };

            generateSalesReportPDF(res, exportData);
        } catch (error) {
            console.error("Export PDF error:", error);
            if (!res.headersSent) {
                res.status(500).json({ message: "Failed to generate PDF", error: error.message });
            }
        }
    }

    // [GET] /api/reports/export/csv
    async exportCSV(req, res) {
        try {
            const { period = 'week', startDate, endDate } = req.query;
            
            const restaurantId = await getRestaurantId(req.user);
            if (!restaurantId) {
                return res.status(404).json({ message: "Restaurant not found for this user" });
            }

            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found" });
            }

            const { currentStart, currentEnd, previousStart, previousEnd } = getDateRange(
                period,
                startDate,
                endDate
            );

            const [currentSessions, previousSessions, currentOrders, previousOrders] = await Promise.all([
                getPaidSessions(restaurantId, currentStart, currentEnd),
                getPaidSessions(restaurantId, previousStart, previousEnd),
                getOrdersForPrepTime(restaurantId, currentStart, currentEnd),
                getOrdersForPrepTime(restaurantId, previousStart, previousEnd)
            ]);

            const currentMetrics = calculateMetrics(currentSessions, currentOrders);
            const previousMetrics = calculateMetrics(previousSessions, previousOrders);

            const trends = {
                revenue: calculateTrend(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
                orders: calculateTrend(currentMetrics.totalOrders, previousMetrics.totalOrders),
                avgOrderValue: calculateTrend(currentMetrics.avgOrderValue, previousMetrics.avgOrderValue),
                avgPrepTime: calculateTrend(currentMetrics.avgPrepTime, previousMetrics.avgPrepTime, true)
            };

            const currentSessionIds = currentSessions.map(s => s._id);

            const [revenueData, topItems] = await Promise.all([
                OrderSession.aggregate([
                    { $match: { _id: { $in: currentSessionIds } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$endTime" } },
                            revenue: { $sum: "$totalAmount" },
                            orderCount: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            date: "$_id",
                            revenue: { $round: ["$revenue", 2] },
                            orderCount: 1,
                            _id: 0
                        }
                    },
                    { $sort: { date: 1 } }
                ]),
                Order.aggregate([
                    {
                        $match: {
                            restaurantId: restaurant._id,
                            sessionId: { $in: currentSessionIds },
                            status: { $ne: 'rejected' }
                        }
                    },
                    { $unwind: "$items" },
                    {
                        $group: {
                            _id: { name: "$items.name" },
                            totalRevenue: {
                                $sum: { $multiply: ["$items.price", "$items.quantity"] }
                            },
                            totalQuantity: { $sum: "$items.quantity" }
                        }
                    },
                    {
                        $project: {
                            name: "$_id.name",
                            totalRevenue: { $round: ["$totalRevenue", 2] },
                            totalQuantity: 1,
                            _id: 0
                        }
                    },
                    { $sort: { totalRevenue: -1 } },
                    { $limit: 10 }
                ])
            ]);

            const exportData = {
                restaurant,
                period,
                currentStart,
                currentEnd,
                currentMetrics,
                trends,
                revenueData,
                topItems
            };

            const csvContent = generateSalesReportCSV(exportData);
            const filename = `Sales_Report_${restaurant.slug || 'restaurant'}_${period}.csv`;

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csvContent);
        } catch (error) {
            console.error("Export CSV error:", error);
            if (!res.headersSent) {
                res.status(500).json({ message: "Failed to generate CSV", error: error.message });
            }
        }
    }
}

export default new ReportController();
