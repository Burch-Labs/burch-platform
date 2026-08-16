#!/bin/bash
set -e

# Install all dependencies from root (ensures lockfile versions are used)
npm install --prefer-offline

# Push any schema changes to the database.
#
# Deliberately WITHOUT --accept-data-loss. That flag lets Prisma drop a column
# or table to match the schema without asking, and this script runs
# automatically on every merge — so a field removed in a pull request would
# silently delete that column's contents on whatever database this is pointed
# at, bookings and payments included, with no prompt and no backup.
#
# Without the flag a destructive change makes this script fail instead. A failed
# deploy is recoverable in minutes; a dropped column is not recoverable at all.
# If a push legitimately needs to drop something, run it by hand, after a
# pg_dump, having looked at what it intends to do.
cd apps/web
npx prisma db push
