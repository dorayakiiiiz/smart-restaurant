import { useEffect } from "react";
// import { socket } from "../../services/socket";

export default function WaiterDashboard() {
    
    // TODO: Team Member A code UI ở đây
    // 1. useEffect join room 'restaurant_ID' qua socket
    // 2. Lắng nghe 'new_order_alert' -> Hiển thị thông báo
    // 3. Hiển thị danh sách bàn cần thanh toán / món cần bưng

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Waiter Dashboard</h1>
            <div className="p-10 border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-500">
                Placeholder for Waiter UI (Orders, Tables, Payments)
            </div>
        </div>
    );
}