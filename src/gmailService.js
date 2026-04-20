const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://mail.google.com/'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const FALLBACK_REFRESH_TOKEN = ''; // Placeholder for secret - do not commit real tokens!

/**
 * Encapsulates Gmail API logic for listing and deleting unread emails.
 */
class GmailService {
    constructor(log, ask) {
        this.log = log || console.log;
        this.ask = ask; // Function that returns a Promise resolving with the user's input string
    }

    async getOAuth2Client() {
        if (!fs.existsSync(CREDENTIALS_PATH)) {
            throw new Error(`Credentials file not found at: ${CREDENTIALS_PATH}`);
        }
        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
        const { client_id, client_secret } = credentials.installed;
        return new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3000/oauth2callback');
    }

    async saveToken(token) {
        fs.writeFileSync(TOKEN_PATH, JSON.stringify({ refresh_token: token }));
        this.log(`\nToken saved to ${TOKEN_PATH}`);
    }

    async loadToken() {
        if (fs.existsSync(TOKEN_PATH)) {
            const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
            return token.refresh_token;
        }
        return FALLBACK_REFRESH_TOKEN;
    }

    async runAuth() {
        const oAuth2Client = await this.getOAuth2Client();
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            response_type: 'code',
            scope: SCOPES,
            prompt: 'consent' // Force refresh token generation
        });

        this.log(`Authorise this app by visiting this url:\n${authUrl}`);
        
        if (!this.ask) {
            this.log('Interactive input ("ask" callback) not provided. Please run the CLI for authorisation.');
            return;
        }

        const code = await this.ask('Enter code from the auth page here: ');
        try {
            const { tokens } = await oAuth2Client.getToken(code);
            this.log('\n✅ Authorisation successful!');
            
            if (tokens.refresh_token) {
                await this.saveToken(tokens.refresh_token);
                this.log('Your new Refresh Token has been saved.');
            } else {
                this.log('No new Refresh Token received (this is normal if already authorised). Using existing token.');
            }
            
            return tokens.refresh_token;
        } catch (err) {
            this.log(`Error retrieving access token: ${err.message}`);
            throw err;
        }
    }

    async runCleanup(refreshToken) {
        if (!refreshToken) {
            refreshToken = await this.loadToken();
        }
        
        const oAuth2Client = await this.getOAuth2Client();
        oAuth2Client.setCredentials({ refresh_token: refreshToken });

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        let allMessages = [];
        let nextPageToken = null;

        try {
            this.log("Fetching unread emails...");
            do {
                const response = await gmail.users.messages.list({
                    userId: 'me',
                    q: 'is:unread',
                    maxResults: 100,
                    pageToken: nextPageToken
                });
                if (response.data.messages) {
                    allMessages = allMessages.concat(response.data.messages);
                }
                nextPageToken = response.data.nextPageToken;
            } while (nextPageToken);

            if (!allMessages || allMessages.length === 0) {
                this.log('No unread emails found.');
                return;
            }

            this.log(`Found a total of ${allMessages.length} unread emails to process.`);

            for (let i = 0; i < allMessages.length; i++) {
                const message = allMessages[i];
                const messageResponse = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id,
                    format: 'metadata',
                    metadataHeaders: ['Subject']
                });

                const subjectHeader = messageResponse.data.payload.headers.find(
                    (header) => header.name === 'Subject'
                );

                const subject = subjectHeader ? subjectHeader.value : 'No Subject';
                this.log(`${i} - ID: ${message.id} | Subject: ${subject}`);

                this.log("---> Deleting message...");
                await gmail.users.messages.delete({
                    userId: 'me',
                    id: message.id,
                });
                this.log("Successfully deleted message :)");
            }

            this.log('\nSuccessfully deleted all unread emails');

        } catch (error) {
            this.log(`The API returned an error: ${error.message}`);
            throw error;
        }
    }

    async runScan(refreshToken) {
        if (!refreshToken) {
            refreshToken = await this.loadToken();
        }
        
        const oAuth2Client = await this.getOAuth2Client();
        oAuth2Client.setCredentials({ refresh_token: refreshToken });

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        let allMessages = [];
        let nextPageToken = null;

        try {
            this.log("Scanning for unread emails...");
            do {
                const response = await gmail.users.messages.list({
                    userId: 'me',
                    q: 'is:unread',
                    maxResults: 100,
                    pageToken: nextPageToken
                });
                if (response.data.messages) {
                    allMessages = allMessages.concat(response.data.messages);
                }
                nextPageToken = response.data.nextPageToken;
            } while (nextPageToken);

            if (!allMessages || allMessages.length === 0) {
                this.log('No unread emails found.');
                return;
            }

            this.log(`\nFound a total of ${allMessages.length} unread emails.`);
            
            const limit = Math.min(allMessages.length, 5);
            this.log(`Displaying the first ${limit} subject lines:`);

            for (let i = 0; i < limit; i++) {
                const message = allMessages[i];
                const messageResponse = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id,
                    format: 'metadata',
                    metadataHeaders: ['Subject']
                });

                const subjectHeader = messageResponse.data.payload.headers.find(
                    (header) => header.name === 'Subject'
                );

                const subject = subjectHeader ? subjectHeader.value : 'No Subject';
                this.log(` - ${subject}`);
            }

            if (allMessages.length > 5) {
                this.log(`... and ${allMessages.length - 5} more.`);
            }

        } catch (error) {
            this.log(`The API returned an error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = GmailService;
