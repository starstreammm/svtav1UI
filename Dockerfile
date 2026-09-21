FROM nginx:alpine3.24

WORKDIR /app

EXPOSE 80

VOLUME /app/data

# Copy frontend build artifacts
# npm run build has already been run in the frontend build stage, so we can copy the build artifacts directly
COPY build/client /usr/share/nginx/html

# Nginx Entry Point
COPY nginx_entrypoint.sh /usr/local/bin/nginx_entrypoint.sh
RUN chmod +x /usr/local/bin/nginx_entrypoint.sh

# Start Nginx
CMD ["/usr/local/bin/nginx_entrypoint.sh"]
