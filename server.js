const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 1. CONFIGURATION CORS (Autorise toutes les connexions pour le déploiement)
app.use(cors());

// 2. SYSTÈME DE LOGS EN TEMPS RÉEL
// Affiche chaque tentative de connexion dans les logs Render
app.use((req, res, next) => {
    console.log(`[INCOMING] ${req.method} ${req.url}`);
    next();
});

// 3. ROUTE DE DIAGNOSTIC
app.get('/ping', (req, res) => {
    res.status(200).send('Virality Pro Engine is LIVE 🚀');
});

// 4. CONFIGURATION DU PROXY (Lien vers GoLogin)
app.use('/api', createProxyMiddleware({
    target: 'https://api.gologin.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // Supprime le préfixe /api pour l'API GoLogin
    },
    onProxyReq: (proxyReq, req, res) => {
        // Log précis de la destination pour le diagnostic SaaS
        console.log(`[PROXYING] ${req.method} -> https://api.gologin.com${proxyReq.path}`);
    },
    onError: (err, req, res) => {
        console.error('[PROXY-ERROR] Erreur de liaison :', err);
        res.status(500).json({ 
            error: 'Erreur de communication avec le Cloud GoLogin', 
            message: err.message 
        });
    }
}));

// 5. LANCEMENT DU SERVEUR SUR LE PORT RENDER
const PORT = process.env.PORT || 8000;

// Utilisation de '0.0.0.0' pour assurer l'accès externe sur Render
app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================');
    console.log(`VIRALITY SERVER RUNNING ON PORT ${PORT}`);
    console.log(`ENDPOINT : /api`);
    console.log('====================================');
});