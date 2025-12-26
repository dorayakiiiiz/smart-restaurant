class WaiterController {
    
    // [GET] /api/waiter/orders
    // Lấy danh sách các món cần phục vụ (Status: Ready) hoặc chờ duyệt (Status: Pending)
    async getPendingOrders(req, res) {
        // TODO: Team Member A code ở đây
        // 1. Lấy restaurantId từ req.user
        // 2. Query bảng Order tìm các món có status 'ready' (để bưng ra) hoặc 'pending' (để duyệt)
        res.status(200).json({ message: "To be implemented" });
    }

    // [PATCH] /api/waiter/orders/:id/status
    // Cập nhật trạng thái món (VD: Served - Đã phục vụ)
    async updateOrderStatus(req, res) {
        // TODO: Team Member A code ở đây
        // 1. Update status của OrderItem hoặc Order
        // 2. Emit Socket 'order_update' cho khách biết
        res.status(200).json({ message: "To be implemented" });
    }

    // [GET] /api/waiter/tables
    // Lấy sơ đồ bàn và trạng thái (để biết bàn nào đang gọi thanh toán)
    async getTableStatus(req, res) {
        // TODO: Team Member A code ở đây
        res.status(200).json({ message: "To be implemented" });
    }

    // [POST] /api/waiter/checkout/:sessionId
    // Xác nhận thanh toán cho bàn
    async confirmPayment(req, res) {
        // TODO: Team Member A code ở đây
        // 1. Update OrderSession thành 'paid'
        // 2. Giải phóng bàn (Table status -> free)
        res.status(200).json({ message: "To be implemented" });
    }
}

export default new WaiterController();