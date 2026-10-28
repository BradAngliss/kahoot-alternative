import { FormEvent, useState } from 'react'
import { PlayerViewProps } from '../types'

export default function PlayerView({ onAnswer }: PlayerViewProps) {
  const [text, setText] = useState('')

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (text.trim()) onAnswer({ text })
  }

  return (
    <form onSubmit={onSubmit} className="p-4">
      <input
        className="p-4 w-full text-xl rounded text-black"
        type="text"
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        placeholder="Your answer"
        maxLength={100}
        autoFocus
        autoComplete="off"
      />
      <button
        disabled={!text.trim()}
        className="mt-2 w-full py-4 text-xl rounded font-bold bg-white text-black disabled:opacity-50"
      >
        Submit
      </button>
    </form>
  )
}
