# ==============================================================================
# Multi-Stage Dockerfile for FinSentinel AI Frontend (React 19 + Vite + Nginx)
# ==============================================================================

# Stage 1: Build Static Assets
FROM node:22-alpine AS builder
WORKDIR /app

# Cache node dependencies
COPY package*.json ./
RUN npm ci

# Copy sources and compile production bundle
COPY . .
RUN npm run build

# Stage 2: Minimal Production Nginx Runner
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Clean default Nginx assets
RUN rm -rf ./*

# Copy compiled SPA bundle
COPY --from=builder /app/dist .

# Add Nginx SPA routing configuration
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
