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
    <div className="text-center">
      <div className="text-6xl pb-2">
        {fullyCorrect}/{answers.length}
      </div>
      <div className="text-3xl pb-4">Got the whole order right</div>
      {answers.length > 0 && (
        <div className="flex justify-center">
          {placedCorrectly.map((count, index) => (
            <div key={correctIds[index]} className="mx-2 w-24">
              <div className="text-2xl">{Math.round((count * 100) / answers.length)}%</div>
              <div className="text-lg">placed #{index + 1}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
