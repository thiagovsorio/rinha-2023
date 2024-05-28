import { personController } from "./controller";

console.log("Hello via Bun!");

const PORT = Number(process.env.PORT) || 3999;

let server;
try {
  server = Bun.serve({
    port: PORT,
    async fetch(req) {
      return await personController(req);
    },
  });
} catch (err) {
  server = Bun.serve({
    port: PORT + 1,
    async fetch(req) {
      return await personController(req);
    },
  });
  console.error(err);
}

console.log(`Listening on localhost:${server.port}`);
