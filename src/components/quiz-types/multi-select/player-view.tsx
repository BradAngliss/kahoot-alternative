import { useState } from 'react'
import ChoiceLetter from '../choice-letter'
import { choiceColor } from '../colors'
import { CorrectIcon } from '../icons'
import { PlayerViewProps } from '../types'
import { useAutoSubmit } from '../use-auto-submit'

export default function PlayerView({ question, onAnswer, isTimeUp }: PlayerViewProps) {
  const [pickedIds, setPickedIds] = useState<string[]>([])

  // Nothing ticked means nothing to send
  const submit = () => {
    if (pickedIds.length > 0) onAnswer({ choice_ids: pickedIds })
  }
  useAutoSubmit(isTimeUp, submit)

  const toggle = (choiceId: string) =>
    setPickedIds((ids) =>
      ids.includes(choiceId)
        ? ids.filter((id) => id !== choiceId)
        : [...ids, choiceId]
    )

  return (
    <div className="flex flex-grow flex-col">
      <p className="pb-3 text-center font-semibold text-white/80">Pick all that apply</p>
      <div className="grid flex-grow auto-rows-fr gap-3 md:grid-cols-2">
        {question.choices.map((choice, index) => {
          const isPicked = pickedIds.includes(choice.id)
          return (
            <button
              key={choice.id}
              onClick={() => toggle(choice.id)}
              aria-pressed={isPicked}
              className={`choice animate-pop-in ${choiceColor(index)} ${
                isPicked
                  ? 'translate-y-1 shadow-none ring-4 ring-white'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              <ChoiceLetter index={index} />
              <span className="flex-grow">{choice.body}</span>
              {isPicked && <CorrectIcon />}
            </button>
          )
        })}
      </div>
      <button
        onClick={submit}
        disabled={pickedIds.length === 0}
        className="btn btn-primary mt-4 w-full"
      >
        Submit
      </button>
    </div>
  )
}
