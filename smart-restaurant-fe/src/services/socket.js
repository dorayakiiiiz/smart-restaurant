import { io } from "socket.io-client";

// URL Backend
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false, // Chỉ connect khi cần thiết,
    transports: ['websocket']
});