# Gmail Cleanup Tool

An automated tool to manage and delete unread emails from your Gmail account using the Google Gmail API. It features a modern, interactive web-based terminal interface for a seamless user experience.

## Features

- **Interactive Web Terminal:** A browser-based terminal emulator to run commands and view real-time logs.
- **Unread Email Scanning:** Quickly count unread emails and preview the subjects of the first five.
- **Bulk Cleanup:** Efficiently delete all unread emails from your inbox.
- **OAuth2 Authentication:** Simple authorisation flow handled directly through the web interface.
- **AWS Infrastructure:** Ready-to-use Terraform configuration for hosting on AWS Free Tier.
- **CI/CD Integrated:** Automated testing via GitHub Actions.
- **British English:** All interface text and logs are in British English.

---

## Directory Structure

- `src/`: Core logic and Express server.
- `public/`: Web terminal frontend (HTML/CSS/JS).
- `tests/`: Robust Jest test suite (Unit & Integration).
- `scripts/`: Legacy CLI utility scripts.
- `terraform/`: AWS infrastructure as code.
- `.github/`: CI/CD workflow configurations.

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- A Google Cloud Project with the **Gmail API** enabled.
- [OAuth 2.0 Client ID credentials](https://console.cloud.google.com/apis/credentials) (Desktop or Web application type).

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/EduardoAquinta/remove-unread-gmail.git
cd remove-unread-gmail
npm install
```

### 3. Configuration
- Download your `credentials.json` from the Google Cloud Console and place it in the root directory.
- Ensure `http://localhost:3000/oauth2callback` is added as an **Authorized redirect URI** in your Google Cloud Console.

### 4. Running the Application
Start the web server:
```bash
npm start
```
Open your browser and navigate to `http://localhost:3000`.

---

## Usage (Web Terminal Commands)

Upon loading the web terminal, you can use the following commands:

- `scan`      - Scans your inbox and lists the subjects of the first 5 unread emails.
- `cleanup`   - Starts the automated deletion of all unread emails.
- `authorise` - Triggers the Google OAuth2 authorisation flow (only needed once).
- `exit`      - Shuts down the local server and attempts to close the tab.
- `help`      - Displays the available commands.

---

## Testing

The project includes a robust test suite with >80% code coverage.
To run the tests and view the coverage report:
```bash
npm test -- --coverage
```

---

## Deployment (AWS Free Tier)

You can host this tool on AWS using the provided Terraform configuration:

1. Navigate to the `terraform/` directory.
2. Initialise Terraform: `terraform init`.
3. Create a `terraform.tfvars` file and add your EC2 key pair name: `key_name = "your-key"`.
4. Apply the configuration: `terraform apply`.
5. Once the instance is live, manually upload your `credentials.json` and `token.json` to the server using SCP.

---

## License
ISC License
