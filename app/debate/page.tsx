"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Clock, Send, ArrowLeft, GripVertical, Trophy, HelpCircle, AlertTriangle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useDebateStore } from "@/lib/debatestore"
import { useResultStore } from "@/lib/resultStore"
import { HMR_MESSAGE_SENT_TO_SERVER } from "next/dist/server/dev/hot-reloader-types";

type ArgumentStructure = "claim-warrant-impact" | "claim-reason-support-impact" | "toulmin-model"

interface ArgumentFields {
  [key: string]: string
}

interface Message {
  id: string
  role: "user" | "ai"
  content: { [key: string]: string }
}

const STRUCTURE_CONFIG: Record<
  ArgumentStructure,
  {
    fields: { key: string; label: string; placeholder: string }[]
    description: string
    explanation: string
  }
> = {
  "claim-warrant-impact": {
    fields: [
      { key: "claim", label: "Claim", placeholder: "State your main argument or position..." },
      {
        key: "warrant",
        label: "Warrant",
        placeholder: "Provide evidence, reasoning, or justification for your claim...",
      },
      { key: "impact", label: "Impact", placeholder: "Explain the significance and consequences of your argument..." },
    ],
    description: "Claim-Warrant-Impact (CWI)",
    explanation:
      "The CWI structure is a foundational debate format. Start with a clear Claim (your main argument), support it with a Warrant (evidence or reasoning that proves your claim), and conclude with an Impact (why your argument matters and what consequences it has). This structure emphasizes logical flow from assertion to justification to significance.",
  },
  "claim-reason-support-impact": {
    fields: [
      { key: "claim", label: "Claim", placeholder: "State your main argument or position..." },
      { key: "reason", label: "Reason", placeholder: "Explain why your claim is true..." },
      { key: "support", label: "Support", placeholder: "Provide evidence, data, or examples..." },
      { key: "impact", label: "Impact", placeholder: "Explain the significance and consequences..." },
    ],
    description: "Claim-Reason-Support-Impact (CRSI)",
    explanation:
      "The CRSI structure adds an extra layer of depth. Begin with your Claim, then provide a Reason (the logical explanation for why your claim is valid), followed by Support (concrete evidence, data, or examples that back up your reason), and finish with Impact. This structure is ideal for arguments requiring substantial evidence and detailed justification.",
  },
  "toulmin-model": {
    fields: [
      { key: "claim", label: "Claim", placeholder: "State your main argument or position..." },
      { key: "data", label: "Data", placeholder: "Present facts, statistics, or evidence..." },
      { key: "warrant", label: "Warrant", placeholder: "Explain how the data supports your claim..." },
      { key: "backing", label: "Backing", placeholder: "Provide additional support for your warrant..." },
    ],
    description: "Toulmin Model",
    explanation:
      "The Toulmin Model is a sophisticated argumentation framework developed by philosopher Stephen Toulmin. It consists of a Claim (your position), Data (factual evidence), Warrant (the logical connection between data and claim), and Backing (additional support that strengthens your warrant). This model is particularly effective for complex arguments requiring rigorous logical analysis and multiple layers of support.",
  },
}

export default function DebatePage() {
  const searchParams = useSearchParams()
  const structure = (searchParams.get("structure") || "claim-warrant-impact") as ArgumentStructure
  const structureConfig = STRUCTURE_CONFIG[structure]
  const firstSpeaker = searchParams.get("firstSpeaker") || "ai"

  const [argumentFields, setArgumentFields] = useState<ArgumentFields>({})

  const roundDurationMinutes = Number.parseInt(searchParams.get("duration") || "5")
  const initialTimeInSeconds = roundDurationMinutes * 60

  const [timeRemaining, setTimeRemaining] = useState(initialTimeInSeconds)
  const [isTimerActive, setIsTimerActive] = useState(true)
  const [panelWidth, setPanelWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const messagesRef = useRef<Message[]>(messages)

  const debateConfig = {
    topic: searchParams.get("topic") || "Universal Healthcare Should Be Implemented",
    side: searchParams.get("side") || "For",
    difficulty: searchParams.get("difficulty") || "Intermediate",
    currentRound: 1,
    totalRounds: Number.parseInt(searchParams.get("rounds") || "5"),
    timed: searchParams.get("timed") === "true",
  }
  const [currentRound, setCurrentRound] = useState(1)
  const pendingPlaceholderRef = useRef<string | null>(null);
  const hasFetchedRef = useRef(false);
  const storeMessages = useDebateStore((state) => state.messages)
  const addStoreMessage = useDebateStore((state) => state.addMessage)
  const [isAITyping, setIsAITyping] = useState(storeMessages.length > 0 ? false : firstSpeaker === "ai")
  const [userTurn, setUserTurn] = useState(storeMessages.length > 0 ? false : firstSpeaker === "user")

  const setAIResults = useResultStore((state) => state.setAIResults)
  const setHumanResults = useResultStore((state) => state.setHumanResults)
  const setAISummary = useResultStore((state) => state.setAISummary)
  const setHumanSummary = useResultStore((state) => state.setHumanSummary)
  const setDebateConfig = useResultStore((state) => state.setDebateConfig)
  const setOriginURL = useResultStore((state) => state.setOriginURL)
  const [fetchingResults, setFetchingResults] = useState(false);

  const clearMessages = useDebateStore((state) => state.clearMessages)
  const clearStore = useResultStore((state) => state.clearStore)
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const router = useRouter();

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // AI TURN
  useEffect(() => {
    if (userTurn) return
    if (storeMessages.length > 0) return;

    let cancelled = false

    const fetchAIArgument = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      setIsAITyping(true)
      try {
        setIsLoadingAI(true);
        const response = await fetch("/api/get-ai-argument", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            structure: structure,
            topic: debateConfig.topic,
            side: debateConfig.side === "For" ? "Against" : "For",
            difficulty: debateConfig.difficulty,
            messages: messagesRef.current,
          }),
        })
        setIsLoadingAI(false);

        const data = await response.json()
        console.log(data);
        const aiArgument = data?.argument || {}

        const placeholderContent: ArgumentFields = {}
        structureConfig.fields.forEach((f) => {
          placeholderContent[f.key] = ""
        })
        const placeholderId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
        const aiMessage: Message = { id: placeholderId, role: "ai", content: placeholderContent }
        pendingPlaceholderRef.current = placeholderId
        setMessages((prev) => [...prev, aiMessage])

        const id = placeholderId

        const runAnimation = async () => {
          //console.log("running animation");
          const charDelay = 12
          const fieldPause = 250
          for (const field of structureConfig.fields) {
            //console.log("iterating field", field.key);
            const key = field.key
            const target = aiArgument[key] ?? ""
            for (let i = 1; i <= target.length; i++) {
              //console.log("animating char", i);
              if (cancelled) { console.log("cancelled"); return }
              const partial = target.slice(0, i)
              setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: { ...m.content, [key]: partial } } : m)))
              // eslint-disable-next-line no-await-in-loop
              await new Promise((r) => setTimeout(r, charDelay))
            }

            if (cancelled) return
            await new Promise((r) => setTimeout(r, fieldPause))
          }
          if (cancelled) return
          // Use the latest ref to build the updated messages array so we can act on it synchronously
          const updated = messagesRef.current.map((m) => (m.id === id ? { ...m, content: { ...m.content, ...aiArgument } } : m))
          setMessages(updated)
          pendingPlaceholderRef.current = null
          setIsAITyping(false)
          setUserTurn(true)
          setIsTimerActive(true)
          if (firstSpeaker === "user") {
            if (currentRound == debateConfig.totalRounds) {
              // pass the up-to-date messages array to endDebate so it doesn't rely on stale state
              endDebate(updated)
              return;
            }
            setCurrentRound((prev) => prev + 1)
          }
          hasFetchedRef.current = false;
        }

        runAnimation()


      } catch (err) {
        console.error("Failed to fetch AI argument", err)
        setIsAITyping(false)
        setUserTurn(true)
        setIsTimerActive(true)
      }
    }

    fetchAIArgument()

    return () => {
      // cancelled = true
    }
  }, [userTurn, structure])

  // SMOOTH SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [isLoadingAI])

  // USER TURN
  const handleSubmit = () => {
    if (storeMessages.length > 0) {
      setUserTurn(false)
      return
    }
    const userId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    const newUserMessage: Message = {
      id: userId,
      role: "user",
      content: { ...argumentFields },
    }
    const newMessages = [...messages, newUserMessage]
    setMessages(newMessages)
    setArgumentFields({})
    setTimeRemaining(initialTimeInSeconds)
    setIsTimerActive(false)
    setUserTurn(false)
    if (firstSpeaker === "ai") {
      if (currentRound == debateConfig.totalRounds) {
        endDebate(newMessages);
        return;
      }
      setCurrentRound((prev) => prev + 1)
    }
  }

  // TIMER
  useEffect(() => {
    if (storeMessages.length > 0) return;
    if (!isTimerActive || !debateConfig.timed || !userTurn) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // IF TIME RUNS OUT
          const placeholderContent: ArgumentFields = {}
          structureConfig.fields.forEach((f) => {
            placeholderContent[f.key] = "User has forfeited this argument due to time running out."
          })
          const forfeitId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
          const message: Message = { id: forfeitId, role: "user", content: placeholderContent }
            const newMessages = [...messages, message]
            setMessages(newMessages)
          setArgumentFields({})
          setTimeRemaining(initialTimeInSeconds)
          setIsTimerActive(false)
          setUserTurn(false)
          if (firstSpeaker === "ai") {
              if (currentRound == debateConfig.totalRounds) {
                endDebate(newMessages);
                return 0;
              }
            setCurrentRound((prev) => prev + 1)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerActive, debateConfig.timed, userTurn])

  // END OF DEBATE
  const endDebate = async (msgsParam?: Message[]) => {
    const msgsToStore = msgsParam ?? messages
    msgsToStore.forEach((msg) => {
      addStoreMessage(msg)
    })
    // fetch results data and add to store
    setFetchingResults(true);
    const response = await fetch("/api/get-ai-results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: msgsToStore, structure }),
    })
    const data = await response.json()
    console.log(data)
    setAIResults(data.ai.scores);
    setHumanResults(data.human.scores);
    setAISummary(data.ai.summary);
    setHumanSummary(data.human.summary);
    setDebateConfig({
      topic: debateConfig.topic,
      side: debateConfig.side,
      difficulty: debateConfig.difficulty,
      totalRounds: debateConfig.totalRounds,
    });
    setOriginURL(window.location.href.substring(window.location.href.indexOf("/debate")));
    setFetchingResults(false);
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      if (newWidth >= 30 && newWidth <= 70) {
        setPanelWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  const updateField = (key: string, value: string) => {
    setArgumentFields((prev) => ({ ...prev, [key]: value }))
  }

  const allFieldsFilled = structureConfig.fields.every((field) => argumentFields[field.key]?.trim())

  const handleViewResults = () => {
    router.push("/debate/results")
  }

  const forfeitHandler = () => {
    clearMessages();
    clearStore();
    router.push("/topics");
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <ThemeToggle />

      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center gap-4 mx-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Exit Debate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Exit Debate?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base leading-relaxed">
                    Are you sure you want to exit this debate? Exiting will forfeit the debate and clear the current
                    conversation. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="w-[50%]">Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                      <Button variant="destructive" className="w-[50%]" onClick={forfeitHandler}>
                        Exit and Forfeit
                      </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex-1 text-center mx-0 mr-0 ml-10">
              <h1 className="text-lg font-bold text-balance">{debateConfig.topic}</h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Badge variant="secondary">{debateConfig.side}</Badge>
                <Badge variant="outline">{debateConfig.difficulty}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{structureConfig.description}</DialogTitle>
                    <DialogDescription className="text-base leading-relaxed pt-2">
                      {structureConfig.explanation}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 pt-4">
                    <h4 className="font-semibold text-sm">Structure Components:</h4>
                    <div className="space-y-2">
                      {structureConfig.fields.map((field) => (
                        <div key={field.key} className="flex gap-2">
                          <Badge variant="secondary" className="shrink-0">
                            {field.label}
                          </Badge>
                          <p className="text-sm text-muted-foreground">{field.placeholder}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">
                  Round {currentRound}/{debateConfig.totalRounds}
                </div>
                {debateConfig.timed && (
                  <div
                    className={`text-sm font-mono flex items-center gap-1 ${
                      timeRemaining < 60 ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {formatTime(timeRemaining)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        <div className="flex flex-col border-r border-border" style={{ width: `${panelWidth}%` }}>
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-6">
              <div className="space-y-6 max-w-3xl mx-auto">
                {(storeMessages.length > 0 ? storeMessages : messages).map((message: Message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <Card
                      className={`p-6 max-w-[85%] min-w-[30%] ${
                        message.role === "ai" ? "bg-accent/10 border-accent/30" : "bg-primary/10 border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant={message.role === "ai" ? "secondary" : "default"}>
                          {message.role === "ai" ? "AI Opponent" : "You"}
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        {structureConfig.fields.map((field) => (
                          <div key={field.key}>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              {field.label}
                            </div>
                            <p className="text-foreground leading-relaxed response-link" dangerouslySetInnerHTML={{__html: message.content[field.key]}}></p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                ))}
                {
                  isLoadingAI && storeMessages.length < 1 && 
                    <Card
                      className={"p-6 max-w-[85%] min-w-[30%] bg-accent/10 border-accent/30"}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant={"secondary"}>
                          AI Opponent
                        </Badge>
                        <img src="/aitypingloader.svg" alt="AI typing animation" className="w-6 h-6" />
                      </div>

                      <div className="space-y-4">
                        {structureConfig.fields.map((field) => (
                          <div key={field.key}>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              {field.label}
                            </div>
                          </div>
                        ))}
                      </div>
                  </Card>
                }
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>

        <div
          className="w-1 bg-border hover:bg-primary/50 cursor-col-resize flex items-center justify-center group relative"
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
          <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        <div className="overflow-y-auto bg-card/30" style={{ width: `${100 - panelWidth}%` }}>
          <div className="px-4 py-6 h-full flex flex-col">
            <div className="space-y-4 max-w-2xl mx-auto w-full">
              {structureConfig.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm font-semibold">
                    {field.label}
                  </Label>
                  <Textarea
                    id={field.key}
                    placeholder={field.placeholder}
                    value={argumentFields[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    disabled={storeMessages.length > 0 ? true : !userTurn || isAITyping}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              ))}
              {storeMessages.length < 1 ?
              (<Button onClick={handleSubmit} disabled={!allFieldsFilled || isAITyping} className="w-full" size="lg">
                <Send className="w-4 h-4 mr-2" />
                Submit Argument
              </Button>)
              :
              <Button onClick={handleViewResults} disabled={fetchingResults} className="w-full" size="lg">
                <Send className="w-4 h-4 mr-2" />
                {fetchingResults ? "Generating Results..." : "View Results"}
                {fetchingResults && localStorage.getItem("theme") === "dark" && <img src="/blackloader.svg" alt="Loading results" className="w-6 h-6 ml-2 inline-block" />}
                {fetchingResults && localStorage.getItem("theme") === "light" && <img src="/whiteloader.svg" alt="Loading results" className="w-6 h-6 ml-2 inline-block" />}
              </Button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
