const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// --- CORRECTION CRUCIALE ---
// Autorise toutes les origines pour éviter l'erreur "Origine non autorisée"
app.use(cors()); 

// Route Proxy : Redirige tout ce qui arrive sur /api vers GoLogin
app.use('/api', createProxyMiddleware({
  target: 'https://api.gologin.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Supprime le préfixe /api pour l'API GoLogin
  },
  onProxyReq: (proxyReq, req, res) => {
    // Affiche l'activité dans les logs de Render pour le diagnostic
    console.log(`[VIRALITY-API] Requête reçue : ${req.method} -> ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[PROXY-ERROR] Erreur de liaison :', err);
    res.status(500).send('Erreur de communication avec le serveur Cloud GoLogin');
  }
}));

// Route de diagnostic simple (pour vérifier si le serveur est réveillé)
app.get('/ping', (req, res) => {
  res.send('Virality Pro Engine is LIVE 🚀');
});

// Port dynamique obligatoire pour Render
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log('====================================');
  console.log(`VIRALITY PRO BACKEND IS ONLINE`);
  console.log(`URL de liaison : http://localhost:${PORT}/api`);
  console.log('====================================');
});