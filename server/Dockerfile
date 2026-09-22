FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock package-lock.json ./
RUN bun install --frozen-lockfile || bun install

COPY . .

EXPOSE 3000
CMD ["bun", "run", "index.ts"]