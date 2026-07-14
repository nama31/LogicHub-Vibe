FROM nginx:alpine

# Install openssl to generate self-signed certificate
RUN apk add --no-cache openssl

# Create directory for ssl certificates
RUN mkdir -p /etc/nginx/ssl

# Generate a self-signed certificate valid for 365 days
RUN openssl req -x509 -nodes -days 365 \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
    -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/localhost.key \
    -out /etc/nginx/ssl/localhost.crt

# Copy the configuration file
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
