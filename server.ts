import fsSync from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createApiApp } from './src/lib/api-app.server.ts';

const PORT = Number(process.env.PORT || 3000);
const isDevCommand =
  process.env.npm_lifecycle_event === 'dev' || process.env.NODE_ENV === 'development';
const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.npm_lifecycle_event === 'start' ||
  (!isDevCommand && fsSync.existsSync(path.resolve(process.cwd(), 'dist', 'index.html')));

async function startServer() {
  const app = createApiApp();

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bev Naturals Cosmetics listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
