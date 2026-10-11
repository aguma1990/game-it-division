#!/bin/bash
# Klik dua kali file ini untuk menjalankan Neko Bank IT di browser.
cd "$(dirname "$0")" || exit 1
PORT=8080
while lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT+1)); done
echo "🌿 Neko Bank IT berjalan di http://localhost:$PORT"
echo "   Tutup jendela Terminal ini untuk menghentikan game."
(sleep 1; open "http://localhost:$PORT") &
exec python3 -m http.server "$PORT"
