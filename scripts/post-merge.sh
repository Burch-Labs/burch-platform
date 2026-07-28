#!/bin/bash
set -e

# Install all dependencies from root (ensures lockfile versions are used)
npm install --prefer-offline

# Push any schema changes to the database
cd apps/web
npx prisma db push --accept-data-loss
