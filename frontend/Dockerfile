# Stage 1: Build aplikasi React/Vite
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Melakukan build file statis ke folder /app/dist
RUN npm run build

# Stage 2: Serve aplikasi menggunakan Nginx Web Server
FROM nginx:alpine

# Copy hasil build dari stage 1 ke folder HTML Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy konfigurasi Nginx kamu ke dalam container
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
