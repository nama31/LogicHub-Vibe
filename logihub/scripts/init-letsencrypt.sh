#!/bin/bash
set -e

# Configuration
# ==========================================
# CHANGE THESE VALUES BEFORE RUNNING IN PRODUCTION
DOMAINS=("yourdomain.com" "www.yourdomain.com")
EMAIL="your_email@example.com" # Adding a valid address is strongly recommended
STAGING=1 # Set to 1 if you're testing your setup to avoid hitting request limits
# ==========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_PATH="$PROJECT_DIR/certbot"
RSA_KEY_SIZE=4096

cd "$PROJECT_DIR"

if [ -d "$DATA_PATH" ]; then
  read -p "Existing data found for $DOMAINS. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

echo "### Downloading recommended TLS parameters ..."
mkdir -p "$DATA_PATH/conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$DATA_PATH/conf/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$DATA_PATH/conf/ssl-dhparams.pem"
echo

echo "### Creating dummy certificate for $DOMAINS ..."
path="/etc/letsencrypt/live/$DOMAINS"
mkdir -p "$DATA_PATH/conf/live/$DOMAINS"
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "### Starting nginx ..."
docker compose up --force-recreate -d nginx
echo

echo "### Deleting dummy certificate for $DOMAINS ..."
docker compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$DOMAINS && \
  rm -Rf /etc/letsencrypt/archive/$DOMAINS && \
  rm -Rf /etc/letsencrypt/renewal/$DOMAINS.conf" certbot
echo

echo "### Requesting Let's Encrypt certificate for $DOMAINS ..."
# Join $DOMAINS to -d args
domain_args=""
for domain in "${DOMAINS[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$EMAIL" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $EMAIL" ;;
esac

# Enable staging mode if needed
if [ $STAGING != "0" ]; then staging_arg="--staging"; fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Reloading nginx ..."
docker compose exec nginx nginx -s reload
