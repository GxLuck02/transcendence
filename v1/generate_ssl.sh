#!/bin/bash

# Generate self-signed SSL certificates for development

echo "Generating self-signed SSL certificates..."

mkdir -p nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Transcendence/CN=localhost"

chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem

echo "SSL certificates generated successfully!"
echo "Location: nginx/ssl/"
