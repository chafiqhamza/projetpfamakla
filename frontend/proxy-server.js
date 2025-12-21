const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const TARGET = 'http://localhost:8080'; // actual gateway
const PORT = process.env.PROXY_PORT || 8081;

app.use('/api', createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  logLevel: 'warn',
  onProxyRes: (proxyRes) => {
    // Normalize Access-Control-Allow-Origin: if server returned multiple values, keep the first
    const header = proxyRes.headers['access-control-allow-origin'];
    if (header && typeof header === 'string' && header.includes(',')) {
      proxyRes.headers['access-control-allow-origin'] = header.split(',')[0].trim();
    }
    // If other CORS headers are arrays, normalize to single string
    if (Array.isArray(proxyRes.headers['access-control-allow-methods'])) {
      proxyRes.headers['access-control-allow-methods'] = proxyRes.headers['access-control-allow-methods'].join(',');
    }
  }
}));

app.listen(PORT, () => {
  console.log(`Local proxy server listening on http://localhost:${PORT} -> ${TARGET}`);
});

