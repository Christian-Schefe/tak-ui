$ErrorActionPreference = "Stop"
echo "Building..."
Remove-Item -Recurse -Force dist
bun run build
echo "Running locally..."
docker compose -f deploy/docker-compose.local.yml up