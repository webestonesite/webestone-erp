#!/bin/bash
set -e

# Configure Apache port if Koyeb provides PORT env
if [ -n "$PORT" ]; then
    sed -i "s/80/$PORT/g" /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf
fi

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
