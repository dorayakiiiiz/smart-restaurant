import { useEffect } from "react";
// import { socket } from "../../services/socket";

export default function KitchenDashboard() {

    // TODO: Team Member B code UI ở đây (KDS Screen)
    // 1. useEffect join room 'restaurant_ID' qua socket
    // 2. Lắng nghe 'new_order_alert' -> Thêm vào list
    // 3. Giao diện thẻ bài (Kanban board) cho các món đang nấu

    return (
        <div className="p-6 bg-gray-900 min-h-screen text-white">
            <h1 className="text-2xl font-bold mb-4 text-[#D4AF37]">Kitchen Display System (KDS)</h1>
            <div className="p-10 border-2 border-dashed border-gray-700 rounded-xl text-center text-gray-500">
                Placeholder for Kitchen UI (Incoming Tickets)
            </div>
        </div>
    );
}