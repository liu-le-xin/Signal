# Cloudflare Signal - Product Feedback Dashboard

A modern, beautiful dashboard built with React, Vite, and Shadcn/UI for managing product feedback. Powered by **Cloudflare Workers AI** for intelligent feedback analysis.

## Features

- **Sidebar Navigation**: Easy navigation between Feed and Themes views
- **Feed View**: View and manage incoming feedback tickets with priority, status, and tags
- **AI-Powered Analysis**: Analyze feedback using Cloudflare Workers AI to extract sentiment, themes, priority, and key insights
- **Themes Overview**: Analyze feedback patterns with interactive charts and summaries
- **Modern UI**: Built with Shadcn/UI components and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account with Workers AI enabled
- Wrangler CLI (included in devDependencies)

### Install Dependencies

```bash
npm install
```

### Running the Application

This project consists of two parts:
1. **Cloudflare Worker** - Backend API with Workers AI integration
2. **React Dashboard** - Frontend UI

#### Option 1: Run Both Separately (Recommended for Development)

**Terminal 1 - Start the Cloudflare Worker:**
```bash
npm run dev:worker
```

The Worker will run on `http://localhost:8787`

**Terminal 2 - Start the React Dashboard:**
```bash
npm run dev:app
# or simply
npm run dev
```

The React app will be available at `http://localhost:5173`

#### Option 2: Deploy Worker and Use Production URL

1. Deploy the Worker:
```bash
npm run deploy
```

2. Update the Worker URL in your environment:
```bash
# Create .env file
echo "VITE_WORKER_URL=https://your-worker.your-subdomain.workers.dev" > .env
```

3. Start the React app:
```bash
npm run dev
```

### Workers AI Configuration

The Worker is configured with Workers AI binding in `wrangler.jsonc`:

```jsonc
"ai": {
  "binding": "AI"
}
```

This allows the Worker to use `env.AI.run()` to analyze feedback. Refer to the [Cloudflare Workers AI documentation](https://developers.cloudflare.com/workers-ai/configuration/bindings/) for more details.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
  ├── components/
  │   ├── ui/          # Shadcn/UI components (Button, Card, Badge)
  │   ├── Sidebar.jsx  # Navigation sidebar
  │   ├── Feed.jsx    # Feedback tickets feed with AI analysis
  │   └── Themes.jsx  # Themes overview with charts
  ├── services/
  │   └── api.js      # API service for Workers AI endpoints
  ├── lib/
  │   └── utils.js    # Utility functions
  ├── App.jsx         # Main app component with routing
  ├── main.jsx        # React entry point
  ├── index.js        # Cloudflare Worker with AI endpoints
  └── index.css       # Global styles and Tailwind directives
```

## Technologies

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Cloudflare Workers** - Serverless backend
- **Cloudflare Workers AI** - AI inference for feedback analysis
- **Shadcn/UI** - UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart library for data visualization
- **Lucide React** - Icon library

## Dashboard Views

### Feed
- Displays incoming feedback tickets
- Shows priority, status, author, and tags
- Color-coded badges for quick identification
- **AI Analysis**: Click "Analyze with AI" to get:
  - Sentiment analysis (positive, negative, neutral)
  - Theme/category detection
  - Priority assessment
  - Suggested tags
  - Key points extraction
  - Summary

### Themes
- Overview statistics cards
- Interactive charts (Bar, Pie, Line)
- Theme distribution and trends
- Priority breakdown visualization

## API Endpoints

The Cloudflare Worker provides the following endpoints:

- `POST /api/analyze` - Analyze a single feedback text
  ```json
  {
    "text": "Feedback text here",
    "title": "Optional title"
  }
  ```

- `POST /api/analyze-batch` - Analyze multiple feedback texts
  ```json
  {
    "feedbacks": [
      { "id": "1", "text": "...", "title": "..." }
    ]
  }
  ```

- `GET /health` - Health check endpoint

## Workers AI Model

The Worker uses `@cf/meta/llama-3.1-8b-instruct` model for analysis. You can modify the model in `src/index.js` if needed.

## Environment Variables

Create a `.env` file to configure the Worker URL:

```env
VITE_WORKER_URL=http://localhost:8787
```

For production, set this to your deployed Worker URL.

## Mock Data Generator

Generate 100 sample customer feedback messages for testing:

```bash
# Make sure the Worker is running first (npm run dev:worker)
npm run ingest
```

Or run directly:

```bash
node scripts/mock-ingestor.js
```

The script will:
- Generate 100 diverse feedback messages covering various categories
- Send them to your Worker API for AI analysis
- Display the analysis results in the terminal

You can customize the Worker URL by setting the `WORKER_URL` environment variable:

```bash
WORKER_URL=http://localhost:8787 npm run ingest
```



