import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './src/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(
      express.static(path.resolve(__dirname, 'dist'), {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else if (filePath.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      }),
    );
    app.get(/.*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vitePkg = 'vite';
    const { createServer: createViteServer } = await import(/* @vite-ignore */ vitePkg);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[VENTY Production Hardening] Server running on http://localhost:${PORT}`);
    console.log(`[VENTY Management API] GET /api/management/admin/dashboard ✓`);
    console.log(`[VENTY Management API] GET /api/management/overview ✓`);
    console.log(`[VENTY Orders API] GET /api/orders ✓`);
  });
};

export { app };
export default app;

if (process.env.VERCEL !== '1') {
  startServer().catch((err) => {
    console.error('[VENTY Production Hardening] Server boot failure:', err);
    process.exit(1);
  });
}
