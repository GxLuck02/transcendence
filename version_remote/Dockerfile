# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY frontend/package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY frontend/ .

# Build de production
RUN npm run build

# Stage 2: Production avec Nginx
FROM nginx:alpine

# Copier la configuration nginx
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copier le build depuis le stage précédent
COPY --from=builder /app/dist /usr/share/nginx/html/

# Exposer le port 80
EXPOSE 80

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
