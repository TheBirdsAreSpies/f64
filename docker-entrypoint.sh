#!/bin/sh
set -e

echo "Starting application setup..."

echo "Ensuring upload directories exist..."
mkdir -p /app/public/uploads/photos /app/public/uploads/thumbnails 2>/dev/null || true

echo "Setting permissions (chmod only)..."
chmod -R 775 /app/public/uploads 2>/dev/null || true

echo "Ensuring symlink for image processing..."
mkdir -p /app/.output/public
if [ ! -L /app/.output/public/uploads ]; then
    ln -sf /app/public/uploads /app/.output/public/uploads
    echo "Symlink created"
fi

echo "Testing write permissions..."
if touch /app/public/uploads/test-write.txt 2>/dev/null; then
    rm -f /app/public/uploads/test-write.txt
    echo "Write permission OK"
else
    echo "Cannot write to uploads directory"
    echo "Trying alternative approach..."
    
    if [ -d /app/public/uploads ] && [ "$(ls -A /app/public/uploads 2>/dev/null)" ]; then
        echo "Files exist in uploads, testing with subdirectories..."
        chmod 775 /app/public/uploads 2>/dev/null || true
    fi
fi

echo "Checking database..."
if command -v bun &> /dev/null; then
    bun x prisma db push 2>/dev/null && echo "Database ready" || echo "Database push not needed"
else
    npx prisma db push 2>/dev/null && echo "Database ready" || echo "Database push not needed"
fi

if [ "$RUN_SEED" = "true" ]; then
    echo "Running database seed..."
    if command -v bun &> /dev/null; then
        bun x prisma db seed
    else
        npx prisma db seed
    fi
fi

echo "Starting Nuxt application..."
exec "$@"
