#!/bin/sh

set -e

CERT="/etc/nginx/certs/cert.crt"
KEY="/etc/nginx/certs/cert.key"
CONF="/etc/nginx/conf.d/default.conf"



# Configure Nginx based on the presence of SSL certificates
if [ -f "$CERT" ] && [ -f "$KEY" ]; then
    echo "SSL certificates found, enabling HTTPS"

    cat > "$CONF" <<EOF
server {
    listen 80;
    server_name _;

    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate $CERT;
    ssl_certificate_key $KEY;
EOF

else
    echo "SSL certificates not found, using HTTP"

    cat > "$CONF" <<EOF
server {
    listen 80;
    server_name _;
EOF

fi

cat >> "$CONF" <<'EOF'

    root /usr/share/nginx/html;
    index index.html;

    # React Router fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF



# Start Nginx in the foreground
exec nginx -g "daemon off;"