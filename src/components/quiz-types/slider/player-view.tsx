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
    <div className="p-4">
      <div className="text-white text-5xl font-bold text-center pb-4">
        {formatValue(value, settings)}
      </div>
      <input
        className="w-full accent-yellow-500"
        type="range"
        min={settings.min}
        max={settings.max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.currentTarget.value))}
        aria-label="Your answer"
      />
      <div className="flex justify-between text-white pb-2">
        <div>{formatValue(settings.min, settings)}</div>
        <div>{formatValue(settings.max, settings)}</div>
      </div>
      <button
        onClick={submit}
        className="mt-2 w-full py-4 text-xl rounded font-bold bg-white text-black"
      >
        Submit
      </button>
    </div>
  )
}
