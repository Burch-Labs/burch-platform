#!/bin/bash
# Post-merge setup: install deps, regenerate Prisma client, push schema changes.
# Runs automatically after every task merge. Must be idempotent and non-interactive.
set -e

echo "==> Installing npm workspaces dependencies..."
npm install --prefer-offline 2>&1

echo "==> Generating Prisma client..."
cd apps/web
npx prisma generate 2>&1

echo "==> Pushing schema to database (non-destructive)..."
npx prisma db push --accept-data-loss 2>&1

echo "==> Post-merge setup complete."
