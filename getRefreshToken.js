const GmailService = require('./gmailService');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

const service = new GmailService(console.log, ask);
service.runAuth().then(() => rl.close()).catch(console.error);
