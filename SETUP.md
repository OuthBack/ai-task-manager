# Setup Guide - AI Task Manager Backend

## Prerequisites

- Node.js 20+
- npm or yarn
- A Google Gemini API key (free tier available)

## Getting Started

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Create Your .env File

```bash
cp .env.example .env
```

### 3. Add Your Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click **"Get API key"**
3. Create or select a Google Cloud project
4. Copy the API key
5. Open `.env` and replace `your-gemini-api-key-here` with your actual key:
   ```env
   GEMINI_API_KEY=sk-...your-actual-key...
   ```

### 4. Verify Setup

```bash
npm run build          # Compile TypeScript
npm test              # Run all tests
npm run start:dev     # Start dev server on http://localhost:3000
```

Visit `http://localhost:3000/api/docs` to see the Swagger API documentation.

## Important Notes

### .env File Security

- **Your `.env` is in `.gitignore`** — it will never be committed
- **Each developer has their own `.env` file** with their own API key
- **Never share your API key** in Slack, email, or source control
- If your key is accidentally committed, regenerate it immediately

### API Key Requirements

- `GEMINI_API_KEY` is **required** to use the AI task generation endpoint
- Requests without a valid API key will fail with `401 Unauthorized`
- The key is passed per-request (not stored in database)

### Running Without AI Features

If you don't need AI task generation during development, you can:

- Use any placeholder value for `GEMINI_API_KEY`
- The `/tasks` endpoints will work fine without it
- Only the `/ai/generate` endpoint requires a valid key

## Common Issues

### "GEMINI_API_KEY is missing"

- Make sure you copied `GEMINI_API_KEY=...` into your `.env`
- Verify the value is not empty or just whitespace
- Restart the dev server after updating `.env`

### "Invalid API key or permission denied"

- Check your API key hasn't expired
- Regenerate a new key from [AI Studio](https://ai.google.dev/) if unsure
- Ensure billing is enabled in your Google Cloud project (free tier available)

### "Too many requests (429)"

- You've hit the Gemini API rate limit
- Wait a few minutes before retrying
- Check your API quota at [AI Studio](https://ai.google.dev/)

## Development Workflow

```bash
# Terminal 1: Start dev server (auto-reloads on changes)
npm run start:dev

# Terminal 2: Watch tests
npm test -- --watch

# Terminal 3: Run linter/formatter
npm run lint
npm run format
```

## Next Steps

- Read [TRD.md](../TRD.md) for architecture and design decisions
- Check [.github/copilot-instructions.md](.github/copilot-instructions.md) for Copilot-specific patterns
- Explore `src/` directory structure
