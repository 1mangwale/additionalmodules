#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Building web-user (/user)"
pushd "$ROOT_DIR/apps/web-user" >/dev/null
npm ci
npm run build
popd >/dev/null

echo "Building web-vendor (/vendor)"
pushd "$ROOT_DIR/apps/web-vendor" >/dev/null
npm ci
npm run build
popd >/dev/null

echo "Syncing to /var/www/mangwale"
sudo mkdir -p /var/www/mangwale/user /var/www/mangwale/vendor
sudo rsync -a --delete "$ROOT_DIR/apps/web-user/dist/" /var/www/mangwale/user/
sudo rsync -a --delete "$ROOT_DIR/apps/web-vendor/dist/" /var/www/mangwale/vendor/
sudo chown -R www-data:www-data /var/www/mangwale

echo "To enable Nginx site:"
echo "  sudo cp '$ROOT_DIR/deploy/nginx/test.mangwale.ai.conf' /etc/nginx/sites-available/test.mangwale.ai"
echo "  sudo ln -sf /etc/nginx/sites-available/test.mangwale.ai /etc/nginx/sites-enabled/test.mangwale.ai"
echo "  sudo nginx -t && sudo systemctl reload nginx"

echo "Done. Visit http://test.mangwale.ai/user and /vendor"
