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
    if (text === null) continue
    const key = normalizeText(text)
    const existing = counts.get(key)
    counts.set(key, { text: existing?.text ?? text.trim(), count: (existing?.count ?? 0) + 1 })
  }
  const topAnswers = Array.from(counts.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, MAX_ANSWERS_SHOWN)

  return (
    <div className="flex flex-col items-center">
      {topAnswers.length === 0 && <div className="text-2xl">No answers</div>}
      {topAnswers.map(([key, { text, count }]) => (
        <div
          key={key}
          className={`flex justify-between w-full max-w-xl my-1 px-4 py-2 rounded text-xl ${
            accepted.includes(key) ? 'bg-green-500' : 'bg-slate-700'
          }`}
        >
          <div>{text}</div>
          <div className="font-bold">{count}</div>
        </div>
      ))}
    </div>
  )
}
