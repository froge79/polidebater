import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Trophy, CheckCircle2, AlertCircle as AlertCircle2, Sparkles, User, Bot, IdCard } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { notFound } from "next/navigation";

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: { [key: string]: string };
}


export default async function SharePage({ params }: { params: Promise<{ id: string }>; }) {
  const { id } = await params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/share?id=${id}`, { cache: "no-store" });

  if (!res.ok) return notFound();

  const data = await res.json();
  console.log(data);


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

  const fmtPercent = (n: number) => `${Math.round(n)}%`
  const fmtOutOf10 = (n: number) => `${Number.isFinite(n) ? Number(n).toFixed(1) : '0.0'} / 10`
  const decideWinner = (h: number, a: number) => (Math.abs(h - a) < 1e-6 ? 'Tie' : h > a ? 'Human' : 'AI')

  const aiFeedback = {
    human: data.content.humanSummary ?? "No summary available.",
    ai: data.content.aiSummary ?? "No summary available.",
  }

  const humanResults = data.content.humanResults;
  const aiResults = data.content.aiResults;

  

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>

            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-balance">{data.content.debateConfig.topic}</h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Badge variant="secondary">{data.content.debateConfig.side}</Badge>
                <Badge variant="outline">{data.content.debateConfig.difficulty}</Badge>
                <Badge variant="outline">
                  {data.content.debateConfig.totalRounds}/{data.content.debateConfig.totalRounds} Rounds
                </Badge>
              </div>
            </div>

            <div className="w-[100px]" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Debate Transcript Section */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Debate Transcript</h2>
              <p className="text-muted-foreground">Complete conversation history</p>
            </div>

            <div className="space-y-6">
              {data.content.messages.map((message: Message, index: number) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <Card
                    className={`p-6 max-w-[85%] ${
                      message.role === "ai" ? "bg-accent/10 border-accent/30" : "bg-primary/10 border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant={message.role === "ai" ? "secondary" : "default"}>
                        {message.role === "ai" ? "AI Opponent" : "You"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Round {index + 1}</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Claim
                        </div>
                        <p className="text-foreground leading-relaxed">{message.content.claim}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Warrant
                        </div>
                        <p className="text-foreground leading-relaxed response-link" dangerouslySetInnerHTML={{__html: message.content.warrant}}></p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Impact
                        </div>
                        <p className="text-foreground leading-relaxed">{message.content.impact}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Results Section */}
          <section className="space-y-8">
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
                    {/* Structure Adherence */}
                    <tr className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="text-base">Structure Adherence</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {humanResults.structure_adherence >= aiResults.structure_adherence && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                          <span className={decideWinner(humanResults.structure_adherence, aiResults.structure_adherence) === "Human" ? "font-semibold text-primary" : ""}>
                            {fmtPercent(humanResults.structure_adherence)}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {aiResults.structure_adherence > humanResults.structure_adherence && (
                            <AlertCircle2 className="w-4 h-4 text-accent" />
                          )}
                          <span className={decideWinner(humanResults.structure_adherence, aiResults.structure_adherence) === "AI" ? "font-semibold text-accent" : ""}>
                            {fmtPercent(aiResults.structure_adherence)}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <Badge variant={getWinnerBadge(decideWinner(humanResults.structure_adherence, aiResults.structure_adherence))} className={getWinnerColor(decideWinner(humanResults.structure_adherence, aiResults.structure_adherence))}>
                          {decideWinner(humanResults.structure_adherence, aiResults.structure_adherence)}
                        </Badge>
                      </td>
                    </tr>

                    {/* Evidence Quality */}
                    <tr className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span>Evidence Quality</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={decideWinner(humanResults.evidence_quality, aiResults.evidence_quality) === "Human" ? "font-semibold text-primary" : ""}>
                          {fmtOutOf10(humanResults.evidence_quality)}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={decideWinner(humanResults.evidence_quality, aiResults.evidence_quality) === "AI" ? "font-semibold text-accent" : ""}>
                          {fmtOutOf10(aiResults.evidence_quality)}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <Badge variant={getWinnerBadge(decideWinner(humanResults.evidence_quality, aiResults.evidence_quality))} className={getWinnerColor(decideWinner(humanResults.evidence_quality, aiResults.evidence_quality))}>
                          {decideWinner(humanResults.evidence_quality, aiResults.evidence_quality)}
                        </Badge>
                      </td>
                    </tr>

                    {/* Responsiveness */}
                    <tr className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span>Responsiveness</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={decideWinner(humanResults.responsiveness, aiResults.responsiveness) === "Human" ? "font-semibold text-primary" : ""}>
                          {fmtOutOf10(humanResults.responsiveness)}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={decideWinner(humanResults.responsiveness, aiResults.responsiveness) === "AI" ? "font-semibold text-accent" : ""}>
                          {fmtOutOf10(aiResults.responsiveness)}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <Badge variant={getWinnerBadge(decideWinner(humanResults.responsiveness, aiResults.responsiveness))} className={getWinnerColor(decideWinner(humanResults.responsiveness, aiResults.responsiveness))}>
                          {decideWinner(humanResults.responsiveness, aiResults.responsiveness)}
                        </Badge>
                      </td>
                    </tr>

                    {/* Persuasiveness */}
                    <tr className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span>Persuasiveness</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={decideWinner(humanResults.persuasiveness, aiResults.persuasiveness) === "Human" ? "font-semibold text-primary" : ""}>
                          {fmtOutOf10(humanResults.persuasiveness)}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={decideWinner(humanResults.persuasiveness, aiResults.persuasiveness) === "AI" ? "font-semibold text-accent" : ""}>
                          {fmtOutOf10(aiResults.persuasiveness)}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <Badge variant={getWinnerBadge(decideWinner(humanResults.persuasiveness, aiResults.persuasiveness))} className={getWinnerColor(decideWinner(humanResults.persuasiveness, aiResults.persuasiveness))}>
                          {decideWinner(humanResults.persuasiveness, aiResults.persuasiveness)}
                        </Badge>
                      </td>
                    </tr>

                    {/* Clarity */}
                    <tr className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span>Clarity</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={decideWinner(humanResults.clarity, aiResults.clarity) === "Human" ? "font-semibold text-primary" : ""}>
                          {fmtOutOf10(humanResults.clarity)}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={decideWinner(humanResults.clarity, aiResults.clarity) === "AI" ? "font-semibold text-accent" : ""}>
                          {fmtOutOf10(aiResults.clarity)}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <Badge variant={getWinnerBadge(decideWinner(humanResults.clarity, aiResults.clarity))} className={getWinnerColor(decideWinner(humanResults.clarity, aiResults.clarity))}>
                          {decideWinner(humanResults.clarity, aiResults.clarity)}
                        </Badge>
                      </td>
                    </tr>

                    {/* Overall */}
                    <tr className={`border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors bg-accent/5 font-semibold`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="text-base">Overall Score</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={decideWinner(humanResults.overall, aiResults.overall) === "Human" ? "font-semibold text-primary" : ""}>
                          {fmtOutOf10(humanResults.overall)}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={decideWinner(humanResults.overall, aiResults.overall) === "AI" ? "font-semibold text-accent" : ""}>
                          {fmtOutOf10(aiResults.overall)}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <Badge variant={getWinnerBadge(decideWinner(humanResults.overall, aiResults.overall))} className={getWinnerColor(decideWinner(humanResults.overall, aiResults.overall))}>
                          {decideWinner(humanResults.overall, aiResults.overall)}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* AI Feedback Section */}
            <div className="space-y-6">
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
          </section>

          {/* Action Button */}
          <div className="flex items-center justify-center">
            <Link href="/">
              <Button size="lg">
                <Trophy className="w-4 h-4 mr-2" />
                Start Your Own Debate
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
} 
