import { CorrectIcon } from '../icons'
import { sliderSettings } from '../json'
import { HostViewProps } from '../types'
import { formatValue } from './format'

export default function HostView({ question, isAnswerRevealed }: HostViewProps) {
  const settings = sliderSettings(question)

  return (
    <div className="p-4">
      {!isAnswerRevealed && (
        <div className="px-4 py-6 w-full text-2xl rounded font-bold text-white flex justify-between bg-blue-500">
          <div>{formatValue(settings.min, settings)}</div>
          <div>Pick a number on your device</div>
          <div>{formatValue(settings.max, settings)}</div>
        </div>
      )}
      {isAnswerRevealed && (
        <div className="px-4 py-6 w-full text-2xl rounded font-bold text-white flex justify-between bg-green-500">
          <div>{formatValue(settings.answer, settings)}</div>
          <CorrectIcon />
        </div>
      )}
    </div>
  )
}
