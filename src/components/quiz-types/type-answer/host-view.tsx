import { CorrectIcon } from '../icons'
import { typeAnswerSettings } from '../json'
import { HostViewProps } from '../types'

export default function HostView({ question, isAnswerRevealed }: HostViewProps) {
  const { accepted_answers } = typeAnswerSettings(question)

  if (!isAnswerRevealed) {
    return (
      <div className="choice animate-pop-in justify-center bg-choice-blue py-6 text-2xl">
        Type your answer on your phone
      </div>
    )
  }

  return (
    <div className="choice animate-pop-in bg-choice-green py-6 text-3xl">
      <span className="flex-grow">{accepted_answers.join(' / ')}</span>
      <CorrectIcon />
    </div>
  )
}
