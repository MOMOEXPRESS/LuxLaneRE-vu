#!/usr/bin/env bash
# Quick start: cd to project and start Docker Postgres.
# Run from anywhere: /Users/j.pebalemaurice/Desktop/LuxLaneRE-vu/start.sh
# Then from project root: npm run dev

set -e
cd /Users/j.pebalemaurice/Desktop/LuxLaneRE-vu
echo "Starting Postgres (Docker)..."
docker compose up -d
echo "Done. From here run: npm run dev"
