import { DebateTopics } from "@/components/debate-topics"
import { ThemeToggle } from "@/components/theme-toggle"

export default function TopicsPage() {
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

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight text-balance mb-4">Choose Your Debate Topic</h2>
            <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
              Select a political topic below to begin your AI-powered debate. Configure your preferences and sharpen
              your argumentation skills.
            </p>
          </div>

          <DebateTopics />
        </div>
      </main>
    </div>
  )
}
