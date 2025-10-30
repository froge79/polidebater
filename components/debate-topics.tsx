"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DebateConfigModal } from "@/components/debate-config-modal"
import { useDebateStore } from "@/lib/debatestore";

const topics = [
  {
    id: 1,
    title: "Universal Healthcare",
    description: "Should the government provide universal healthcare to all citizens?",
    category: "Healthcare",
  },
  {
    id: 2,
    title: "Climate Change Policy",
    description: "Should governments implement aggressive climate change regulations?",
    category: "Environment",
  },
  {
    id: 3,
    title: "Immigration Reform",
    description: "Should immigration policies be more restrictive or more open?",
    category: "Immigration",
  },
  {
    id: 4,
    title: "Gun Control",
    description: "Should there be stricter regulations on firearm ownership?",
    category: "Rights",
  },
  {
    id: 5,
    title: "Education Funding",
    description: "Should higher education be publicly funded and tuition-free?",
    category: "Education",
  },
  {
    id: 6,
    title: "Minimum Wage",
    description: "Should the minimum wage be significantly increased?",
    category: "Economy",
  },
  {
    id: 7,
    title: "Tax Policy",
    description: "Should wealthy individuals and corporations pay higher taxes?",
    category: "Economy",
  },
  {
    id: 8,
    title: "Criminal Justice Reform",
    description: "Should the criminal justice system focus more on rehabilitation than punishment?",
    category: "Justice",
  },
  {
    id: 9,
    title: "Social Media Regulation",
    description: "Should governments regulate social media platforms more strictly?",
    category: "Technology",
  },
  {
    id: 10,
    title: "Voting Rights",
    description: "Should voting be made more accessible through expanded early voting and mail-in ballots?",
    category: "Democracy",
  },
  {
    id: 11,
    title: "Artificial Intelligence",
    description: "Should AI development be regulated by government oversight?",
    category: "Technology",
  },
  {
    id: 12,
    title: "Foreign Policy",
    description: "Should the country adopt a more interventionist or isolationist foreign policy?",
    category: "Foreign Affairs",
  },
]

export function DebateTopics() {
  const [selectedTopic, setSelectedTopic] = useState<(typeof topics)[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleTopicClick = (topic: (typeof topics)[0]) => {
    setSelectedTopic(topic)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => (
          <Card
            key={topic.id}
            className="p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 group"
            onClick={() => handleTopicClick(topic)}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors text-balance">
                  {topic.title}
                </h3>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {topic.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{topic.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {selectedTopic && <DebateConfigModal topic={selectedTopic} open={isModalOpen} onOpenChange={setIsModalOpen} />}
    </>
  )
}
