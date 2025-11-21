# SSL Certificates

## Pour générer les certificats auto-signés:

### Option 1: Avec OpenSSL (si installé)
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Transcendence/CN=localhost"
```

### Option 2: Avec Docker
```bash
docker run --rm -v $(pwd)/nginx/ssl:/ssl alpine/openssl req \
  -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /ssl/key.pem \
  -out /ssl/cert.pem \
  -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Transcendence/CN=localhost"
```

### Option 3: Script fourni
```bash
./generate_ssl.sh
```

## Note
Les certificats auto-signés sont OK pour le développement.
Le navigateur affichera un avertissement de sécurité - c'est normal.
Cliquez sur "Avancé" puis "Continuer vers le site".
