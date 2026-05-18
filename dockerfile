FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY src/ ./src/
COPY .env ./

EXPOSE 3001

CMD ["bun", "--watch", "src/server.ts"]