import { choiceColor, choiceLetter } from '../colors'
import { answerChoiceIds } from '../json'
import { RevealViewProps } from '../types'

export default function RevealView({ question, answers }: RevealViewProps) {
  return (
    <div className="flex h-full items-end justify-center gap-4">
      {question.choices.map((choice, index) => {
        const choiceAnswerCount = answers.filter((answer) =>
          answerChoiceIds(answer).includes(choice.id)
        ).length

        return (
          <div key={choice.id} className="flex h-full w-24 flex-col items-center">
            {/* Bar height is the share of answers that picked this choice, with the count on top */}
            <div className="flex min-h-[11rem] w-full flex-grow flex-col items-center justify-end">
              <span className="pb-1 font-display text-2xl font-extrabold tabular-nums">
                {choiceAnswerCount}
              </span>
              <div
                style={{
                  height: `${(choiceAnswerCount * 100) / (answers.length || 1)}%`,
                }}
                className={`min-h-[6px] w-full rounded-t-xl border-2 border-b-0 border-ink transition-all duration-500 ${choiceColor(
                  index
                )}`}
              ></div>
            </div>
            <div className="w-full rounded-b-xl border-2 border-ink bg-white py-1 text-center font-display text-lg font-extrabold text-ink">
              {choiceLetter(index)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
