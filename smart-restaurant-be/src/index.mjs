import express from 'express'
import cors from 'cors'
import passport from 'passport'
import cookiePaser from 'cookie-parser'


import { configDotenv } from "dotenv";
import { createServer } from "http"; // Import http server
import { Server } from "socket.io"; // Import Socket.IO

configDotenv();

import dbConnect from "./config/db/index.mjs";
import route from "./routes/index.mjs";

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Tạo HTTP Server từ Express App
const httpServer = createServer(app);

// 2. Cấu hình Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "https://wad-smart-restaurant.vercel.app"],
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
        credentials: true
    }
});

// 3. Socket Connection Logic
io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Customer join room theo Session ID (để nhận update trạng thái món)
    socket.on("join_session", (sessionId) => {
        socket.join(`session_${sessionId}`);
        console.log(`Socket ${socket.id} joined session_${sessionId}`);
    });

    // Waiter/Kitchen join room theo Restaurant ID (để nhận order mới)
    socket.on("join_restaurant", (restaurantId) => {
        socket.join(`restaurant_${restaurantId}`);
        console.log(`Socket ${socket.id} joined restaurant_${restaurantId}`);
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});

// Lưu io vào app để dùng trong Controller
app.set("socketio", io);

// connect to database
dbConnect();

// Init passport
app.use(passport.initialize())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
    "http://localhost:5173", // frontend dev
    'https://wad-smart-restaurant.vercel.app'
];

const corsOptions = {
    origin: allowedOrigins, 
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// route app
route(app);

// app.listen(PORT, () => {
//   console.log(`App listening on port ${PORT}`);
// });

// Dùng httpServer.listen thay vì app.listen
httpServer.listen(PORT, () => {
	console.log(`Server & Socket.IO running on port ${PORT}`);
});