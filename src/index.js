const express = require('express');
const path = require('path');
const GmailService = require('./gmailService');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// State for terminal interactions
let sseResponse = null;
let pendingInputResolver = null;

// Helper to send logs to the web terminal via SSE
const webLogger = (message) => {
    if (sseResponse) {
        sseResponse.write(`data: ${JSON.stringify({ type: 'log', message })}\n\n`);
    }
    console.log(message);
};

// Helper to ask for input from the web terminal
const webAsker = (question) => {
    if (sseResponse) {
        sseResponse.write(`data: ${JSON.stringify({ type: 'ask', question })}\n\n`);
    }
    return new Promise((resolve) => {
        pendingInputResolver = resolve;
    });
};

// SSE Endpoint for terminal output
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseResponse = res;

    req.on('close', () => {
        sseResponse = null;
    });
});

// Input Endpoint for terminal interaction
app.post('/input', (req, res) => {
    const { input } = req.body;
    if (pendingInputResolver) {
        pendingInputResolver(input);
        pendingInputResolver = null;
        res.status(200).send({ status: 'ok' });
    } else {
        res.status(400).send({ error: 'No pending input request' });
    }
});

// OAuth2 Callback Endpoint
app.get('/oauth2callback', (req, res) => {
    const code = req.query.code;
    if (code && pendingInputResolver) {
        pendingInputResolver(code);
        pendingInputResolver = null;
        res.send('<h1>Authorisation Successful!</h1><p>You can close this tab and return to the terminal.</p>');
    } else {
        res.status(400).send('No code found or no pending authorisation request.');
    }
});

// Trigger endpoints
app.get('/start-cleanup', async (req, res) => {
    const gmailService = new GmailService(webLogger, webAsker);
    res.send({ status: 'Starting cleanup...' });
    try {
        await gmailService.runCleanup();
    } catch (err) {
        webLogger(`Error: ${err.message}`);
    }
});

app.get('/start-scan', async (req, res) => {
    const gmailService = new GmailService(webLogger, webAsker);
    res.send({ status: 'Starting scan...' });
    try {
        await gmailService.runScan();
    } catch (err) {
        webLogger(`Error: ${err.message}`);
    }
});

app.get('/start-auth', async (req, res) => {
    const gmailService = new GmailService(webLogger, webAsker);
    res.send({ status: 'Starting authorisation flow...' });
    try {
        await gmailService.runAuth();
    } catch (err) {
        webLogger(`Error: ${err.message}`);
    }
});

// Exit Endpoint
app.post('/exit', (req, res) => {
    console.log('Server is shutting down...');
    res.send({ status: 'Shutting down...' });
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
