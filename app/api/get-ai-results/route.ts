import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type Message = {
  id: string
  role: 'user' | 'ai'
  content: { [key: string]: string }
}

const STRUCTURE_MAP: Record<string, string[]> = {
  'claim-warrant-impact': ['claim', 'warrant', 'impact'],
  'claim-reason-support-impact': ['claim', 'reason', 'support', 'impact'],
  'toulmin-model': ['claim', 'data', 'warrant', 'backing'],
}

function buildPrompt(messages: Message[], structure: string) {
  const expectedKeys = STRUCTURE_MAP[structure] || []

  const historyLines = messages
    .map((m, idx) => {
      const contentPairs = Object.entries(m.content)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
      return `---\nrole: ${m.role}\nid: ${m.id}\n${contentPairs}`
    })
    .join('\n')

  return `You are an assistant that evaluates debate arguments and returns a strict JSON object ONLY (no commentary, no markdown, no extra keys).

Input:
- structure: ${structure}
- expected keys for each argument part: ${expectedKeys.join(', ') || 'none'}
- messages (chat history):\n${historyLines}

Task: For each debater role (ai and user/human), evaluate the entire provided chat history and produce the following fields (exactly these keys and types):

{
  "ai": {
    "scores": {
      "structure_adherence": number,    // percentage 0-100
      "evidence_quality": number,       // 0-10 (can be decimal)
      "responsiveness": number,         // 0-10
      "persuasiveness": number,         // 0-10
      "clarity": number,                // 0-10
      "overall": number                 // 0-10
    },
    "summary": string                  // 2-4 sentence summary of strengths and weaknesses
  },
  "human": {
    "scores": {                         // same keys as above
      "structure_adherence": number,
      "evidence_quality": number,
      "responsiveness": number,
      "persuasiveness": number,
      "clarity": number,
      "overall": number
    },
    "summary": string
  },
  "structure": string                  // echo back the structure param
}

Rules:
1) Return valid JSON only. Nothing else. No explanation, no surrounding text.
2) Numbers: use numeric types, not strings. structure_adherence must be 0-100. Other scores must be 0-10. overall is 0-10.
3) summary fields must be 2-4 sentences each.
4) If a role has no messages, return zeros and an empty summary string.

Please produce the JSON now.
`
}

async function extractTextFromResponse(resp: any): Promise<string> {
  if (!resp) return ''
  if (typeof resp.output_text === 'string') return resp.output_text

  if (Array.isArray(resp.output)) {
    let text = ''
    for (const item of resp.output) {
      if (typeof item === 'string') text += item
      else if (item?.content && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (typeof c === 'string') text += c
          else if (typeof c.text === 'string') text += c.text
          else if (c?.type === 'output_text' && typeof c?.text === 'string') text += c.text
          else if (c?.value && typeof c.value === 'string') text += c.value
        }
      }
      else if (typeof item?.text === 'string') text += item.text
    }
    if (text) return text
  }

  try {
    return JSON.stringify(resp)
  } catch {
    return ''
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, structure } = body as { messages?: Message[]; structure?: string }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: '`messages` array is required in the request body' }, { status: 400 })
    }
    if (!structure || typeof structure !== 'string') {
      return NextResponse.json({ error: '`structure` is required and must be a string' }, { status: 400 })
    }

    for (const m of messages) {
      if (!m || !m.id || !m.role || !m.content || typeof m.content !== 'object') {
        return NextResponse.json({ error: 'Each message must have id, role, and content object' }, { status: 400 })
      }
      if (m.role !== 'ai' && m.role !== 'user') {
        return NextResponse.json({ error: "message.role must be 'ai' or 'user'" }, { status: 400 })
      }
    }

    const prompt = buildPrompt(messages, structure)

    const resp = await client.responses.create({
      model: 'gpt-5-mini',
      input: [
        { role: 'system', content: 'You are an unbiased debate adjudicator. Follow instructions strictly.' },
        { role: 'user', content: prompt },
      ],
    })

    const text = await extractTextFromResponse(resp)

    if (!text) {
      return NextResponse.json({ error: 'Empty response from OpenAI' }, { status: 502 })
    }

    let parsed: any = null
    try {
      parsed = JSON.parse(text)
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          parsed = JSON.parse(match[0])
        } catch (e2) {
          return NextResponse.json({ error: 'OpenAI returned invalid JSON', raw: text }, { status: 502 })
        }
      } else {
        return NextResponse.json({ error: 'OpenAI returned non-JSON response', raw: text }, { status: 502 })
      }
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.ai || !parsed.human) {
      return NextResponse.json({ error: 'Parsed response missing required keys', raw: parsed }, { status: 502 })
    }
    parsed.structure = structure

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('get-ai-results error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

export const runtime = 'edge'
