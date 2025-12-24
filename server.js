const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Configuration CORS : Autorise ton interface (Netlify et local)
// Remplace 'https://ton-site.netlify.app' par ton URL Netlify réelle
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:5173', 
  'https://ton-site.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permet les requêtes sans origine (comme les outils mobiles ou curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS : Origine non autorisée par Virality Pro'));
    }
  }
}));

// Route Proxy : Redirige tout ce qui arrive sur /api vers GoLogin
app.use('/api', createProxyMiddleware({
  target: 'https://api.gologin.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Transforme /api/browser en /browser pour GoLogin
  },
  onProxyReq: (proxyReq, req, res) => {
    // Affiche l'activité dans ton terminal de serveur
    console.log(`[VIRALITY-API] ${req.method} -> ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[PROXY-ERROR]', err);
  }
}));

// Port dynamique pour le Cloud (Render utilise souvent le port 10000 ou aléatoire)
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log('====================================');
  console.log(`VIRALITY PRO BACKEND IS ONLINE`);
  console.log(`Port : ${PORT}`);
  console.log('====================================');
});