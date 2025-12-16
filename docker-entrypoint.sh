#!/bin/sh
bun x prisma db push --skip-generate

if [ "$RUN_SEED" = "true" ]; then
  echo "Running database seed..."
  bun x prisma db seed
fi
exec "$@"
