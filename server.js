const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 1. CONFIGURATION DE BASE
app.use(cors());
app.use(express.json()); // INDISPENSABLE pour lire les données POST (Correction Erreur 400)

// 2. LOGGING ET VALIDATION DES DONNÉES ENTRANTES
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INCOMING] ${req.method} ${req.url}`);

    // Si c'est une création d'agent, on vérifie les champs obligatoires
    if (req.method === 'POST' && req.url.includes('/browser')) {
        const { name, os, browser } = req.body;
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!os) missingFields.push('os');
        if (!browser) missingFields.push('browser');

        if (missingFields.length > 0) {
            console.error(`[VALIDATION ERROR] Champs manquants pour la création : ${missingFields.join(', ')}`);
        } else {
            console.log(`[VALIDATION OK] Création de l'agent : ${name} (${os}/${browser})`);
        }
    }
    next();
});

// 3. ROUTE DE SANTÉ
app.get('/ping', (req, res) => {
    res.status(200).send('Virality Engine Online 🚀');
});

// 4. PROXY CONFIGURATION (Cerveau du SaaS)
app.use('/api', createProxyMiddleware({
    target: 'https://api.gologin.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', 
    },
    // Correction pour s'assurer que le BODY (JSON) est bien transmis après avoir été lu par express.json()
    onProxyReq: (proxyReq, req, res) => {
        if (req.body && Object.keys(req.body).length) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
        console.log(`[PROXYING] ${req.method} -> https://api.gologin.com${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[PROXY-RESPONSE] Status: ${proxyRes.statusCode} pour ${req.url}`);
    },
    onError: (err, req, res) => {
        console.error('[PROXY CRITICAL ERROR]', err);
        res.status(500).json({ error: 'Liaison GoLogin échouée', details: err.message });
    }
}));

// 5. LANCEMENT
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================');
    console.log(`SAAS BACKEND READY ON PORT ${PORT}`);
    console.log('====================================');
});