#!/bin/sh
set -e

echo "Setting up application..."

echo "Creating uploads symlink..."
mkdir -p /app/public/uploads
mkdir -p /app/.output/public


echo "Setting permissions for uploads directory..."
chown -R node:node /app/public/uploads
chmod -R 755 /app/public/uploads

if [ ! -L /app/.output/public/uploads ]; then
    echo "Creating symlink: /app/public/uploads → /app/.output/public/uploads"
    ln -sf /app/public/uploads /app/.output/public/uploads
else
    echo "Symlink already exists"
fi

echo "Verifying symlink..."
ls -la /app/.output/public/ | grep uploads || echo "Symlink not found!"

if command -v bun &> /dev/null; then
    echo "Running database migrations (if any)..."
    bun x prisma db push || echo "Database push failed or not needed"
else
    npx prisma db push || echo "Database push failed or not needed"
fi

if [ "$RUN_SEED" = "true" ]; then
    echo "Running database seed..."
    if command -v bun &> /dev/null; then
        bun x prisma db seed
    else
        npx prisma db seed
    fi
fi

echo "Starting application..."
exec "$@"
