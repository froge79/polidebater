# Polidebater

Practice political debate against an AI opponent that argues in structured formats and scores both sides afterward.

## The Problem

Learning to argue well is hard without a sparring partner. Most people debate informally, with no structure, no sourcing, and no feedback on what made an argument weak or strong.

## How It Works

Pick a topic, a side (For/Against), a difficulty (Beginner, Intermediate, Expert) and an argument structure (Claim-Warrant-Impact, Claim-Reason-Support-Impact, or Toulmin). You and the AI then trade structured arguments turn by turn. The AI cites sources as links. At the end, the full transcript is scored on structure adherence, evidence quality, responsiveness, persuasiveness and clarity, with a summary for each debater. Results can be shared through a public link.

**Stack**
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS + Radix UI / shadcn components
- OpenAI API for argument generation and judging (`app/api/get-ai-argument`, `app/api/get-ai-results`)
- Upstash Redis for shareable results (`app/api/share`)
- Deployed on Vercel

## Running Locally

```bash
pnpm install
pnpm dev
```

Create `.env.local` with `OPENAI_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and `NEXT_PUBLIC_BASE_URL`.
