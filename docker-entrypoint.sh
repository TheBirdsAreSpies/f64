#!/bin/sh
set -e

echo "Starting application..."

echo "Creating upload subdirectories..."
mkdir -p /app/public/uploads/photos
mkdir -p /app/public/uploads/thumbnails

# Database setup
echo "Checking database..."
if command -v bun &> /dev/null; then
    bun x prisma db push 2>/dev/null && echo "Database ready" || echo "Database push not needed"
fi

if [ "$RUN_SEED" = "true" ]; then
    echo "Running database seed..."
    bun x prisma db seed
fi

echo "Starting Nuxt application..."
exec "$@"