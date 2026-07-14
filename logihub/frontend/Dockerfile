FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app/frontend

# Ensure the node user (UID 1000) owns the working directory
RUN chown node:node /app/frontend

# Copy manifests first for dependency caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy source and change ownership
COPY --chown=node:node . .

# Make sure all installed modules and generated files belong to node user
RUN mkdir -p /app/frontend/.next && chown -R node:node /app/frontend

# Switch to the non-root node user (UID 1000)
USER node

EXPOSE 3000

# Healthcheck to verify the dev server is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# for local development
CMD ["pnpm", "run", "dev"]