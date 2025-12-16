#!/bin/sh
bun x prisma db push

if [ "$RUN_SEED" = "true" ]; then
  echo "Running database seed..."
  bun x prisma db seed
fi
exec "$@"
