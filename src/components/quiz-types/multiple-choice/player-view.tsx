import { choiceColor } from '../colors'
import { PlayerViewProps } from '../types'

export default function PlayerView({ question, onAnswer }: PlayerViewProps) {
  return (
    <div className="flex justify-between flex-wrap p-4">
      {question.choices.map((choice, index) => (
        <div key={choice.id} className="w-1/2 p-1">
          <button
            onClick={() => onAnswer({ choice_ids: [choice.id] })}
            className={`px-4 py-6 w-full text-xl rounded text-white flex justify-between md:text-2xl md:font-bold
            ${choiceColor(index)}
           `}
          >
            <div>{choice.body}</div>
          </button>
        </div>
      ))}
    </div>
  )
}
