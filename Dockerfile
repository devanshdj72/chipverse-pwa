# Stage 1: Build the React application
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency files first for better Docker caching
COPY package.json package-lock.json ./

# Install exact dependencies
RUN npm ci

# Copy application source
COPY . .

# Build the Vite application
RUN npm run build


# Stage 2: Serve the production build
FROM nginx:alpine

# Copy the built React application
COPY --from=builder /app/dist /usr/share/nginx/html

# Use custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# React/Vite application will be served by NGINX
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]