#!/bin/sh
set -e

if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env created from .env.example. Fill in your API keys before rerunning."
  exit 0
fi

docker compose up -d --build

echo "Web:  http://localhost:${WEB_PORT:-4173}"
echo "API:  http://localhost:${API_PORT:-18082}/health"
