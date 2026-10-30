import { CorrectIcon } from '../icons'
import { sliderSettings } from '../json'
import { HostViewProps } from '../types'
import { formatValue } from './format'

export default function HostView({ question, isAnswerRevealed }: HostViewProps) {
  const settings = sliderSettings(question)

  if (!isAnswerRevealed) {
    return (
      <div className="choice animate-pop-in flex-grow justify-between bg-choice-blue py-6 text-2xl">
        <span className="tabular-nums">{formatValue(settings.min, settings)}</span>
        <span>Pick a number on your phone</span>
        <span className="tabular-nums">{formatValue(settings.max, settings)}</span>
      </div>
    )
  }

  return (
    <div className="choice animate-pop-in flex-grow bg-choice-green py-6 text-3xl">
      <span className="flex-grow tabular-nums">{formatValue(settings.answer, settings)}</span>
      <CorrectIcon />
    </div>
  )
}
