import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      aiSummary,
      humanSummary,
      humanResults,
      aiResults,
      messages,
      debateConfig,
    } = body || {};

    if (typeof aiSummary !== 'string' || typeof humanSummary !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid summaries' }, { status: 400 });
    }

    if (typeof humanResults !== 'object' || humanResults === null) {
      return NextResponse.json({ error: 'Missing or invalid humanResults' }, { status: 400 });
    }

    if (typeof aiResults !== 'object' || aiResults === null) {
      return NextResponse.json({ error: 'Missing or invalid aiResults' }, { status: 400 });
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages array' }, { status: 400 });
    }

    if (typeof debateConfig !== 'object' || debateConfig === null) {
      return NextResponse.json({ error: 'Missing or invalid debateConfig' }, { status: 400 });
    }

    const id = Math.random().toString(36).substring(2, 10);

    const payload = {
      aiSummary,
      humanSummary,
      humanResults,
      aiResults,
      messages,
      debateConfig,
      createdAt: new Date().toISOString(),
    };

    await redis.set(id, JSON.stringify(payload));

    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/share/${id}`;
    return NextResponse.json({ id, url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const content = await redis.get<string>(id);
    if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch (e) {
      return NextResponse.json({ id, content });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to retrieve content" }, { status: 500 });
  }
}
    