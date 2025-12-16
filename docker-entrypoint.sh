#!/bin/sh
if [ "$RUN_SEED" = "true" ]; then
  echo "Running database seed..."
  bun x prisma db seed
fi
exec "$@"
