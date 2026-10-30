import { answerValue, sliderSettings } from '../json'
import { RevealViewProps } from '../types'
import { formatValue } from './format'

export default function RevealView({ question, answers }: RevealViewProps) {
  const settings = sliderSettings(question)
  const guesses = answers
    .map(answerValue)
    .filter((value): value is number => value !== null)

  if (guesses.length === 0) {
    return (
      <p className="text-center font-display text-2xl font-bold text-white/80">
        No answers
      </p>
    )
  }

  const average = guesses.reduce((sum, value) => sum + value, 0) / guesses.length
  const exact = guesses.filter((value) => value === settings.answer).length
  const range = settings.max - settings.min || 1

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Each guess as a dot along the range, with the answer marked */}
      <div className="relative my-6 h-14 rounded-2xl border-2 border-ink bg-white">
        {guesses.map((value, index) => (
          <div
            key={index}
            className="absolute top-3.5 -ml-3 h-6 w-6 rounded-full border-2 border-ink bg-choice-yellow"
            style={{ left: `${((value - settings.min) * 100) / range}%` }}
          ></div>
        ))}
        <div
          className="absolute -bottom-2 -top-2 -ml-1 w-2 rounded-full border-2 border-ink bg-choice-green"
          style={{ left: `${((settings.answer - settings.min) * 100) / range}%` }}
        ></div>
      </div>
      <div className="flex justify-center gap-6 text-center">
        <div className="card px-6 py-3">
          <div className="font-display text-4xl font-extrabold tabular-nums">
            {formatValue(Math.round(average * 10) / 10, settings)}
          </div>
          <div className="text-sm font-semibold text-ink/60">Average guess</div>
        </div>
        <div className="card px-6 py-3">
          <div className="font-display text-4xl font-extrabold tabular-nums">{exact}</div>
          <div className="text-sm font-semibold text-ink/60">Exactly right</div>
        </div>
      </div>
    </div>
  )
}
