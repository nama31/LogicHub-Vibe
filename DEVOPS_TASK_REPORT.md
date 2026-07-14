# DevOps Task Report: Application Lifecycle Automation & Hardening

## 1. Context & Initial State (What Was Already Built)

This project (LogicHub) was not built from scratch for this task; it is a real-world, functioning application stack consisting of:
*   **Frontend:** Next.js application.
*   **Backend:** FastAPI (Python) monolith handling the core business logic and database interactions.
*   **Bot:** A Telegram Bot service interacting with the backend.
*   **Infrastructure:** PostgreSQL database and Redis cache.

**Before this task**, the project had a basic containerized setup:
*   Standard Dockerfiles without explicit security constraints (running as `root`).
*   A basic `docker-compose.yml` relying on host networking (`network_mode: host`) and connecting to `localhost`.
*   No automated backups, log rotation, or scheduled maintenance.
*   No reverse proxy, SSL termination, or rate-limiting in front of the application.

---

## 2. Implementations (What We Added)

To fulfill the requirements of automating the lifecycle and hardening the infrastructure, the following systems were integrated directly into the existing project:

### Step 1: Security-Hardened Dockerfiles (Non-root & Caching)
*   **Dependency Caching:** We restructured the `backend`, `frontend`, and `bot` Dockerfiles to isolate dependency installation (`pip install` and `pnpm install`) from the application code layer. This ensures that application code changes do not invalidate the heavy dependency cache, drastically speeding up build times.
*   **Non-Root Execution:** We created dedicated system users and groups (e.g., `logihub` and `node`) inside both development and production `Dockerfile`s (e.g., `backend/Dockerfile.prod`), changed ownership of the working directories via `chown`, and utilized the `USER` directive. The application services now safely run as unprivileged users.

### Step 2: Automation Scripts (Backups, Logs, and Restarts)
*   **Maintenance Script (`scripts/maintenance.sh`):** We wrote a robust Bash script that handles the complete maintenance lifecycle:
    1.  **Backups:** Executes `pg_dump` against the PostgreSQL container to create timestamped SQL backups stored in a `backups/` directory. Crucially, the script features a **fail-fast mechanism**: if `pg_dump` fails, it halts immediately (exit 1), preventing a scenario where corrupted backups cause older, valid backups to be erroneously purged.
    2.  **Log Cleanup:** Purges application logs and old database backups older than a defined threshold (7 days) to prevent disk exhaustion.
    3.  **Restarts:** Gracefully restarts the Docker Compose stack to apply updates or clear memory leaks if health checks fail.
*   **Log Rotation:** In addition to the cleanup script, we added native Docker `json-file` logging constraints (`max-size: 10m`, `max-file: 3`) to all services in `docker-compose.yml` to strictly enforce log sizing at the daemon level.

### Step 3: Nginx Reverse Proxy, SSL, & Rate Limiting
*   **Nginx Configuration (`nginx/nginx.conf`):** Added an Nginx container to act as the single point of entry for the application. It routes `/api/` traffic to the FastAPI backend and `/` traffic to the Next.js frontend.
*   **Rate Limiting:** Implemented the `limit_req_zone` directive to restrict traffic to 10 requests per second (with a burst of 20) per IP address, protecting the application from basic DDoS and spam attacks.
*   **SSL Termination:** To ensure a seamless "clone-and-run" local testing experience, we built a custom `nginx/Dockerfile` that dynamically generates a Self-Signed certificate using `openssl` during the image build phase. All port 80 traffic is strictly redirected to HTTPS on port 443.

---

## 3. Challenges Faced & Solutions

Integrating these DevOps practices into an existing, live application presented several real-world challenges that we successfully debugged and resolved:

### Challenge 1: The Internal Networking & Hidden Configuration Bug
**Problem:** To securely place Nginx in front of the application, we had to remove `network_mode: host` from the Docker Compose file and put the containers on an isolated bridge network. Immediately, the FastAPI backend and Telegram bot crashed with `ConnectionRefusedError: [Errno 111]`.
**Investigation:** We updated the `backend/.env` file to point the `DATABASE_URL` to the internal Docker hostnames (`db:5432` instead of `localhost:5432`). However, the containers still failed.
**Solution:** We discovered a hidden root `.env` file that Docker Compose was automatically injecting into the containers at runtime, which was overriding our service-level configurations back to `localhost`. Updating the root `.env` file resolved the network isolation issues.

### Challenge 2: Next.js Hot Module Replacement (HMR) Hanging
**Problem:** After setting up Nginx, the frontend application got stuck in an infinite loading state in the browser.
**Investigation:** Checking the frontend logs revealed a series of `404` errors for `/_next/webpack-hmr`. The Next.js development server relies heavily on WebSockets to maintain a live connection with the client, and Nginx was failing to pass these WebSocket connections through.
**Solution:** We modified the `nginx.conf` proxy block for the frontend to include `proxy_http_version 1.1;`, `proxy_set_header Upgrade $http_upgrade;`, and `proxy_set_header Connection "upgrade";`. This allowed Nginx to correctly upgrade the HTTP requests to WebSockets, immediately fixing the infinite loading issue.

### Challenge 3: Git Permissions & Local Portability of SSL Certificates
**Problem:** Initially, we used a Certbot Docker container to generate Let's Encrypt certificates. However, Certbot generates files owned by the `root` user. This caused `git add .` to fail with "Permission denied", as the local user could not read the private key.
**Investigation:** We added the `certbot` directory to `.gitignore` to solve the Git error. However, this created a new problem: if an interviewer cloned the repository and ran `docker compose up`, Nginx would immediately crash because the Let's Encrypt files were ignored and missing from the cloned repository.
**Solution:** We pivoted to a much cleaner architecture for local testing. We deleted the Certbot service entirely and created a custom `nginx/Dockerfile` that uses `openssl` to bake a self-signed certificate directly into the image at build time. This guarantees that `docker compose up` works flawlessly out-of-the-box for any reviewer.

### Challenge 4: Docker Volume Ownership Conflicts (EACCES)
**Problem:** After hardening the `frontend/Dockerfile` to run as the non-root `node` user, the Next.js container began crashing on startup with `Error: EACCES: permission denied, mkdir '/app/frontend/.next/dev'`.
**Investigation:** We realized that `docker-compose.yml` mounts a named Docker volume (`frontend_next`) over the `/.next` directory. By default, Docker creates new named volumes with `root` ownership. Because the `node` user was unprivileged, it lacked permission to write to this root-owned volume.
**Solution:** We updated the `frontend/Dockerfile` to run `mkdir -p /app/frontend/.next && chown -R node:node /app/frontend` *before* the `USER node` directive. Because Docker inherits the image's directory permissions when initializing a new named volume, the volume was successfully created with `node` ownership, allowing the container to boot properly.
