import { answerText, normalizeText, typeAnswerSettings } from '../json'
import { RevealViewProps } from '../types'

/** How many answers to list, most common first */
const MAX_ANSWERS_SHOWN = 6

export default function RevealView({ question, answers }: RevealViewProps) {
  const accepted = typeAnswerSettings(question).accepted_answers.map(normalizeText)

  // Group answers that only differ by case or spacing
  const counts = new Map<string, { text: string; count: number }>()
  for (const answer of answers) {
    const text = answerText(answer)
    // Blank answers sent when time ran out aren't worth listing
    if (text === null || !text.trim()) continue
    const key = normalizeText(text)
    const existing = counts.get(key)
    counts.set(key, { text: existing?.text ?? text.trim(), count: (existing?.count ?? 0) + 1 })
  }
  const topAnswers = Array.from(counts.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, MAX_ANSWERS_SHOWN)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      {topAnswers.length === 0 && (
        <p className="text-center font-display text-2xl font-bold text-white/80">
          No answers
        </p>
      )}
      {topAnswers.map(([key, { text, count }]) => (
        <div
          key={key}
          className={`flex animate-pop-in items-center justify-between rounded-xl border-2 border-ink px-4 py-2 font-display text-xl font-bold text-ink ${
            accepted.includes(key) ? 'bg-choice-green' : 'bg-white'
          }`}
        >
          <span>{text}</span>
          <span className="tabular-nums">{count}</span>
        </div>
      ))}
    </div>
  )
}
