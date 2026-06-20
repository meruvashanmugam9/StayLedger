import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Helper to find the absolute path of a static file inside development or production build
function lookupStaticFile(fileName: string): string | null {
  const possiblePaths = [
    path.join(process.cwd(), 'public', fileName),
    path.join(process.cwd(), 'dist', fileName),
    path.join(process.cwd(), fileName),
  ];

  if (typeof __dirname !== 'undefined') {
    possiblePaths.push(
      path.join(__dirname, fileName),
      path.join(__dirname, '..', 'public', fileName),
      path.join(__dirname, '..', 'dist', fileName),
      path.join(__dirname, '..', fileName)
    );
  }

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return p;
      }
    } catch (e) {
      // Ignored
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global CORS headers for API and all requests
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // API routes go here FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Explicit PWA manifest route with proper Content-Type & CORS headers
  app.get(['/manifest.json', '/manifest.webmanifest'], (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    
    const resolvedPath = lookupStaticFile('manifest.json');
    if (resolvedPath) {
      res.sendFile(resolvedPath);
    } else {
      res.status(404).json({ error: 'manifest.json not found' });
    }
  });

  // Explicit route for PWA icons
  app.get('/icon-192.png', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/png');
    const resolvedPath = lookupStaticFile('icon-192.png');
    if (resolvedPath) {
      res.sendFile(resolvedPath);
    } else {
      res.status(404).send('icon-192.png not found');
    }
  });

  app.get('/icon-512.png', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/png');
    const resolvedPath = lookupStaticFile('icon-512.png');
    if (resolvedPath) {
      res.sendFile(resolvedPath);
    } else {
      res.status(404).send('icon-512.png not found');
    }
  });

  // Explicit route for PWA screenshots
  app.get('/screenshot-desktop.jpg', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/jpeg');
    const resolvedPath = lookupStaticFile('screenshot-desktop.jpg');
    if (resolvedPath) {
      res.sendFile(resolvedPath);
    } else {
      res.status(404).send('screenshot-desktop.jpg not found');
    }
  });

  app.get('/screenshot-mobile.jpg', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/jpeg');
    const resolvedPath = lookupStaticFile('screenshot-mobile.jpg');
    if (resolvedPath) {
      res.sendFile(resolvedPath);
    } else {
      res.status(404).send('screenshot-mobile.jpg not found');
    }
  });

  // Explicit route for service worker
  app.get('/sw.js', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    const resolvedPath = lookupStaticFile('sw.js');
    if (resolvedPath) {
      res.sendFile(resolvedPath);
    } else {
      res.status(404).send('sw.js not found');
    }
  });

  // Serve static public assets with CORS headers
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath, {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }));

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve build outputs with CORS headers
    app.use(express.static(distPath, {
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
    }));
    
    // For any other routes, serve index.html unless it is a file request (which should be a 404)
    app.get('*', (req, res) => {
      if (path.extname(req.path)) {
        return res.status(404).send('Not Found');
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
