$ErrorActionPreference = "Stop"
echo "Building..."
Remove-Item -Recurse -Force dist
bun run build
echo "Transferring files to server..."
ssh tak_server "rm -rf /root/app/dist"
sleep 1
scp -r dist tak_server:/root/app
