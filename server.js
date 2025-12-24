const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 1. CONFIGURATION CORS
// Autorise ton frontend Netlify à communiquer avec ce serveur sans restrictions
app.use(cors());

// 2. LOGGING DE TOUTES LES REQUÊTES ENTRANTES
// Permet de voir en temps réel dans les logs Render qui appelle ton serveur
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INCOMING] ${req.method} ${req.url}`);
    next();
});

// 3. ROUTE DE SANTÉ (PING)
// Utile pour vérifier que le serveur est réveillé sur https://virality-backend.onrender.com/ping
app.get('/ping', (req, res) => {
    res.status(200).send('Virality Pro Engine is LIVE 🚀');
});

// 4. CONFIGURATION DU PROXY PRINCIPAL
// Redirige /api/* vers https://api.gologin.com/*
app.use('/api', createProxyMiddleware({
    target: 'https://api.gologin.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // Supprime /api pour correspondre à l'URL GoLogin
    },
    onProxyReq: (proxyReq, req, res) => {
        // Affiche la destination finale pour debug le lancement Cloud
        console.log(`[PROXYING] ${req.method} ${req.url} -> https://api.gologin.com${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        // Affiche si GoLogin a accepté ou refusé la requête (ex: 200, 401)
        console.log(`[PROXY-RESPONSE] ${req.method} ${req.url} Status: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error('[PROXY ERROR]', err);
        res.status(500).json({ 
            error: 'Proxy communication failure', 
            message: err.message 
        });
    }
}));

// 5. PROXY DE SECOURS (FALLBACK)
// Gère les requêtes directes vers /browser si le préfixe /api est oublié
app.use('/browser', createProxyMiddleware({
    target: 'https://api.gologin.com/browser',
    changeOrigin: true,
    pathRewrite: { '^/browser': '' },
    onProxyReq: (proxyReq) => console.log(`[FALLBACK] GET -> https://api.gologin.com/browser${proxyReq.path}`)
}));

// 6. GESTION DES ERREURS 404
app.use((req, res) => {
    console.log(`[404 NOT FOUND] ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route non trouvée', path: req.url });
});

// 7. LANCEMENT DU SERVEUR
// Port dynamique pour Render (10000) ou 8000 en local
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================');
    console.log(`VIRALITY PRO BACKEND ACTIVE ON PORT ${PORT}`);
    console.log(`TEST PING : /ping`);
    console.log('====================================');
});