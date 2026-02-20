# --- Stage 1: Build ---
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Nhận biến môi trường tại thời điểm build (Vite cần cái này để bake vào code JS)
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_CLIENT_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_CLIENT_URL=$VITE_CLIENT_URL

RUN npm run build

# --- Stage 2: Serve bằng Nginx ---
FROM nginx:alpine as production-stage

# Copy folder dist đã build sang thư mục html của Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy file cấu hình nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]