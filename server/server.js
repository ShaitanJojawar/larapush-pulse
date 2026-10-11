require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const firestoreDB = require('./db');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const scheduler = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable High-Speed GZIP/Brotli Compression
app.use(compression());

// Enable CORS for dashboard and external websites integrating the SDK
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static files for Push SDK & Service Worker
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

// Explicit routes for SDK and test demo with zero browser caching
app.get('/firebase-messaging-sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(publicDir, 'firebase-messaging-sw.js'));
});
app.get('/push-sdk.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(publicDir, 'push-sdk.js'));
});
app.get('/demo', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(publicDir, 'demo.html'));
});

// Mount API routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Push Notification SaaS API'
  });
});

// Serve frontend in production if built (Express 5 compatible catch-all)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    // Avoid capturing api routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Start server
async function start() {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 LaraPush Pulse Server running on http://localhost:${PORT}`);
    console.log(`📡 Client SDK available at http://localhost:${PORT}/push-sdk.js`);
    console.log(`🔔 Service Worker at http://localhost:${PORT}/firebase-messaging-sw.js`);
    console.log(`📦 WordPress Plugin: http://localhost:${PORT}/larapush-pulse-wp.zip`);
    console.log(`🧪 Test Demo Webpage at http://localhost:${PORT}/demo`);
    console.log(`===============================================`);

    // Boot LaraPush background automation & scheduling engine
    scheduler.start();
  });
}

start();

module.exports = app;
