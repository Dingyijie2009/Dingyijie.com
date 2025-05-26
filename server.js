const express = require('express');
const speakeasy = require('speakeasy');
const path = require('path');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Secret key for TOTP (this should be stored securely in production)
const secret = 'JBSWY3DPEHPK3PXP'; // This should match the secret in easter-egg.js

// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Endpoint to verify TOTP
app.post('/verify-totp', (req, res) => {
    console.log('Received verification request:', req.body);
    const { code } = req.body;
    
    if (!code) {
        console.log('No code provided');
        return res.status(400).json({ success: false, message: '请提供验证码' });
    }

    try {
        console.log('Verifying code:', code, 'with secret:', secret);
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: code,
            window: 2 // Allow 1 minute of time drift (30 seconds before and after)
        });
        
        console.log('Verification result:', verified);
        
        if (verified) {
            console.log('Verification successful');
            res.json({ success: true });
        } else {
            console.log('Verification failed - invalid code');
            res.status(400).json({ success: false, message: '验证码错误' });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: '验证失败: ' + error.message });
    }
});

// Add a test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running correctly' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test the server by visiting http://localhost:${PORT}/test`);
}); 