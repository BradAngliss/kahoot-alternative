import { useState } from 'react'
import { choiceColor } from '../colors'
import { choicesInPosition, shuffled } from '../json'
import { HostViewProps } from '../types'

export default function HostView({ question, isAnswerRevealed }: HostViewProps) {
  // Shuffled so the room can't read the answer off the host screen
  const [shuffledChoices] = useState(() => shuffled(choicesInPosition(question)))
  const choices = isAnswerRevealed ? choicesInPosition(question) : shuffledChoices

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-3">
      {choices.map((choice, index) => (
        <div
          key={choice.id}
          className={`choice animate-pop-in text-2xl ${
            isAnswerRevealed ? 'bg-choice-green' : choiceColor(index)
          }`}
        >
          {isAnswerRevealed && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-white text-base font-extrabold">
              {index + 1}
            </span>
          )}
          <span>{choice.body}</span>
        </div>
      ))}
    </div>
  )
}
