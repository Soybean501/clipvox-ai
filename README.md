# ClipVox

ClipVox is a Next.js 14 App Router application that helps teams generate narration-ready scripts tailored to their projects. This MVP covers secure authentication, project & script management, OpenAI-powered script generation, instant voiceovers, and the groundwork for future audio/video workflows.

## Quick start

1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```
3. **Populate `.env.local`** with your MongoDB Atlas URI, NextAuth secret, and OpenAI credentials (details below).
4. **Run the dev server**
   ```bash
   pnpm dev
   ```
5. Visit `http://localhost:3000` to sign up and start generating scripts.

## Environment variables

| Variable           | Required | Description |
| ------------------ | -------- | ----------- |
| `MONGODB_URI`      | ✅       | MongoDB Atlas connection string (SRV or standard) with a `clipvox` database. |
| `NEXTAUTH_SECRET`  | ✅       | Secret used by NextAuth to sign JWTs. Generate via `openssl rand -base64 32`. |
| `NEXTAUTH_URL`     | ✅       | Base URL of the app (`http://localhost:3000` in dev, Vercel URL in prod). |
| `OPENAI_API_KEY`   | ✅       | OpenAI key with access to GPT-4.1 mini (or better). |
| `OPENAI_MODEL`     | ✅       | Defaults to `gpt-4.1-mini`; override if needed. |
| `OPENAI_TTS_MODEL` | ✅       | Defaults to `gpt-4o-mini-tts`; choose another OpenAI voice model if preferred. |
| `REDIS_URL`        | ⏭️       | Placeholder for the future BullMQ queue workers. |

### Getting an OpenAI API key

1. Log in to the [OpenAI dashboard](https://platform.openai.com/).
2. Navigate to **API Keys** and create a new secret key.
3. Copy the key once and place it in `.env.local` as `OPENAI_API_KEY`.
4. (Optional) Set a usage limit via the billing dashboard to avoid surprises.

### Connecting MongoDB Atlas

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register).
2. Add a database user with read/write access.
3. Allow your IP or use `0.0.0.0/0` for development.
4. Grab the connection string and replace the username/password placeholders.
5. Set the finished URI as `MONGODB_URI` in `.env.local`.

## Available scripts

| Command        | Purpose |
| -------------- | ------- |
| `pnpm dev`     | Start Next.js in development mode. |
| `pnpm build`   | Compile the production bundle. |
| `pnpm start`   | Run the production build locally. |
| `pnpm lint`    | Execute ESLint across the codebase. |
| `pnpm test`    | Run Vitest unit tests (happy-dom environment). |

## Architecture notes

- **Framework**: Next.js 14 App Router with TypeScript and server components. Client components lean on Zustand-free patterns unless local state is required.
- **Auth**: NextAuth Credentials provider + MongoDBAdapter. Sessions are JWT-based; `session.user.id` is populated for ownership checks.
- **Database**: MongoDB via Mongoose with cached connections to support hot reload.
- **LLM integration**: OpenAI Chat Completions orchestrated in `lib/ai/scriptPlanner.ts`, enforcing tone, chapter headings, and word-count targets. Voiceovers are generated through the OpenAI TTS API (`lib/ai/text-to-speech.ts`).
- **Validation & logging**: Zod schemas guard API payloads; Pino captures structured logs.
- **UI**: TailwindCSS with shadcn/ui primitives for buttons, dialogs, tables, toasts, and form inputs.
- **Rate limiting**: Simple in-memory limiter (5 script generations per minute per user) to avoid accidental API storms.
- **Extensibility**: Queue interface (`lib/queue`) and voice catalogue stub out the audio/video roadmap. Models include TODOs for future media refs.

## Testing

- `tests/utils.wpm.test.ts` validates the word-per-minute helpers used to size script outputs.
- `tests/api.projects.test.ts` mocks the Projects route handlers to ensure serialization and creation logic work as expected.
- Vitest is configured with Happy DOM and testing-library matchers in `vitest.config.ts` and `tests/setup.ts`.

## Deployment

ClipVox targets **Vercel** for hosting and **MongoDB Atlas** for persistence.

1. Push this repository to GitHub/GitLab.
2. Import the project into Vercel and select the `pnpm` build pipeline.
3. Set the environment variables in Vercel → Settings → Environment Variables.
4. Add the same env vars to your Preview and Production environments.
5. Trigger a deployment; Vercel will run `pnpm install`, `pnpm build`, then `pnpm start` on the edge.

_Note_: The in-memory rate limiter is suitable for single-instance deployments. When scaling horizontally, migrate the limiter and the `lib/queue` stub to Redis/BullMQ to keep behaviour consistent.

## Roadmap

1. **Text-to-Speech (TTS)**: Expand voice support with queue workers, fallback providers (ElevenLabs/Google), and cloud media storage.
2. **Video pipeline**: Introduce FFmpeg-powered render workers, timeline editing, and S3-backed media assets. Extend project/script models with waveform, clip, and overlay metadata.
3. **Workflow automation**: Background jobs for script approvals, VoD packaging, and status notifications.
4. **Team collaboration**: Shared projects, role-based access, and activity feeds.

## Acceptance checklist

- [x] Credentials-based sign-up/sign-in with session redirects.
- [x] CRUD for projects with ownership enforcement.
- [x] CRUD + OpenAI generation for scripts, including word-count deltas.
- [x] One-click voiceover generation with configurable voices and inline playback.
- [x] Rate limiting on script generation requests.
- [x] Shared Zod validation and clean, typed code.
- [x] README, `.env.example`, lint/test commands, and starter tests.

Happy scripting! ✨
