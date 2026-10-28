import { CorrectIcon } from '../icons'
import { typeAnswerSettings } from '../json'
import { HostViewProps } from '../types'

export default function HostView({ question, isAnswerRevealed }: HostViewProps) {
  const { accepted_answers } = typeAnswerSettings(question)

  return (
    <div className="p-4">
      {!isAnswerRevealed && (
        <div className="px-4 py-6 w-full text-2xl rounded font-bold text-white text-center bg-blue-500">
          Type your answer on your device
        </div>
      )}
      {isAnswerRevealed && (
        <div className="px-4 py-6 w-full text-2xl rounded font-bold text-white flex justify-between bg-green-500">
          <div>{accepted_answers.join(' / ')}</div>
          <CorrectIcon />
        </div>
      )}
    </div>
  )
}
