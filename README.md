# Smart Restaurant – Comprehensive Dine-in Management SaaS
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)

> **Web Application Development**
>
> *Comprehensive web-based operating system for modern restaurants*
---
## Introduction

Smart Restaurant là một nền tảng **Software-as-a-Service (SaaS)** được thiết kế nhằm số hóa và tối ưu hóa toàn bộ quy trình vận hành của mô hình nhà hàng dùng bữa tại chỗ (dine-in). Hệ thống thay thế các phương thức gọi món truyền thống bằng giải pháp trải nghiệm kỹ thuật số xuyên suốt: từ lúc khách hàng quét mã QR để gọi món, dữ liệu được đồng bộ realtime xuống bếp, đến khi nhân viên phục vụ nhận thông báo và khách hàng thanh toán trực tuyến.

Hệ thống được phát triển theo mô hình **Client–Server Architecture** liền mạch, với sự tách biệt rõ ràng giữa **Frontend** và **Backend**, ứng dụng các nguyên lý thiết kế phần mềm hiện đại như **Layered Architecture**, **Model–View–Controller (MVC)** và **Event-Driven Architecture (qua Socket.IO)** nhằm đảm bảo tính phản hồi tức thời (real-time realtime synchronization) giữa nhiều giao diện người dùng khác nhau.

## Overview

Smart Restaurant hướng tới việc giải quyết bài toán "nút thắt cổ chai" (bottleneck) trong giờ cao điểm của các nhà hàng. Giải pháp loại bỏ hoàn toàn việc sử dụng menu giấy và ghi chép thủ công. Khách hàng thông qua một **phiên đặt hàng kỹ thuật số (digital session) duy nhất** được liên kết với bàn vật lý có thể gửi yêu cầu trực tiếp đến nhà bếp.

Nền tảng chú trọng vào **Operational Efficiency (hiệu suất vận hành)** và **Customer Experience (trải nghiệm khách hàng)**. Kiến trúc đa khách hàng (multi-tenant) với hệ thống phân quyền phức tạp (**RBAC**) đảm bảo mỗi nhà hàng có thể tùy biến hệ sinh thái của riêng mình, từ hình ảnh, menu đến phương thức thanh toán, mà vẫn hoạt động chung trên một lõi hạ tầng ổn định.

## System Architecture

Dự án được thiết kế phân tách rõ Frontend và Backend, giao tiếp đồng thời qua **RESTful APIs** (cho các tác vụ nghiệp vụ chuẩn) và **WebSockets** (cho các sự kiện theo thời gian thực).

### Client-Side (Frontend)

Frontend của Smart Restaurant được xây dựng bằng **React.js (Vite)** kết hợp **React Query** để quản lý server-state, tối ưu hóa quá trình re-fetching.

#### Presentation Layer
- **Reusable UI Components**: Hệ thống UI thiết kế bằng TailwindCSS (Modals, Buttons, Inputs, Layouts).
- **Role-Specific Pages**: Giao diện được thiết kế chuyên biệt cho 5 Roles: SuperAdmin, Admin (Chủ quán), Kitchen (Nhà bếp), Waiter (Phục vụ), và Customer (Khách hàng).
- **Layouts**: DashboardLayout cho admin, BaseLayout cho khách hàng.

#### Business Logic Layer
- **Context API**: Quản lý Authentication (JWT) và trạng thái Session.
- **WebSocket Client**: Giao tiếp realtime thông qua thư viện `socket.io-client` để nhận tín hiệu cập nhật đơn hàng.

#### Data Layer
- **API Services**: Giao tiếp RESTful tập trung qua Axios (authService, kitchenService, waiterService, orderService).
- **React Query Mutations & Queries**: Quản lý caching và đồng bộ dữ liệu.

### Server-Side (Backend)

Backend được phát triển trên **Node.js và Express.js**, tuân thủ Strict **MVC** nhằm đảm bảo code dễ bảo trì.

#### Routing Layer
Phân luồng request tới các chức năng tương ứng (auth, menu, orders, tables, kitchen).

#### Controller Layer
Xử lý các logic tiếp nhận request, validate dữ liệu (với các helper tĩnh) và trả về response chuẩn hóa.

#### Real-time Event Layer (Socket.IO)
Lõi giao tiếp realtime, nhận các event (đặt món mới, món đã nấu xong) và broadcast (phát sóng) tín hiệu đến các client (bếp, phục vụ) thuộc đúng phòng (room) của từng nhà hàng.

#### Data Access Layer (Models)
Sử dụng **Mongoose ODM** tương tác với **MongoDB** để lưu cấu trúc dữ liệu nhà hàng: User, Restaurant, Table, Category, MenuItem, Order, OrderSession.

#### Middleware Layer
- **AuthMiddleware**: Xác thực JWT Token và **Role-Based Access Control (RBAC)**.
- Xử lý upload ảnh với nền tảng Cloudinary.

#### Third-Party Integrations
- **PayOS API**: Tích hợp thanh toán số, tạo mã QR ngân hàng động.
- **Cloudinary**: Tối ưu hóa phân phối và lưu trữ hình ảnh (Menu, Avatar).
- **Brevo/Nodemailer**: Dịch vụ gửi email (OTP, Reset Password).

## Functional Features and Use Cases

Hệ thống được thiết kế với quyền truy cập (RBAC) nghiêm ngặt gồm 5 vai trò riêng biệt, phủ kín mọi Use Case của một nhà hàng thực tế:

| ID | Feature | Actor | Business Description |
|----|--------|-------|----------------------|
| U001 | Secure Authentication & RBAC | All Users | Đăng nhập/đăng ký với JWT bảo mật. Hệ thống phân luồng người dùng vào đúng Dashboard theo chức vụ (SuperAdmin, Admin, Kitchen, Waiter, Customer). |
| U002 | Restaurant Onboarding | Admin | Thiết lập hệ thống lần đầu cho nhà hàng: thông tin cấu hình, tiền tệ, logo và cổng thanh toán (PayOS). |
| U003 | Menu & Category Management | Admin | Vận hành toàn bộ hệ thống thực đơn: tạo mới món ăn, thêm Modifier (tùy chọn món), cấu hình thời gian chuẩn bị và đặt giá. |
| U004 | Table & QR Code Generation | Admin | Quản lý sơ đồ bàn vật lý. Tự động sinh và tải xuống tệp PDF chứa mã QR định danh cho từng bàn. |
| U005 | Digital Menu & Ordering | Customer | Khách hàng quét mã QR, truy cập phiên đặt món dạng digital, thêm đồ vào giỏ hàng và gửi lệnh gọi món không cần tải app. |
| U006 | Kitchen Display System (KDS) | Kitchen | Giao diện cho nhà bếp hiển thị đơn hàng mới ngay lập tức (no-reloads) nhờ Socket.IO. Đầu bếp có thể cập nhật trạng thái thành "Đang nấu" hoặc "Sẵn sàng phục vụ". |
| U007 | Waiter Real-time Interface | Waiter | Nhận thông báo lập tức về "Đơn hàng đã làm xong", cập nhật trạng thái bàn, và xác nhận đưa đồ ăn ra bàn cho khách. |
| U008 | Cashless Payment via PayOS | Customer/Admin | Tích hợp cổng PayOS để xuất mã chuyển khoản QR động cho từng hóa đơn và xác nhận thanh toán tự động via Webhook. |
| U009 | Restaurant Analytics | Admin | Dashboard quản trị với biểu đồ phân tích dữ liệu bán hàng, số lượng đơn, doanh thu và mặt hàng bán chạy. |
| U010 | Staff Management | Admin | Thêm mới, phân quyền (Bếp/Phục vụ) và quản lý tài khoản nhân viên của nhà hàng. |
| U011 | User Profiles & Order History | Customer | Lưu trữ lịch sử giao dịch bữa ăn, cho phép khách hàng đánh giá (Review) trải nghiệm món ăn và dịch vụ. |
| U012 | System Overview | Super Admin | Quản lý toàn bộ các "tenant" (nhà hàng) đăng ký trên nền tảng, thống kê số lượng Admin và theo dõi tình hình hoạt động chung. |

## Project Structure

Cấu trúc thư mục được thiết kế gọn gàng, chia tách Frontend và Backend theo tiêu chuẩn. Hệ thống được đóng gói Docker với cấu hình `docker-compose.yml` nguyên khối.

```bash
SMART-RESTAURANT/
├── docker-compose.yml          # Môi trường chạy Docker tổng
├── smart-restaurant-be/        # Backend (Node.js / Express.js)
│   ├── src/
│   │   ├── config/             # Cấu hình DB, Cloudinary, PayOS
│   │   ├── controllers/        # Bộ điều khiển RESTful logic
│   │   ├── middleware/         # Middleware bảo vệ Route, Auth
│   │   ├── models/             # Schema MongoDB (Mongoose)
│   │   ├── routes/             # Cấu trúc API Endpoints
│   │   ├── strategies/         # Cấu hình Passport (Google)
│   │   ├── utils/              # Các hàm Helpers, Email, Crypto
│   │   └── index.mjs           # Entry point Backend & cấu hình Socket.IO
│   ├── .env                    # Biến môi trường
│   ├── Dockerfile
│   └── package.json
│
└── smart-restaurant-fe/        # Frontend (React / Vite)
    ├── src/
    │   ├── assets/             # Tài nguyên tĩnh
    │   ├── components/         # Components tái sử dụng (Modals, Layouts, Tables)
    │   ├── context/            # Context API (Auth, OrderSession)
    │   ├── layouts/            # Template bọc giao diện theo Role
    │   ├── pages/              # Giao diện chức năng (Admin, Kitchen, Waiter, v.v.)
    │   ├── routes/             # Routing bảo mật (Protected Routes)
    │   ├── services/           # Xử lý Axios API và khởi tạo Socket.IO Client
    │   ├── utils/              # Validate, Formatters
    │   ├── App.jsx             # Gốc cây Component
    │   └── main.jsx            # Gắn vào DOM
    ├── .env
    ├── Dockerfile
    └── vite.config.js          # Cấu hình Vite
```

## Technology Stack
- Frontend: React.js, Vite, React Query (Server State), TailwindCSS, Context API, Socket.IO-Client, React Router DOM.
- Backend: Node.js, Express.js, Socket.IO (Real-time Engine).
- Database: MongoDB, Mongoose ODM.
- Authentication/Security: JSON Web Token (JWT), Crypto, Role-Based Access Control.
- Third-Party Services: Cloudinary (Media Hosting), PayOS (Vietnamese Payment Gateway), Nodemailer/Brevo.
- Deployment/DevOps: Docker, Docker Compose, Vercel (Front-end preview), Nginx.

## Installation and Setup Guide
Hướng dẫn để chạy thử dự án tại môi trường local.

### Prerequisites
- Node.js (phiên bản 18 LTS trở lên)
- MongoDB Cluster hoặc Local Installation
- Tài khoản Cloudinary (để upload ảnh)
- Tài khoản PayOS (để chạy cổng thanh toán)

### Backend Setup
1. Di chuyển vào thư mục backend và cài đặt dependencies:
```bash
cd smart-restaurant-be
npm install
```

2. Tạo file `.env` với nội dung sau (thay thế bằng thông tin thực tế):
```env
PORT=5000
MONGO_URI=mongodb_connection_string
ACCESS_TOKEN_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_jwt_refresh

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

PAYOS_CLIENT_ID=your_payos_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_checksum

EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

3. Khởi động server:
```bash
npm run dev
```

Backend và Socket.IO server sẽ lắng nghe trên cổng 5000.

### Frontend Setup
1. Di chuyển vào thư mục frontend và cài đặt dependencies:
```bash
cd smart-restaurant-fe
npm install
```

2. Tạo file `.env` với nội dung sau:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_CLIENT_URL=http://localhost:5173
```

3. Khởi động ứng dụng Vite:
```bash
npm run dev
```

Ứng dụng sẽ chạy trên `http://localhost:5173`.

### 🚀 Running via Docker (Optional)
1. Đảm bảo Docker đã được cài đặt và đang chạy trên máy của bạn.
2. Từ thư mục gốc của dự án, chạy lệnh sau để khởi động toàn bộ hệ thống:
```bash
docker-compose up --build
```
Toàn bộ backend, frontend và MongoDB sẽ được khởi động trong các container riêng biệt. Backend sẽ lắng nghe trên cổng 5000, frontend trên cổng 5173.

## Conclusion
Smart Restaurant là một giải pháp toàn diện, hiện đại và thực tế cho các nhà hàng muốn nâng cao trải nghiệm khách hàng và tối ưu hóa vận hành. Với kiến trúc vững chắc, tính năng phong phú và tích hợp sâu với các dịch vụ bên thứ ba, nền tảng này sẵn sàng đáp ứng mọi nhu cầu của một nhà hàng hiện đại trong thời đại số hóa.