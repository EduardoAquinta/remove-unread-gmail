const {filterUnreadEmails, deleteUnreadEmails} = require('../src/remove-unread-gmail.js');

describe('filter-unread-gmail unit tests', () => {
    it('should only return unread messages from a mixed list', () => {
        const mockMessages = [
        { id: '101', labelIds: ['INBOX', 'IMPORTANT'] },
        { id: '102', labelIds: ['INBOX', 'UNREAD'] },
        { id: '103', labelIds: ['SENT'] },
        { id: '104', labelIds: ['INBOX', 'UNREAD', 'STARRED'] }];

        const unread = filterUnreadEmails(mockMessages);

        expect(unread).toHaveLength(2);
        expect(unread).toEqual([
            {id:'102', labelIds: ['INBOX', 'UNREAD']},
            {id:'104', labelIds: ['INBOX', 'UNREAD', 'STARRED']},
        ]);
    });
    it('should return an empty array when no messages are unread', () => {
        const mockMessages = [
            { id: '101', labelIds: ['INBOX'] },
            { id: '102', labelIds: ['INBOX', 'STARRED'] },
        ];
        const unread = filterUnreadEmails(mockMessages);
        expect(unread).toHaveLength(0);
        expect(unread).toEqual([])
    })
});

describe('deleteMessages tests', () => {
    it('should call the gmail batchDelete method with the correct message IDs', async () => {
        const messagesToDelete = [
            {id: '102'},
            {id: '104'}
        ]

        const mockGmailClient = {
            users: {
                messages: {
                    batchDelete: jest.fn().mockResolvedValue({status: 204})
                }
            }
        }

        await deleteUnreadEmails(mockGmailClient, messagesToDelete);

        expect(mockGmailClient.users.messages.batchDelete).toHaveBeenCalledTimes(1);
        expect(mockGmailClient.users.messages.batchDelete).toHaveBeenCalledWith({
            userId: 'me',
            resource: {
                ids: ['102', '104']
            }
        });
    });
})