const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing
app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to inspect incoming reverse proxy headers
app.get('/api/proxy-info', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    res.json({
        timestamp: new Date().toISOString(),
        clientIp: clientIp,
        protocol: req.headers['x-forwarded-proto'] || req.protocol,
        host: req.headers['host'],
        forwardedHost: req.headers['x-forwarded-host'] || null,
        forwardedFor: req.headers['x-forwarded-for'] || null,
        forwardedPort: req.headers['x-forwarded-port'] || null,
        realIp: req.headers['x-real-ip'] || null,
        sslProtocol: req.headers['x-ssl-protocol'] || 'N/A (Terminated at Proxy)',
        sslCipher: req.headers['x-ssl-cipher'] || 'N/A',
        headers: req.headers,
        serverMeta: {
            nodeVersion: process.version,
            uptimeSeconds: Math.floor(process.uptime()),
            service: 'web-backend',
            internalPort: PORT
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), time: new Date() });
});

// Fallback to index.html for SPA routing if needed
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web application service running on port ${PORT}`);
});
