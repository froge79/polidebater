import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Target, Trophy, Zap } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />

      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">PoliDebater</h1>
              <p className="text-sm text-muted-foreground mt-1">AI-Powered Political Debate Platform</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold tracking-tight text-balance mb-6">Master the Art of Political Debate</h2>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto mb-12">
            Sharpen your argumentation skills with AI-powered debates. Choose your topic, select your stance, and engage
            in structured political discourse.
          </p>

          <Link href="/topics">
            <Button size="lg" className="group relative overflow-hidden">
              Start Debating
              <svg
                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Structured Arguments</h3>
              <p className="text-sm text-muted-foreground">
                Learn proven frameworks like Claim-Warrant-Impact and Toulmin Model
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Feedback</h3>
              <p className="text-sm text-muted-foreground">
                Get instant AI analysis on your arguments and debate performance
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Review detailed scorecards and improve your debate skills over time
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
