#!/bin/bash
# Generate self-signed SSL certificate for development/staging
# For production, replace with Let's Encrypt or your CA-signed cert

SSL_DIR="$(dirname "$0")/../nginx/ssl"
mkdir -p "$SSL_DIR"

DOMAIN="${DOMAIN:-localhost}"

echo "Generating self-signed SSL certificate for: $DOMAIN"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "${SSL_DIR}/privkey.pem" \
  -out "${SSL_DIR}/fullchain.pem" \
  -subj "/C=US/ST=State/L=City/O=HSE Pro Enterprise/OU=IT/CN=${DOMAIN}" \
  -extensions v3_req \
  -addext "subjectAltName=DNS:${DOMAIN},DNS:www.${DOMAIN},IP:127.0.0.1"

chmod 600 "${SSL_DIR}/privkey.pem"
chmod 644 "${SSL_DIR}/fullchain.pem"

echo ""
echo "SSL certificate generated:"
echo "  Certificate: ${SSL_DIR}/fullchain.pem"
echo "  Private key: ${SSL_DIR}/privkey.pem"
echo ""
echo "For production, replace these with real certificates from:"
echo "  - Let's Encrypt (free): https://certbot.eff.org"
echo "  - Your organization's CA"
