Deployment using Docker and Docker Compose

This file explains how to run the Backlast backend in Docker on your Hostinger VPS and configure Nginx as a reverse proxy with HTTPS.

Prerequisites (on VPS)
- Docker and docker-compose installed (or Docker Engine with compose plugin)
- Nginx installed
- Domain pointing to the VPS IP (A record)

1) Build and run with docker-compose

# in project directory on VPS
export FRONTEND_ORIGIN=https://ton-frontend.example.com
export JWT_SECRET="your_strong_jwt_secret_here"

# build and run in detached mode
docker compose up -d --build

# check logs
docker compose logs -f

2) Persistent data
- The compose file maps local ./data to the container's /usr/src/app/data. Ensure this folder is owned by the user running docker:

mkdir -p data
chown -R $USER:$USER data

- For backups, copy the sqlite file out regularly:
cp data/kasa.sqlite3 /var/backups/backlast/kasa-$(date +%F).sqlite3

3) Nginx reverse proxy
- Example nginx site (replace back.example.com):

server {
    listen 80;
    server_name back.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name back.example.com;

    ssl_certificate /etc/letsencrypt/live/back.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/back.example.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# enable site, test and reload
sudo ln -s /etc/nginx/sites-available/backlast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# obtain cert
sudo certbot --nginx -d back.example.com

4) Environment variables and secrets
- Provide secrets through environment variables on the VPS before running docker compose (or via a .env file placed next to docker-compose.yml; it mustn't be committed).

5) Scaling and future
- For more scaling, replace sqlite with Postgres and add a managed DB or a containerized Postgres service.
- Use a docker volume for the SQLite file for safety, or mount a host path as in the compose file.

