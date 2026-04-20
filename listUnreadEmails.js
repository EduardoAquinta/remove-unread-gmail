const GmailService = require('./gmailService');

const service = new GmailService();
service.runCleanup().catch(console.error);
