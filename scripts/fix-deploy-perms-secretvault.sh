#!/usr/bin/env bash
set -euo pipefail

TARGET=/home/ubuntu/website/static/secretvault

chown -R www-data:ubuntu "${TARGET}"
find "${TARGET}" -type f -exec chmod 664 {} +
find "${TARGET}" -type d -exec chmod 775 {} +
