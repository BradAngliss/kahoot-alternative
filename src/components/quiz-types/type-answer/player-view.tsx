import { FormEvent, useState } from 'react'
import { PlayerViewProps } from '../types'
import { useAutoSubmit } from '../use-auto-submit'

export default function PlayerView({ onAnswer, isTimeUp }: PlayerViewProps) {
  const [text, setText] = useState('')

  // When time runs out, whatever is typed is sent, even if it's blank
  useAutoSubmit(isTimeUp, () => onAnswer({ text }))

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (text.trim()) onAnswer({ text })
  }

  return (
    <form onSubmit={onSubmit} className="card animate-pop-in p-4">
      <input
        className="input text-xl"
        type="text"
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        placeholder="Your answer"
        aria-label="Your answer"
        maxLength={100}
        autoFocus
        autoComplete="off"
      />
      <button disabled={!text.trim()} className="btn btn-accent mt-3 w-full">
        Submit
      </button>
    </form>
  )
}
