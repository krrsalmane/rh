FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=development
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev"]
