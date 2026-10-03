#!/bin/bash
set -e

# Configure Apache port if Koyeb provides PORT env
if [ -n "$PORT" ]; then
    sed -i "s/80/$PORT/g" /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf
fi

# Ensure storage framework directories exist
mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache || true
chmod -R 775 storage bootstrap/cache || true

# Run package discovery
php artisan package:discover --ansi || true

# Link storage
php artisan storage:link || true

# Touch installed marker
touch storage/installed || true

# Run migrations if DB is configured
if [ -n "$DB_HOST" ]; then
    echo "Running database migrations..."
    php artisan migrate --force || true
    echo "Running database seeders..."
    php artisan db:seed --force || true
fi

# Cache optimizations
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

exec apache2-foreground
