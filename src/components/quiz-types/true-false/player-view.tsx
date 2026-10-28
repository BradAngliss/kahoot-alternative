import { choiceColor } from '../colors'
import { PlayerViewProps } from '../types'

export default function PlayerView({ question, onAnswer }: PlayerViewProps) {
  return (
    <div className="flex p-4">
      {question.choices.map((choice, index) => (
        <div key={choice.id} className="w-1/2 p-1">
          <button
            onClick={() => onAnswer({ choice_ids: [choice.id] })}
            className={`px-4 py-16 w-full text-2xl rounded font-bold text-white md:text-3xl ${choiceColor(
              index
            )}`}
          >
            {choice.body}
          </button>
        </div>
      ))}
    </div>
  )
}
