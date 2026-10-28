import ChoiceLetter from '../choice-letter'
import { choiceColor } from '../colors'
import { PlayerViewProps } from '../types'

export default function PlayerView({ question, onAnswer }: PlayerViewProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {question.choices.map((choice, index) => (
        <button
          key={choice.id}
          onClick={() => onAnswer({ choice_ids: [choice.id] })}
          className={`choice animate-pop-in hover:-translate-y-0.5 active:translate-y-1 active:shadow-none ${choiceColor(
            index
          )}`}
        >
          <ChoiceLetter index={index} />
          <span>{choice.body}</span>
        </button>
      ))}
    </div>
  )
}
