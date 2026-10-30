import { useState } from 'react'
import { sliderSettings } from '../json'
import { PlayerViewProps } from '../types'
import { useAutoSubmit } from '../use-auto-submit'
import { formatValue } from './format'

export default function PlayerView({ question, onAnswer, isTimeUp }: PlayerViewProps) {
  const settings = sliderSettings(question)
  const step = settings.step ?? 1

  // Start in the middle of the range, on a step
  const [value, setValue] = useState(
    settings.min + Math.round((settings.max - settings.min) / 2 / step) * step
  )

  // Sent even if the slider was never moved
  const submit = () => onAnswer({ value })
  useAutoSubmit(isTimeUp, submit)

  return (
    <div className="card animate-pop-in p-5">
      <div className="pb-4 text-center font-display text-6xl font-extrabold tabular-nums">
        {formatValue(value, settings)}
      </div>
      <input
        className="h-3 w-full cursor-pointer accent-stage"
        type="range"
        min={settings.min}
        max={settings.max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.currentTarget.value))}
        aria-label="Your answer"
      />
      <div className="flex justify-between pt-1 text-sm font-semibold text-ink/60">
        <span>{formatValue(settings.min, settings)}</span>
        <span>{formatValue(settings.max, settings)}</span>
      </div>
      <button onClick={submit} className="btn btn-accent mt-4 w-full">
        Submit
      </button>
    </div>
  )
}
