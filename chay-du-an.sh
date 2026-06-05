#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_URL="https://hungtran.tail07d810.ts.net"
PORT="3000"

cd "$PROJECT_DIR"

log() {
  printf "\n==> %s\n" "$1"
}

fail() {
  printf "\nLoi: %s\n" "$1" >&2
  printf "Nhan Enter de dong cua so...\n" >&2
  read -r _ || true
  exit 1
}

command -v node >/dev/null 2>&1 || fail "Chua cai Node.js."
command -v npm >/dev/null 2>&1 || fail "Chua cai npm."

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    log "Tao file .env tu .env.example"
    cp ".env.example" ".env"
  else
    fail "Khong tim thay .env hoac .env.example."
  fi
fi

if grep -q "^APP_BASE_URL=" ".env"; then
  sed -i "s|^APP_BASE_URL=.*|APP_BASE_URL=${APP_URL}|" ".env"
else
  printf "\nAPP_BASE_URL=%s\n" "$APP_URL" >> ".env"
fi

if grep -q "^PORT=" ".env"; then
  sed -i "s|^PORT=.*|PORT=${PORT}|" ".env"
else
  printf "PORT=%s\n" "$PORT" >> ".env"
fi

if [ ! -d "node_modules" ]; then
  log "Cai dependencies"
  npm install
fi

if command -v tailscale >/dev/null 2>&1; then
  log "Bat Tailscale Serve: ${APP_URL} -> localhost:${PORT}"
  if ! tailscale serve --bg --yes "$PORT"; then
    if command -v sudo >/dev/null 2>&1; then
      log "Tailscale can quyen sudo. Co the ban se can nhap mat khau may."
      sudo tailscale serve --bg --yes "$PORT" || fail "Khong bat duoc Tailscale Serve bang sudo. Hay kiem tra Tailscale da dang nhap/chay chua."
    else
      fail "Khong bat duoc Tailscale Serve va may khong co sudo. Chay lenh: tailscale set --operator=\$USER"
    fi
  fi
else
  fail "Chua cai Tailscale. Du an nay can Tailscale Serve de chay dung OAuth callback."
fi

if command -v xdg-open >/dev/null 2>&1; then
  log "Mo trinh duyet"
  xdg-open "$APP_URL" >/dev/null 2>&1 || true
fi

log "Dang chay Content Studio Sao Viet tai ${APP_URL}"
printf "Giu cua so nay mo. Nhan Ctrl+C de dung server.\n\n"
npm start
