const { google } = require('googleapis');

function filterUnreadEmails(messages) {
    return messages.filter(message => message.labelIds && message.labelIds.includes('UNREAD'));
}

async function deleteUnreadEmails(gmailClient, messages) {
    if(!messages || messages.length === 0) {
        console.log('No messages found.');
        return
    }

    const idsToDelete = messages.map(message => message.id);

    const response = await gmailClient.users.messages.batchDelete({
        userId: 'me',
        resource: {
            ids: idsToDelete
        }
    });

    console.log('Successfully deleted all unread emails');
    return response;
}


module.exports = {filterUnreadEmails, deleteUnreadEmails};

