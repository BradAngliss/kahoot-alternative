import { useState } from 'react'
import { choiceColor } from '../colors'
import { choicesInPosition, shuffled } from '../json'
import { HostViewProps } from '../types'

export default function HostView({ question, isAnswerRevealed }: HostViewProps) {
  // Shuffled so the room can't read the answer off the host screen
  const [shuffledChoices] = useState(() => shuffled(choicesInPosition(question)))
  const choices = isAnswerRevealed ? choicesInPosition(question) : shuffledChoices

  return (
    <div className="p-4 max-w-2xl w-full mx-auto">
      {choices.map((choice, index) => (
        <div
          key={choice.id}
          className={`px-4 py-3 my-1 w-full text-2xl rounded font-bold text-white flex ${
            isAnswerRevealed ? 'bg-green-500' : choiceColor(index)
          }`}
        >
          {isAnswerRevealed && <div className="pr-4">{index + 1}</div>}
          <div>{choice.body}</div>
        </div>
      ))}
    </div>
  )
}
