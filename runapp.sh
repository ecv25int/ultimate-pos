#!/usr/bin/env bash
# Run Ultimate POS API and Web projects concurrently with resilient process handling.

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$ROOT_DIR/ultimate-pos-api"
WEB_DIR="$ROOT_DIR/ultimate-pos-web"
API_LOG="$ROOT_DIR/api.log"
WEB_LOG="$ROOT_DIR/web.log"
API_PID=""
WEB_PID=""
SKIP_INSTALL="${SKIP_INSTALL:-0}"

log() {
	printf '[runapp] %s\n' "$1"
}

fail() {
	printf '[runapp] ERROR: %s\n' "$1" >&2
	exit 1
}

is_port_busy() {
	local port="$1"
	lsof -i ":${port}" -sTCP:LISTEN >/dev/null 2>&1
}

cleanup() {
	log 'Stopping child processes...'
	if [[ -n "$API_PID" ]] && kill -0 "$API_PID" >/dev/null 2>&1; then
		kill "$API_PID" >/dev/null 2>&1 || true
	fi
	if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" >/dev/null 2>&1; then
		kill "$WEB_PID" >/dev/null 2>&1 || true
	fi
	wait >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

[[ -d "$API_DIR" ]] || fail "Missing directory: $API_DIR"
[[ -d "$WEB_DIR" ]] || fail "Missing directory: $WEB_DIR"
[[ -f "$API_DIR/package.json" ]] || fail "Missing file: $API_DIR/package.json"
[[ -f "$WEB_DIR/package.json" ]] || fail "Missing file: $WEB_DIR/package.json"

if is_port_busy 3000; then
	fail 'Port 3000 is already in use. Stop existing API process first.'
fi

if is_port_busy 4200; then
	fail 'Port 4200 is already in use. Stop existing Web process first.'
fi

if [[ "$SKIP_INSTALL" != "1" ]]; then
	log 'Installing API dependencies...'
	(cd "$API_DIR" && npm install) || fail 'API npm install failed'

	log 'Installing Web dependencies...'
	(cd "$WEB_DIR" && npm install) || fail 'Web npm install failed'
else
	log 'SKIP_INSTALL=1 set; skipping npm install'
fi

log "Starting API (logs: $API_LOG)..."
(
	cd "$API_DIR"
	npm run start:dev
) >"$API_LOG" 2>&1 &
API_PID="$!"

sleep 2
if ! kill -0 "$API_PID" >/dev/null 2>&1; then
	tail -n 40 "$API_LOG" >&2 || true
	fail 'API failed to start. See api.log for details.'
fi

log "Starting Web (logs: $WEB_LOG)..."
(
	cd "$WEB_DIR"
	npm start
) >"$WEB_LOG" 2>&1 &
WEB_PID="$!"

sleep 2
if ! kill -0 "$WEB_PID" >/dev/null 2>&1; then
	tail -n 40 "$WEB_LOG" >&2 || true
	fail 'Web failed to start. See web.log for details.'
fi

log 'Services started successfully:'
log '  API: http://localhost:3000/api'
log '  Web: http://localhost:4200'
log 'Press Ctrl+C to stop both.'

while true; do
	if ! kill -0 "$API_PID" >/dev/null 2>&1; then
		log 'API process exited unexpectedly. Last API log lines:'
		tail -n 40 "$API_LOG" || true
		exit 1
	fi

	if ! kill -0 "$WEB_PID" >/dev/null 2>&1; then
		log 'Web process exited unexpectedly. Last Web log lines:'
		tail -n 40 "$WEB_LOG" || true
		exit 1
	fi

	sleep 2
done
