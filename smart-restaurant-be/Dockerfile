# Sử dụng Node.js LTS
FROM node:18-alpine

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json trước để tận dụng cache layer của Docker
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ code nguồn vào image
COPY . .

# Expose port (khớp với port trong .env của bạn)
EXPOSE 5000

# Lệnh chạy ứng dụng
CMD ["npm", "start"]