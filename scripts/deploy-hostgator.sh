#!/bin/bash

# Burch Platform - Hostgator Deployment Script
# Usage: ./scripts/deploy-hostgator.sh [FTP_HOST] [FTP_USER] [FTP_PASS]

set -e

echo "🚀 Burch Platform - Hostgator Deployment"
echo "========================================"

# Check arguments
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
  echo "Usage: ./scripts/deploy-hostgator.sh [FTP_HOST] [FTP_USER] [FTP_PASS]"
  echo ""
  echo "Example:"
  echo "  ./scripts/deploy-hostgator.sh ftp.yourdomain.com cpaneluser password123"
  echo ""
  exit 1
fi

FTP_HOST=$1
FTP_USER=$2
FTP_PASS=$3

echo "📝 Configuration:"
echo "  FTP Host: $FTP_HOST"
echo "  FTP User: $FTP_USER"
echo "  FTP Pass: ****"
echo ""

# Step 1: Build the application
echo "1️⃣  Building Next.js application..."
cd apps/web
npm run build
echo "✅ Build complete"
echo ""

# Step 2: Create deployment package
echo "2️⃣  Preparing deployment files..."
cd ../..

# Create temp directory
DEPLOY_DIR="./hostgator-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy .next folder
echo "   - Copying Next.js build files..."
cp -r apps/web/.next $DEPLOY_DIR/

# Copy public folder
if [ -d "apps/web/public" ]; then
  echo "   - Copying public assets..."
  cp -r apps/web/public $DEPLOY_DIR/
fi

# Copy .htaccess
echo "   - Copying .htaccess configuration..."
cp .htaccess.hostgator $DEPLOY_DIR/.htaccess

# Create .env.local for API URL
echo "   - Creating environment configuration..."
cat > $DEPLOY_DIR/.env.local << 'EOF'
# Burch Platform - Hostgator Deployment
# Point to Vercel API for payment processing
NEXT_PUBLIC_API_URL=https://api-burch.vercel.app
EOF

echo "✅ Deployment package ready"
echo ""

# Step 3: Upload to Hostgator
echo "3️⃣  Uploading files to Hostgator..."
echo "   This may take a few minutes..."

lftp -u $FTP_USER,$FTP_PASS $FTP_HOST << FTPEOF
cd public_html

# Remove old files (optional - comment out to keep)
# rm -rf _next
# rm -rf public
# rm .htaccess

# Upload new files
mirror -R --ignore-time $DEPLOY_DIR .

quit
FTPEOF

if [ $? -eq 0 ]; then
  echo "✅ Upload complete!"
else
  echo "❌ Upload failed. Check FTP credentials."
  exit 1
fi

echo ""

# Step 4: Cleanup
echo "4️⃣  Cleaning up..."
rm -rf $DEPLOY_DIR
echo "✅ Cleanup complete"
echo ""

echo "🎉 Deployment Successful!"
echo "========================================"
echo ""
echo "Your app is now live at:"
echo "  https://yourdomain.com"
echo ""
echo "Test checkout:"
echo "  https://yourdomain.com/checkout"
echo ""
echo "⚠️  Remember to:"
echo "  1. Configure API URL: https://api-burch.vercel.app"
echo "  2. Enable AutoSSL in cPanel"
echo "  3. Test payment flow"
echo ""
echo "For issues, check HOSTGATOR_DEPLOYMENT.md"
echo ""
