"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Radar } from 'react-chartjs-2'
import 'chart.js/auto'
import {
  ArrowLeft,
  MessageSquare,
  Trophy,
  CheckCircle2,
  AlertCircle as AlertCircle2,
  Sparkles,
  User,
  Bot,
  Share,
  Copy,
  Check,
} from "lucide-react"
import { useResultStore } from "@/lib/resultStore"
import { useDebateStore } from "@/lib/debatestore"
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultsPage() {
  const storeAiResults = useResultStore((state) => state.aiResults);
  const storeHumanResults = useResultStore((state) => state.humanResults);
  const storeDebateConfig = useResultStore((state) => state.debateConfig);
  const storeAiSummary = useResultStore((state) => state.aiSummary);
  const storeHumanSummary = useResultStore((state) => state.humanSummary);
  const clearStore = useResultStore((state) => state.clearStore);
  const clearMessages = useDebateStore((state) => state.clearMessages);
  const storeOriginURL = useResultStore((state) => state.originURL);
  const storeMessages = useDebateStore((state) => state.messages);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const debateConfig = storeDebateConfig ?? { topic: '', side: '', difficulty: '' };
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkLoading, setLinkLoading] = useState(true)
  const [link, setLink] = useState("")

  const safeHuman = storeHumanResults ?? {
    clarity: 0,
    evidence_quality: 0,
    overall: 0,
    persuasiveness: 0,
    responsiveness: 0,
    structure_adherence: 0,
  }
  const safeAi = storeAiResults ?? { ...safeHuman }

  const fmtPercent = (n: number) => `${Math.round(n)}%`
  const fmtOutOf10 = (n: number) => `${Number.isFinite(n) ? Number(n).toFixed(1) : '0.0'} / 10`

  const decideWinner = (h: number, a: number) => (Math.abs(h - a) < 1e-6 ? 'Tie' : h > a ? 'Human' : 'AI')

  const results = [
    {
      criteria: 'Structure Adherence',
      humanScore: fmtPercent(safeHuman.structure_adherence),
      aiScore: fmtPercent(safeAi.structure_adherence),
      winner: decideWinner(safeHuman.structure_adherence, safeAi.structure_adherence),
      humanIcon: safeHuman.structure_adherence >= safeAi.structure_adherence ? 'check' : undefined,
      aiIcon: safeAi.structure_adherence > safeHuman.structure_adherence ? 'alert' : undefined,
    },
    {
      criteria: 'Evidence Quality',
      humanScore: fmtOutOf10(safeHuman.evidence_quality),
      aiScore: fmtOutOf10(safeAi.evidence_quality),
      winner: decideWinner(safeHuman.evidence_quality, safeAi.evidence_quality),
    },
    {
      criteria: 'Responsiveness',
      humanScore: fmtOutOf10(safeHuman.responsiveness),
      aiScore: fmtOutOf10(safeAi.responsiveness),
      winner: decideWinner(safeHuman.responsiveness, safeAi.responsiveness),
    },
    {
      criteria: 'Persuasiveness',
      humanScore: fmtOutOf10(safeHuman.persuasiveness),
      aiScore: fmtOutOf10(safeAi.persuasiveness),
      winner: decideWinner(safeHuman.persuasiveness, safeAi.persuasiveness),
    },
    {
      criteria: 'Clarity',
      humanScore: fmtOutOf10(safeHuman.clarity),
      aiScore: fmtOutOf10(safeAi.clarity),
      winner: decideWinner(safeHuman.clarity, safeAi.clarity),
    },
    {
      criteria: 'Overall Score',
      humanScore: fmtOutOf10(safeHuman.overall),
      aiScore: fmtOutOf10(safeAi.overall),
      winner: decideWinner(safeHuman.overall, safeAi.overall),
      isOverall: true,
    },
  ]

  const aiFeedback = {
    human: storeHumanSummary ??
      "No summary available.",
    ai: storeAiSummary ??
      "No summary available.",
  }

  const getWinnerColor = (winner: string) => {
    if (winner === "Human") return "text-white"
    if (winner === "AI") return "text-accent"
    return "text-muted-foreground"
  }

  const getWinnerBadge = (winner: string) => {
    if (winner === "Human") return "default"
    if (winner === "AI") return "secondary"
    return "outline"
  }

  const newDebateClickHandler = () => {
    clearStore();
    clearMessages();
    router.push("/topics");
  }

  const reviewDebateHandler = () => {
    router.push(storeOriginURL);
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleShare = async (open: boolean) => {
    setShareOpen(open);

    if (open) {
      setLinkLoading(true);
      setCopied(false);
      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              aiSummary: storeAiSummary,
              humanSummary: storeHumanSummary,
              humanResults: storeHumanResults,
              aiResults: storeAiResults,
              messages: storeMessages,
              debateConfig: storeDebateConfig,
           }),
        });
        const data = await res.json();

        const shareUrl = `${window.location.origin}/share/${encodeURIComponent(data.id)}`;
        setLink(shareUrl);
      } finally {
        setLinkLoading(false);
      }
    }
    
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') setIsDarkMode(true)
    else if (saved === 'light') setIsDarkMode(false)
  }, [])

  if (!storeAiResults || !storeHumanResults) {
    if (!isDarkMode) {
      return <img src="/blackbigloader.svg" alt="Loading results" className="w-12 h-12 mx-auto mt-20" />
    }
    return <img src="/whitebigloader.svg" alt="Loading results" className="w-12 h-12 mx-auto mt-20" />
  }

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center ml-67">
              <h1 className="text-lg font-bold text-balance">{debateConfig.topic}</h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Badge variant="secondary">{debateConfig.side}</Badge>
                <Badge variant="outline">{debateConfig.difficulty}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={shareOpen} onOpenChange={handleShare}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Share Debate Results</DialogTitle>
                    <DialogDescription>
                      Anyone with this link can view your debate results and performance breakdown.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <Input value={linkLoading ? "Generating link..." : link} readOnly className="h-9" />
                    </div>
                    <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={reviewDebateHandler}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Review Debate
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Results Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Debate Results</h2>
            <p className="text-muted-foreground">Performance breakdown across all criteria</p>
          </div>

          {/* Results Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-sm">Criteria</th>
                    <th className="text-center py-4 px-6 font-semibold text-sm">Human Score</th>
                    <th className="text-center py-4 px-6 font-semibold text-sm">AI Score</th>
                    <th className="text-center py-4 px-6 font-semibold text-sm">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr
                      key={index}
                      className={`border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors ${
                        result.isOverall ? "bg-accent/5 font-semibold" : ""
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {result.isOverall && <Trophy className="w-4 h-4 text-primary" />}
                          <span className={result.isOverall ? "text-base" : ""}>{result.criteria}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {result.humanIcon === "check" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          <span className={result.winner === "Human" ? "font-semibold text-primary" : ""}>
                            {result.humanScore}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {result.aiIcon === "alert" && <AlertCircle2 className="w-4 h-4 text-accent" />}
                          <span className={result.winner === "AI" ? "font-semibold text-accent" : ""}>
                            {result.aiScore}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <Badge variant={getWinnerBadge(result.winner)} className={getWinnerColor(result.winner)}>
                          {result.winner}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </Card>

              <div className="max-w-2xl mx-auto">
                <Radar
                  data={{
                    labels: results.map((r) => r.criteria),
                    datasets: [
                      {
                        label: 'Human',
                        data: [
                          safeHuman.structure_adherence / 10,
                          safeHuman.evidence_quality,
                        safeHuman.responsiveness,
                        safeHuman.persuasiveness,
                        safeHuman.clarity,
                        safeHuman.overall,
                      ],
                      backgroundColor: 'rgba(59,130,246,0.2)',
                      borderColor: 'rgba(59,130,246,0.8)',
                      pointBackgroundColor: 'rgba(59,130,246,0.9)',
                    },
                    {
                      label: 'AI',
                      data: [
                        safeAi.structure_adherence / 10,
                        safeAi.evidence_quality,
                        safeAi.responsiveness,
                        safeAi.persuasiveness,
                        safeAi.clarity,
                        safeAi.overall,
                      ],
                      backgroundColor: 'rgba(236,72,153,0.15)',
                      borderColor: 'rgba(236,72,153,0.85)',
                      pointBackgroundColor: 'rgba(236,72,153,0.9)',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  scales: {
                    r: {
                      suggestedMin: 0,
                      suggestedMax: 10,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                  plugins: {
                    legend: { position: 'top' as const },
                  },
                }}
              />

            </div>
          

          <div className="space-y-6">
            {/* Section Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="relative">
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  <div className="absolute inset-0 blur-md bg-primary/30 animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-bold">AI Analysis & Feedback</h3>
              <p className="text-muted-foreground text-sm">Personalized insights to improve your debate skills</p>
            </div>

            {/* Feedback Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Human Feedback */}
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="relative p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Your Performance</h4>
                      <p className="text-xs text-muted-foreground">Human Debater</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{aiFeedback.human}</p>
                </div>
              </Card>

              {/* AI Feedback */}
              <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-accent/5 via-background to-background">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
                <div className="relative p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                      <Bot className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">AI Performance</h4>
                      <p className="text-xs text-muted-foreground">AI Opponent</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{aiFeedback.ai}</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="lg" onClick={reviewDebateHandler}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Review Debate
              </Button>
            <Button size="lg" onClick={newDebateClickHandler}>
              <Trophy className="w-4 h-4 mr-2" />
              Start New Debate
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
