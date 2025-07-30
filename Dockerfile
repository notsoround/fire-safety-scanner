# Multi-stage Docker build for Fire Safety Scanner

# Backend build stage
FROM python:3.11-slim as backend-builder

WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Frontend build stage
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy frontend source code
COPY frontend/ .

# Build the frontend
RUN yarn build

# Production stage
FROM python:3.11-slim as production

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy backend files
COPY backend/ ./backend/
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create necessary directories
RUN mkdir -p /var/log/supervisor
RUN mkdir -p /var/log/nginx

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV NODE_ENV=production

# Expose ports
EXPOSE 80 8001

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]