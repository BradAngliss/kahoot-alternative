import { choiceColor } from '../colors'
import { CorrectIcon, IncorrectIcon } from '../icons'
import { HostViewProps } from '../types'

export default function HostView({ question, isAnswerRevealed }: HostViewProps) {
  return (
    <div className="flex justify-between flex-wrap p-4">
      {question.choices.map((choice, index) => (
        <div key={choice.id} className="w-1/2 p-1">
          <div
            className={`px-4 py-6 w-full text-2xl rounded font-bold text-white flex justify-between
            ${choiceColor(index)}
            ${isAnswerRevealed && !choice.is_correct ? 'opacity-60' : ''}
           `}
          >
            <div>{choice.body}</div>
            {isAnswerRevealed && (
              <div>
                {choice.is_correct && <CorrectIcon />}
                {!choice.is_correct && <IncorrectIcon />}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
