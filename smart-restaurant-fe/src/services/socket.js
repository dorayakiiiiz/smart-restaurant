import { io } from "socket.io-client";

// URL Backend
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false // Chỉ connect khi cần thiết
});