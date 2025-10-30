"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface DebateConfigModalProps {
  topic: {
    id: number
    title: string
    description: string
    category: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DebateConfigModal({ topic, open, onOpenChange }: DebateConfigModalProps) {
  const router = useRouter()
  const [side, setSide] = useState<"For" | "Against">("For")
  const [difficulty, setDifficulty] = useState("Intermediate")
  const [argumentStructure, setArgumentStructure] = useState("claim-warrant-impact")
  const [rounds, setRounds] = useState("5")
  const [timed, setTimed] = useState(false)
  const [roundDuration, setRoundDuration] = useState("5")
  const [firstSpeaker, setFirstSpeaker] = useState<"ai" | "user">("ai")

  const handleStartDebate = () => {
    const params = new URLSearchParams({
      topic: topic.title,
      side,
      difficulty,
      structure: argumentStructure,
      rounds,
      timed: timed.toString(),
      duration: roundDuration,
      firstSpeaker,
    })
    router.push(`/debate?${params.toString()}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2 text-balance">{topic.title}</DialogTitle>
              <DialogDescription className="text-base text-pretty">{topic.description}</DialogDescription>
            </div>
            <Badge variant="secondary">{topic.category}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Side Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Choose Your Position</Label>
            <RadioGroup value={side} onValueChange={(value) => setSide(value as "For" | "Against")}>
              <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="For" id="For" />
                <Label htmlFor="For" className="flex-1 cursor-pointer font-medium">
                  For (Supporting)
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="Against" id="Against" />
                <Label htmlFor="Against" className="flex-1 cursor-pointer font-medium">
                  Against (Opposing)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-3">
            <Label htmlFor="difficulty" className="text-base font-semibold">
              Difficulty Level
            </Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner - Basic arguments and simple rebuttals</SelectItem>
                <SelectItem value="Intermediate">Intermediate - Moderate complexity and evidence</SelectItem>
                <SelectItem value="Expert">Expert - Advanced rhetoric and deep analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Argument Structure */}
          <div className="space-y-3">
            <Label htmlFor="structure" className="text-base font-semibold">
              Argument Structure
            </Label>
            <Select value={argumentStructure} onValueChange={setArgumentStructure}>
              <SelectTrigger id="structure">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claim-warrant-impact">Claim-Warrant-Impact (CWI)</SelectItem>
                <SelectItem value="claim-reason-support-impact">Claim-Reason-Support-Impact (CRSI)</SelectItem>
                <SelectItem value="toulmin-model">Toulmin Model (Claim-Data-Warrant-Backing)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Number of Rounds */}
          <div className="space-y-3">
            <Label htmlFor="rounds" className="text-base font-semibold">
              Number of Rounds
            </Label>
            <Select value={rounds} onValueChange={setRounds}>
              <SelectTrigger id="rounds">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Rounds
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Who Goes First? */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Who Goes First?</Label>
            <RadioGroup value={firstSpeaker} onValueChange={(value) => setFirstSpeaker(value as "ai" | "user")}>
              <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="ai" id="ai-first" />
                <Label htmlFor="ai-first" className="flex-1 cursor-pointer font-medium">
                  AI Opponent - Let the AI present their opening argument first
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="user" id="user-first" />
                <Label htmlFor="user-first" className="flex-1 cursor-pointer font-medium">
                  You - Present your opening argument first
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Timed Rounds */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="space-y-0.5">
              <Label htmlFor="timed" className="text-base font-semibold cursor-pointer">
                Timed Rounds
              </Label>
              <p className="text-sm text-muted-foreground">Set a time limit for each response</p>
            </div>
            <Switch id="timed" checked={timed} onCheckedChange={setTimed} />
          </div>

          {timed && (
            <div className="space-y-3">
              <Label htmlFor="duration" className="text-base font-semibold">
                Round Duration
              </Label>
              <Select value={roundDuration} onValueChange={setRoundDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="2">2 minutes</SelectItem>
                  <SelectItem value="3">3 minutes</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleStartDebate} className="flex-1">
            Start Debate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
