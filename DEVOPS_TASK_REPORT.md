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
*   **Non-Root Execution:** We created dedicated system users and groups (e.g., `logihub` user) inside the `Dockerfile`s, changed ownership of the working directories via `chown`, and utilized the `USER` directive. The application services now run as unprivileged users, significantly reducing the security attack surface.

### Step 2: Automation Scripts (Backups, Logs, and Restarts)
*   **Maintenance Script (`scripts/maintenance.sh`):** We wrote a robust Bash script that handles the complete maintenance lifecycle:
    1.  **Backups:** Executes `pg_dump` against the PostgreSQL container to create timestamped SQL backups stored in a `backups/` directory.
    2.  **Log Cleanup:** Purges application logs and old database backups older than a defined threshold (7 days) to prevent disk exhaustion.
    3.  **Restarts:** Gracefully restarts the Docker Compose stack to apply updates or clear memory leaks.
*   **Log Rotation:** In addition to the cleanup script, we added native Docker `json-file` logging constraints (`max-size: 10m`, `max-file: 3`) to all services in `docker-compose.yml` to strictly enforce log sizing at the daemon level.
*   **Cron Job Setup (`scripts/setup_cron.sh`):** A helper script to easily install the maintenance script into the host's crontab for scheduled execution (e.g., daily at 3:00 AM).

### Step 3: Nginx Reverse Proxy, SSL, & Rate Limiting
*   **Nginx Configuration (`nginx/nginx.conf`):** Added an Nginx container to act as the single point of entry for the application. It routes `/api/` traffic to the FastAPI backend and `/` traffic to the Next.js frontend.
*   **Rate Limiting:** Implemented the `limit_req_zone` directive to restrict traffic to 10 requests per second (with a burst of 20) per IP address, protecting the application from basic DDoS and spam attacks.
*   **SSL Termination:** Configured Certbot alongside Nginx to automate Let's Encrypt certificate generation and renewal. All port 80 traffic is strictly redirected to HTTPS on port 443.

---

## 3. Challenges Faced & Solutions

Integrating these DevOps practices into an existing, live application presented several real-world challenges that we successfully debugged and resolved:

### Challenge 1: The Internal Networking & Hidden Configuration Bug
**Problem:** To securely place Nginx in front of the application, we had to remove `network_mode: host` from the Docker Compose file and put the containers on an isolated bridge network. Immediately, the FastAPI backend and Telegram bot crashed with `ConnectionRefusedError: [Errno 111]`.
**Investigation:** We updated the `backend/.env` file to point the `DATABASE_URL` to the internal Docker hostnames (`db:5432` instead of `localhost:5432`). However, the containers still failed.
**Solution:** We discovered a hidden root `.env` file that Docker Compose was automatically injecting into the containers at runtime, which was overriding our service-level configurations back to `localhost`. Updating the root `.env` file and completely restarting the stack resolved the network isolation issues.

### Challenge 2: Next.js Hot Module Replacement (HMR) Hanging
**Problem:** After setting up Nginx, the frontend application got stuck in an infinite loading state in the browser.
**Investigation:** Checking the frontend logs revealed a series of `404` errors for `/_next/webpack-hmr`. The Next.js development server relies heavily on WebSockets to maintain a live connection with the client, and Nginx was failing to pass these WebSocket connections through.
**Solution:** We modified the `nginx.conf` proxy block for the frontend to include `proxy_http_version 1.1;`, `proxy_set_header Upgrade $http_upgrade;`, and `proxy_set_header Connection "upgrade";`. This allowed Nginx to correctly upgrade the HTTP requests to WebSockets, immediately fixing the infinite loading issue.

### Challenge 3: Nginx & Certbot "Chicken and Egg" Problem
**Problem:** Nginx will refuse to boot if the SSL certificate paths defined in its configuration do not exist. However, Certbot cannot generate Let's Encrypt certificates unless Nginx is running and listening on port 80 to answer the HTTP-01 challenge.
**Solution:** We implemented a bootstrap script (`scripts/init-letsencrypt.sh`) that dynamically generates a temporary, self-signed dummy certificate to satisfy Nginx's startup requirements. Once Nginx boots successfully with the dummy cert, the script commands Certbot to perform the actual challenge, deletes the dummy certs, and reloads Nginx with the valid Let's Encrypt certificates.
