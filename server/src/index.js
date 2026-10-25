import http from 'http';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';
import { initSockets } from './sockets/index.js';

async function main() {
  await connectDb();
  const app = createApp();
  const server = http.createServer(app);
  initSockets(server);
  server.listen(env.port, () => console.log(`Cohort API listening on :${env.port}`));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
