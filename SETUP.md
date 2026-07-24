# KraaFo — Quick Start

## 1. Add your API key
Edit `server/.env` and replace the placeholder:
```
ANTHROPIC_API_KEY=sk-ant-...your-real-key-here...
```
Get your key at: https://console.anthropic.com/

## 2. Start the server (Terminal 1)
```bash
cd krafo/server
npm run dev
```
Server runs on http://localhost:3001

## 3. Start the client (Terminal 2)
```bash
cd krafo/client
npm run dev
```
App opens at http://localhost:5173

## 4. Use the app
1. Visit http://localhost:5173
2. Click "Get Started Free"
3. Fill in your company details
4. Upload your logo (colors are auto-extracted)
5. Hit "Launch KraaFo"
6. Create invoices/receipts with AI suggestions
7. Download professional PDFs

## Project Structure
```
krafo/
├── server/          Express API + SQLite + PDF + AI
│   ├── src/
│   │   ├── db/          SQLite schema
│   │   ├── routes/      API endpoints
│   │   ├── services/    PDF, AI, Image processing
│   │   └── templates/   HTML invoice template
│   └── uploads/     Uploaded logos stored here
└── client/          React + Vite + Tailwind
    └── src/
        ├── pages/   Landing, Setup, Generator
        ├── hooks/   useOrg (org state)
        └── utils/   API client, helpers
```
