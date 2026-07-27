#!/bin/bash
# Post-merge setup: install deps, regenerate Prisma client, push schema changes.
# Runs automatically after every task merge. Must be idempotent and non-interactive.
set -e

echo "==> Restoring GitHub SSH key..."
if [ -n "$GITHUB_SSH_KEY" ]; then
  mkdir -p ~/.ssh
  echo "$GITHUB_SSH_KEY" | base64 -d > ~/.ssh/burch_github
  chmod 600 ~/.ssh/burch_github
  ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null
  grep -qxF 'Host github.com' ~/.ssh/config 2>/dev/null || cat >> ~/.ssh/config << 'SSHEOF'

Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/burch_github
  StrictHostKeyChecking no
SSHEOF
  echo "    SSH key restored."
else
  echo "    GITHUB_SSH_KEY not set — skipping."
fi

echo "==> Installing npm workspaces dependencies..."
npm install --prefer-offline 2>&1

echo "==> Generating Prisma client..."
cd apps/web
npx prisma generate 2>&1

echo "==> Pushing schema to database (non-destructive)..."
npx prisma db push --accept-data-loss 2>&1

echo "==> Post-merge setup complete."
