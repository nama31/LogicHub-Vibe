FROM node:22-alpine

WORKDIR /app/frontend

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

EXPOSE 3000


#for local development
# CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

#for deployment 
CMD ["sh", "-c", "npm run start -- -p $PORT"]