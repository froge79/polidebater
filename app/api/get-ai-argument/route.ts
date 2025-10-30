import { NextResponse } from "next/server"
import OpenAI from "openai"

type Structure = "claim-warrant-impact" | "claim-reason-support-impact" | "toulmin-model"

interface Message {
	role: "user" | "ai"
	content: { [key: string]: string }
}

const VALID_STRUCTURES: Structure[] = [
	"claim-warrant-impact",
	"claim-reason-support-impact",
	"toulmin-model",
]

function structureFields(structure: Structure) {
	switch (structure) {
		case "claim-warrant-impact":
			return ["claim", "warrant", "impact"]
		case "claim-reason-support-impact":
			return ["claim", "reason", "support", "impact"]
		case "toulmin-model":
			return ["claim", "data", "warrant", "backing"]
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()

		const structure = body.structure as Structure
		const topic = String(body.topic || "")
		const side = String(body.side || "")
		const difficulty = String(body.difficulty || "")
		const messages = body.messages as Message[] | undefined

		if (!structure || !VALID_STRUCTURES.includes(structure)) {
			return NextResponse.json({ error: "Invalid or missing 'structure' parameter." }, { status: 400 })
		}

		if (!topic) return NextResponse.json({ error: "Missing 'topic' parameter." }, { status: 400 })
		if (!side || (side !== "For" && side !== "Against"))
			return NextResponse.json({ error: "'side' must be 'For' or 'Against'." }, { status: 400 })

		const allowedDifficulties = ["Beginner", "Intermediate", "Expert"]
		if (!difficulty || !allowedDifficulties.includes(difficulty))
			return NextResponse.json({ error: "'difficulty' must be one of Beginner, Intermediate, Expert." }, { status: 400 })

		const safeMessages: Message[] = Array.isArray(messages) ? messages : []

		const openAiKey = process.env.OPENAI_API_KEY;
		if (!openAiKey) return NextResponse.json({ error: "OpenAI API key not configured on server." }, { status: 500 })

		const fields = structureFields(structure)

		const systemPrompt = `You are an assistant that participates in a formal political debate. You MUST respond with a single JSON object and NOTHING else (no markdown, no commentary, no explanation). The JSON object MUST contain exactly the following keys in this order: ${fields.join(", ")}. Each value must be a string containing the text for that part of the argument. Do not include any extra keys. For the warrant, make sure to cite your sources. when you cite a source or include a link, format it using HTML tags instead of Markdown DO NOT INCLUDE ANY MARKDOWN. REPLACE IT WITH <a> elements ONLY— for example:
<a href="https://example.com">source text</a>. Make sure to remove markdown formatting from any quoted text, and use <a> links only. 

The debate topic is: "${topic}".
The AI is arguing on the side: "${side}".
The response should be written for difficulty level: "${difficulty}" (adjust tone, depth, and vocabulary accordingly).

When replying, respond directly to the latest user argument supplied in the conversation history below. If the conversation history is empty, BEGIN the debate by producing a full argument for the AI side (i.e., act as the opening speaker). Ensure the content is persuasive, fact-aware, and logically structured into the requested fields. Output must be parsable JSON only.`

		const conversation: { role: string; content: string }[] = []

		conversation.push({ role: "system", content: systemPrompt })

		for (const m of safeMessages) {
			const role = m.role === "ai" ? "assistant" : "user"
			const flattened = Object.entries(m.content || {})
				.map(([k, v]) => `${k}: ${v}`)
				.join("\n\n")
			conversation.push({ role, content: flattened || "" })
		}

		if (conversation.filter((c) => c.role === "user").length === 0) {
			conversation.push({ role: "user", content: `Please begin the debate on the topic above and present an opening argument for the "${side}" side. Remember to adjust the length of the output based on the difficulty level. For example, beginner level arguments should be concise and straightforward (a few short sentences), while expert level arguments should be detailed and nuanced. However, ensure that the length of output for all difficulty levels is concise and quick enough to read - no essay-like responses.` })
		} else {
			conversation.push({ role: "user", content: "Respond to the latest user argument above and produce your next argument as JSON following the required schema. Remember to adjust the length of the output based on the difficulty level. For example, beginner level arguments should be concise and straightforward (a few short sentences), while expert level arguments should be detailed and nuanced. However, ensure that the length of output for all difficulty levels is concise and quick enough to read - no essay-like responses." })
		}

        const messagesForOpenAI = conversation.map((c) => ({ role: c.role as any, content: c.content }))
        const client = new OpenAI({ apiKey: openAiKey })
        const inputText = messagesForOpenAI
            .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
            .join("\n\n")

        const resp = await client.responses.create({
            model: "gpt-5-mini",
			tools: [
				{ type: 'web_search'}, 
			],
            input: inputText,
        })

        let assistantMessage: string | null = null
        try {
            if (Array.isArray((resp as any).output) && (resp as any).output.length > 0) {
                const parts: string[] = []
                for (const out of (resp as any).output) {
                    if (Array.isArray(out.content)) {
                        for (const c of out.content) {
                            if (typeof c.text === "string") parts.push(c.text)
                            else if (c.type === "output_text" && typeof c.text === "string") parts.push(c.text)
                        }
                    } else if (typeof out.text === "string") {
                        parts.push(out.text)
                    }
                }
                assistantMessage = parts.join("\n")
            } else if (typeof (resp as any).output_text === "string") {
                assistantMessage = (resp as any).output_text
            }
        } catch (e) {
            assistantMessage = null
        }

		let parsed = null
		try {
			parsed = typeof assistantMessage === "string" ? JSON.parse(assistantMessage) : assistantMessage
		} catch (e) {
			return NextResponse.json({ error: "Assistant returned non-JSON output", raw: assistantMessage }, { status: 502 })
		}

		if (!parsed || typeof parsed !== "object") {
			return NextResponse.json({ error: "Assistant returned an unexpected response format." }, { status: 502 })
		}

		const parsedKeys = Object.keys(parsed)
		const expected = structureFields(structure)
		const missing = expected.filter((k) => !parsedKeys.includes(k))
		if (missing.length > 0) {
			return NextResponse.json({ error: "Assistant output missing expected fields", missing, raw: parsed }, { status: 502 })
		}

		return NextResponse.json({ argument: parsed })
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
	}
}