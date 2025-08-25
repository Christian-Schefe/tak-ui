echo "Building..."
rm -rf dist
bun run build
echo "Running locally..."
docker compose -f deploy/docker-compose.local.yml up
