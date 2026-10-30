import { choiceColor } from '../colors'
import { PlayerViewProps } from '../types'

export default function PlayerView({ question, onAnswer }: PlayerViewProps) {
  return (
    <div className="grid flex-grow grid-cols-2 gap-3">
      {question.choices.map((choice, index) => (
        <button
          key={choice.id}
          onClick={() => onAnswer({ choice_ids: [choice.id] })}
          className={`choice animate-pop-in justify-center py-16 text-3xl hover:-translate-y-0.5 active:translate-y-1 active:shadow-none ${choiceColor(
            index
          )}`}
        >
          {choice.body}
        </button>
      ))}
    </div>
  )
}
