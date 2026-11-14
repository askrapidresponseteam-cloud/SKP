#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required. Install Python 3 or serve this folder with any static web server."
  read -r -p "Press Return to close."
  exit 1
fi
python3 -m http.server 8000 --bind 127.0.0.1 &
skp_preview_pid=$!
trap 'kill "$skp_preview_pid" 2>/dev/null' EXIT INT TERM
open http://localhost:8000
wait "$skp_preview_pid"
