import { answerChoiceIds, choicesInPosition } from '../json'
import { RevealViewProps } from '../types'

export default function RevealView({ question, answers }: RevealViewProps) {
  const correctIds = choicesInPosition(question).map((choice) => choice.id)
  const orders = answers.map(answerChoiceIds)

  const fullyCorrect = orders.filter((ids) =>
    correctIds.every((id, index) => ids[index] === id)
  ).length

  // Share of players who put each item in its correct place
  const placedCorrectly = correctIds.map(
    (id, index) => orders.filter((ids) => ids[index] === id).length
  )

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div>
        <div className="font-display text-6xl font-extrabold tabular-nums">
          {fullyCorrect}/{answers.length}
        </div>
        <div className="text-xl font-semibold text-white/80">got the whole order right</div>
      </div>
      {answers.length > 0 && (
        <div className="flex justify-center gap-3">
          {placedCorrectly.map((count, index) => (
            <div key={correctIds[index]} className="card w-28 px-3 py-2">
              <div className="font-display text-2xl font-extrabold tabular-nums">
                {Math.round((count * 100) / answers.length)}%
              </div>
              <div className="text-sm font-semibold text-ink/60">placed #{index + 1}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
