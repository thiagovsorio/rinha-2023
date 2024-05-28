FROM oven/bun:alpine

COPY . /app/
COPY ./.env /app/.env
WORKDIR /app

ENV NODE_ENV=production \
  PORT=3999

RUN bun install
EXPOSE 3999

CMD ["bun", "src/index.ts"]