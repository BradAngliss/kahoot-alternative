import { choiceColor } from '../colors'
import { RevealViewProps } from '../types'

export default function RevealView({ question, answers }: RevealViewProps) {
  return (
    <div className="flex justify-center">
      {question.choices.map((choice, index) => {
        const choiceAnswerCount = answers.filter(
          (answer) => answer.choice_id === choice.id
        ).length

        return (
          <div
            key={choice.id}
            className="mx-2 h-48 w-24 flex flex-col items-stretch justify-end"
          >
            <div className="flex-grow relative">
              <div
                style={{
                  height: `${(choiceAnswerCount * 100) / (answers.length || 1)}%`,
                }}
                className={`absolute bottom-0 left-0 right-0 mb-1 rounded-t ${choiceColor(
                  index
                )}`}
              ></div>
            </div>
            <div
              className={`mt-1 text-white text-lg text-center py-2 rounded-b ${choiceColor(
                index
              )}`}
            >
              {choiceAnswerCount}
            </div>
          </div>
        )
      })}
    </div>
  )
}
