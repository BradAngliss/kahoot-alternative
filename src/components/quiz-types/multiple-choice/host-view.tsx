import ChoiceLetter from '../choice-letter'
import { choiceColor } from '../colors'
import { CorrectIcon, IncorrectIcon } from '../icons'
import { HostViewProps } from '../types'

export default function HostView({
  question,
  isAnswerRevealed,
  markCorrect = true,
}: HostViewProps & {
  /** Show which choices were right once the answer is revealed. Off for polls. */
  markCorrect?: boolean
}) {
  const showResult = isAnswerRevealed && markCorrect

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {question.choices.map((choice, index) => (
        <div
          key={choice.id}
          className={`choice animate-pop-in py-5 text-2xl md:text-3xl ${
            // Wrong answers fade to white so the right one stands out
            showResult && !choice.is_correct
              ? 'border-ink/30 bg-white/50 text-ink/50 shadow-none'
              : choiceColor(index)
          }`}
        >
          <ChoiceLetter index={index} />
          <span className="flex-grow">{choice.body}</span>
          {showResult && (choice.is_correct ? <CorrectIcon /> : <IncorrectIcon />)}
        </div>
      ))}
    </div>
  )
}
