const GmailService = require('../src/gmailService');
const fs = require('fs');
const { google } = require('googleapis');

jest.mock('fs');
jest.mock('googleapis');

describe('GmailService', () => {
    let gmailService;
    let mockLog;
    let mockAsk;

    beforeEach(() => {
        mockLog = jest.fn();
        mockAsk = jest.fn();
        gmailService = new GmailService(mockLog, mockAsk);
        jest.clearAllMocks();
    });

    describe('getOAuth2Client', () => {
        it('should throw an error if credentials file does not exist', async () => {
            fs.existsSync.mockReturnValue(false);
            await expect(gmailService.getOAuth2Client()).rejects.toThrow('Credentials file not found');
        });

        it('should return an OAuth2 client if credentials file exists', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                installed: {
                    client_id: 'id',
                    client_secret: 'secret',
                    redirect_uris: ['http://localhost']
                }
            }));

            const mockOAuth2 = { setCredentials: jest.fn() };
            google.auth.OAuth2.mockReturnValue(mockOAuth2);

            const client = await gmailService.getOAuth2Client();
            expect(client).toBe(mockOAuth2);
            expect(google.auth.OAuth2).toHaveBeenCalledWith('id', 'secret', 'http://localhost:3000/oauth2callback');
        });
    });

    describe('saveToken', () => {
        it('should write token to file and log success', async () => {
            await gmailService.saveToken('new-token');
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Token saved'));
        });
    });

    describe('loadToken', () => {
        it('should return token from file if it exists', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({ refresh_token: 'stored-token' }));
            const token = await gmailService.loadToken();
            expect(token).toBe('stored-token');
        });

        it('should return fallback token if file does not exist', async () => {
            fs.existsSync.mockReturnValue(false);
            const token = await gmailService.loadToken();
            expect(token).toBeDefined();
        });
    });

    describe('runAuth', () => {
        it('should handle successful authorisation', async () => {
            const mockOAuth2 = {
                generateAuthUrl: jest.fn().mockReturnValue('http://auth-url'),
                getToken: jest.fn().mockResolvedValue({ tokens: { refresh_token: 'new-refresh-token' } })
            };
            jest.spyOn(gmailService, 'getOAuth2Client').mockResolvedValue(mockOAuth2);
            mockAsk.mockResolvedValue('auth-code');

            await gmailService.runAuth();

            expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('http://auth-url'));
            expect(mockAsk).toHaveBeenCalled();
            expect(mockOAuth2.getToken).toHaveBeenCalledWith('auth-code');
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it('should log error if token retrieval fails', async () => {
            const mockOAuth2 = {
                generateAuthUrl: jest.fn().mockReturnValue('http://auth-url'),
                getToken: jest.fn().mockRejectedValue(new Error('Auth failed'))
            };
            jest.spyOn(gmailService, 'getOAuth2Client').mockResolvedValue(mockOAuth2);
            mockAsk.mockResolvedValue('auth-code');

            await expect(gmailService.runAuth()).rejects.toThrow('Auth failed');
            expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Error retrieving access token'));
        });
    });

    describe('runScan', () => {
        it('should scan and log unread emails', async () => {
            const mockGmail = {
                users: {
                    messages: {
                        list: jest.fn().mockResolvedValue({
                            data: {
                                messages: [{ id: '1' }, { id: '2' }],
                                nextPageToken: null
                            }
                        }),
                        get: jest.fn().mockResolvedValue({
                            data: {
                                payload: {
                                    headers: [{ name: 'Subject', value: 'Test Subject' }]
                                }
                            }
                        })
                    }
                }
            };
            google.gmail.mockReturnValue(mockGmail);
            const mockOAuth2 = { setCredentials: jest.fn() };
            jest.spyOn(gmailService, 'getOAuth2Client').mockResolvedValue(mockOAuth2);
            jest.spyOn(gmailService, 'loadToken').mockResolvedValue('token');

            await gmailService.runScan();

            expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Found a total of 2 unread emails'));
            expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Test Subject'));
        });
    });

    describe('runCleanup', () => {
        it('should cleanup unread emails', async () => {
            const mockGmail = {
                users: {
                    messages: {
                        list: jest.fn().mockResolvedValue({
                            data: {
                                messages: [{ id: '1' }],
                                nextPageToken: null
                            }
                        }),
                        get: jest.fn().mockResolvedValue({
                            data: {
                                payload: {
                                    headers: [{ name: 'Subject', value: 'Test Subject' }]
                                }
                            }
                        }),
                        delete: jest.fn().mockResolvedValue({})
                    }
                }
            };
            google.gmail.mockReturnValue(mockGmail);
            const mockOAuth2 = { setCredentials: jest.fn() };
            jest.spyOn(gmailService, 'getOAuth2Client').mockResolvedValue(mockOAuth2);
            jest.spyOn(gmailService, 'loadToken').mockResolvedValue('token');

            await gmailService.runCleanup();

            expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Successfully deleted message'));
            expect(mockGmail.users.messages.delete).toHaveBeenCalledWith({ userId: 'me', id: '1' });
        });
    });
});
