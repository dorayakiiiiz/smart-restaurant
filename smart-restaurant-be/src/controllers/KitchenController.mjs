class KitchenController {

    // [GET] /api/kitchen/orders
    // Lấy danh sách món cần nấu (Status: Confirmed/Preparing)
    async getIncomingOrders(req, res) {
        // TODO: Team Member B code ở đây
        // 1. Query Order tìm các món status 'accepted' hoặc 'preparing'
        // 2. Sort theo thời gian (cũ nhất lên đầu)
        res.status(200).json({ message: "To be implemented" });
    }

    // [PATCH] /api/kitchen/orders/:itemId/status
    // Bếp cập nhật: Đang nấu -> Xong (Ready)
    async updateItemStatus(req, res) {
        // TODO: Team Member B code ở đây
        // 1. Update status món ăn
        // 2. Emit Socket 'order_update' (báo Waiter bưng, báo Khách vui)
        res.status(200).json({ message: "To be implemented" });
    }

    // [GET] /api/kitchen/history
    // Xem lịch sử các món đã nấu xong trong ngày
    async getHistory(req, res) {
        // TODO: Team Member B code ở đây
        res.status(200).json({ message: "To be implemented" });
    }
}

export default new KitchenController();