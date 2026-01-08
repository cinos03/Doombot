# Discord Summarizer Bot Dashboard

## Overview

A Discord bot dashboard application that monitors Discord channels and generates AI-powered daily summaries. The bot watches a configured channel for messages, uses OpenAI to generate concise summaries, and posts them to a designated summary channel. Additionally, the bot can monitor X (Twitter) and Truth Social accounts for new posts and automatically share them to designated Discord channels. The web dashboard provides real-time monitoring, configuration management, summary history viewing, and AutoPost account management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme inspired by Discord aesthetics
- **Animations**: Framer Motion for page transitions and micro-interactions

The frontend follows a pages-based structure with shared components. Custom hooks in `client/src/hooks/use-bot.ts` encapsulate all API interactions using React Query mutations and queries.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with tsx for TypeScript execution
- **API Structure**: RESTful endpoints defined in `server/routes.ts`
- **Build System**: esbuild for server bundling, Vite for client

The server uses a storage abstraction pattern (`server/storage.ts`) that interfaces with the database through Drizzle ORM. This pattern allows swapping storage implementations if needed.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod schema validation via drizzle-zod
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via `drizzle-kit push` command

Core tables:
- `settings`: Bot configuration (watch/summary channel IDs, active status, summary times, AI settings)
- `summaries`: Generated summary content with timestamps and status
- `logs`: System logs with level and message
- `autopost_targets`: AutoPost configuration (platform, handle, interval, channel, announcement template)
- `conversations`/`messages`: Chat integration tables for AI conversations

### External Service Integrations
- **Discord**: discord.js client for fetching channel messages and posting summaries
- **OpenAI**: Chat completions API for generating summaries (via Replit AI Integrations)
- **Scheduling**: node-cron for automated daily summary generation

### Replit Integrations
Located in `server/replit_integrations/`:
- **Chat**: Persistent conversation storage with OpenAI streaming responses
- **Image**: Image generation using gpt-image-1 model
- **Batch**: Utility for rate-limited batch processing with retries

## External Dependencies

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `DISCORD_TOKEN`: Discord bot authentication token
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI API key (set by Replit AI integration)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI base URL (set by Replit AI integration)

### Third-Party Services
- **PostgreSQL**: Primary data store for settings, summaries, logs, and chat history
- **Discord API**: Bot reads messages from watch channel, posts summaries to summary channel
- **OpenAI API**: Generates natural language summaries from Discord messages using GPT models

### Key NPM Dependencies
- `discord.js`: Discord bot client library
- `openai`: Official OpenAI SDK
- `drizzle-orm` + `drizzle-kit`: Database ORM and migration tooling
- `node-cron`: Scheduled task execution
- `express-session` + `connect-pg-simple`: Session management with PostgreSQL store