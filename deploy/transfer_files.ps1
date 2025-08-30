$ErrorActionPreference = "Stop"
echo "Transferring files to server..."
ssh tak_server "mkdir -p /root/app/certs && mkdir -p /root/app/deploy"
sleep 1
scp certs/certificate.pem certs/key.pem tak_server:/root/app/certs/
sleep 1
scp deploy/docker-compose.yml deploy/Caddyfile tak_server:/root/app/deploy