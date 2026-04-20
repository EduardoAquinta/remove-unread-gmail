const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');

// Append a new line to the terminal
function appendLine(text, className = 'line') {
    const line = document.createElement('div');
    line.className = className;
    line.innerText = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Display instructions on load
function displayInstructions() {
    appendLine('Welcome to the Gmail Cleanup Tool.');
    appendLine('--------------------------------------------------');
    appendLine('This tool allows you to manage and delete unread emails.');
    appendLine('');
    appendLine('AVAILABLE COMMANDS:');
    appendLine('  scan      - Scans and lists the first 5 unread emails.');
    appendLine('  cleanup   - Starts the unread email deletion process.');
    appendLine('  authorise - Triggers the OAuth2 authorisation flow.');
    appendLine('  exit      - Shuts down the server and closes the tool.');
    appendLine('  help      - Shows these instructions again.');
    appendLine('--------------------------------------------------');
}

displayInstructions();

// Connect to SSE for real-time output
const eventSource = new EventSource('/events');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'log') {
        appendLine(data.message);
    } else if (data.type === 'ask') {
        appendLine(data.question, 'line ask');
    }
};

eventSource.onerror = (err) => {
    console.error('SSE Error:', err);
};

// Handle input submission
terminalInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const input = terminalInput.value.trim().toLowerCase();
        terminalInput.value = '';
        appendLine(`> ${input}`);

        if (input === 'scan') {
            await fetch('/start-scan');
        } else if (input === 'cleanup') {
            await fetch('/start-cleanup');
        } else if (input === 'authorise') {
            await fetch('/start-auth');
        } else if (input === 'help') {
            displayInstructions();
        } else if (input === 'exit') {
            appendLine('Shutting down server... Goodbye!');
            await fetch('/exit', { method: 'POST' });
            // Attempt to close the window
            setTimeout(() => {
                window.close();
                // Fallback for browsers that block window.close()
                appendLine('The server has shut down. You can now safely close this tab.');
                terminalInput.disabled = true;
            }, 500);
        } else if (input !== '') {
            // Send to server as input for a pending question
            const response = await fetch('/input', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input })
            });
            
            if (!response.ok) {
                appendLine('Error: No active command waiting for input.');
            }
        }
    }
});
