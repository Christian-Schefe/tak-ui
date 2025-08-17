$ErrorActionPreference = "Stop"
echo "Building..."
bun build
echo "Transferring files to server..."
ssh tak_server "mkdir -p /root/app/certs"
sleep 1
scp -r dist tak_server:/root/app/dist