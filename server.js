const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // Pour lire la clé API localement

const app = express();

// CONFIGURATION
const PORT = process.env.PORT || 8000;
const GOLOGIN_API_TOKEN = process.env.GOLOGIN_API_TOKEN;
const GOLOGIN_BASE_URL = 'https://api.gologin.com';

// 1. MIDDLEWARES
app.use(cors()); // Autorise ton front-end Netlify à communiquer avec ce serveur
app.use(express.json());

// Instance Axios pré-configurée
const goLoginClient = axios.create({
    baseURL: GOLOGIN_BASE_URL,
    headers: {
        'Authorization': `Bearer ${GOLOGIN_API_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// 2. ROUTES API

// Test de santé du serveur
app.get('/api/ping', (req, res) => {
    res.json({ status: 'Online', message: 'Virality Engine Backend is running 🚀' });
});

// Récupérer la liste des profils
app.get('/api/profiles', async (req, res) => {
    try {
        const response = await goLoginClient.get('/browser');
        res.json(response.data);
    } catch (error) {
        console.error('Erreur API GoLogin (Listing):', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'Impossible de récupérer les profils',
            details: error.response?.data
        });
    }
});

// Créer un nouveau profil
app.post('/api/profiles', async (req, res) => {
    try {
        const profileData = {
            name: req.body.name || 'Cloud Agent',
            browser: 'orbita',
            os: 'win',
            proxy: { mode: 'gologin', autoProxyRegion: 'us' }
        };
        const response = await goLoginClient.post('/browser', profileData);
        res.status(201).json(response.data);
    } catch (error) {
        console.error('Erreur API GoLogin (Creation):', error.response?.data || error.message);
        res.status(400).json({ error: 'Échec de la création du profil' });
    }
});

// Lancer le profil en Cloud et obtenir l'URL de streaming
app.post('/api/profiles/:id/start', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[STARTING] Demande de flux pour le profil: ${id}`);
        
        const response = await goLoginClient.post(`/browser/${id}/start-cloud`);
        
        // GoLogin renvoie un objet contenant "url" (le lien de streaming)
        if (response.data && response.data.url) {
            res.json({ url: response.data.url });
        } else {
            throw new Error('Lien de streaming non reçu de GoLogin');
        }
    } catch (error) {
        console.error('Erreur API GoLogin (Streaming):', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Échec du lancement cloud', 
            details: error.response?.data 
        });
    }
});

// 3. LANCEMENT
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =========================================
    ✅ SERVER RUNNING ON PORT ${PORT}
    ✅ READY FOR NETLIFY REQUESTS
    =========================================
    `);
});