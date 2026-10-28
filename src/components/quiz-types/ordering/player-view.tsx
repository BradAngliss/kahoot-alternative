import { useState } from 'react'
import { choiceColor } from '../colors'
import { choicesInPosition, shuffled } from '../json'
import { PlayerViewProps } from '../types'

export default function PlayerView({ question, onAnswer }: PlayerViewProps) {
  const [choices, setChoices] = useState(() => shuffled(choicesInPosition(question)))

  const move = (from: number, to: number) =>
    setChoices((current) => {
      const next = [...current]
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })

  return (
    <div className="p-4">
      <p className="text-white text-center pb-2">Put these in order, first at the top</p>
      {choices.map((choice, index) => (
        <div
          key={choice.id}
          className={`flex items-center my-1 rounded text-white ${choiceColor(index)}`}
        >
          <div className="px-4 text-xl font-bold">{index + 1}</div>
          <div className="flex-grow py-3 text-xl md:text-2xl">{choice.body}</div>
          <button
            onClick={() => move(index, index - 1)}
            disabled={index === 0}
            aria-label={`Move ${choice.body} up`}
            className="px-4 py-3 text-2xl disabled:opacity-30"
          >
            ↑
          </button>
          <button
            onClick={() => move(index, index + 1)}
            disabled={index === choices.length - 1}
            aria-label={`Move ${choice.body} down`}
            className="px-4 py-3 text-2xl disabled:opacity-30"
          >
            ↓
          </button>
        </div>
      ))}
      <button
        onClick={() => onAnswer({ choice_ids: choices.map((choice) => choice.id) })}
        className="mt-2 w-full py-4 text-xl rounded font-bold bg-white text-black"
      >
        Submit
      </button>
    </div>
  )
}
