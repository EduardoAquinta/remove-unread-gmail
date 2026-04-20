const GmailService = require('../src/gmailService');

const service = new GmailService();
service.runCleanup().catch(console.error);
