import { answerValue, sliderSettings } from '../json'
import { RevealViewProps } from '../types'
import { formatValue } from './format'

export default function RevealView({ question, answers }: RevealViewProps) {
  const settings = sliderSettings(question)
  const guesses = answers
    .map(answerValue)
    .filter((value): value is number => value !== null)

  if (guesses.length === 0) {
    return <div className="text-2xl text-center">No answers</div>
  }

  const average = guesses.reduce((sum, value) => sum + value, 0) / guesses.length
  const exact = guesses.filter((value) => value === settings.answer).length
  const range = settings.max - settings.min || 1

  return (
    <div className="max-w-2xl mx-auto">
      {/* Each guess as a dot along the range, with the answer marked */}
      <div className="relative h-12 my-4 bg-slate-700 rounded">
        {guesses.map((value, index) => (
          <div
            key={index}
            className="absolute top-3 w-6 h-6 -ml-3 rounded-full bg-yellow-500 opacity-80"
            style={{ left: `${((value - settings.min) * 100) / range}%` }}
          ></div>
        ))}
        <div
          className="absolute -top-1 -bottom-1 w-1 -ml-0.5 bg-green-500"
          style={{ left: `${((settings.answer - settings.min) * 100) / range}%` }}
        ></div>
      </div>
      <div className="flex justify-around text-center">
        <div>
          <div className="text-4xl">{formatValue(Math.round(average * 10) / 10, settings)}</div>
          <div className="text-xl">Average guess</div>
        </div>
        <div>
          <div className="text-4xl">{exact}</div>
          <div className="text-xl">Exactly right</div>
        </div>
      </div>
    </div>
  )
}
