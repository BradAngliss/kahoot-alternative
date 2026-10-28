import { useState } from 'react'
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
    <div className="p-4">
      <p className="text-white text-center pb-2">Pick all that apply</p>
      <div className="flex justify-between flex-wrap">
        {question.choices.map((choice, index) => {
          const isPicked = pickedIds.includes(choice.id)
          return (
            <div key={choice.id} className="w-1/2 p-1">
              <button
                onClick={() => toggle(choice.id)}
                aria-pressed={isPicked}
                className={`px-4 py-6 w-full text-xl rounded text-white flex justify-between md:text-2xl md:font-bold
                ${choiceColor(index)}
                ${isPicked ? 'ring-4 ring-white' : 'opacity-70'}
               `}
              >
                <div>{choice.body}</div>
                {isPicked && <CorrectIcon />}
              </button>
            </div>
          )
        })}
      </div>
      <button
        onClick={submit}
        disabled={pickedIds.length === 0}
        className="mt-2 w-full py-4 text-xl rounded font-bold bg-white text-black disabled:opacity-50"
      >
        Submit
      </button>
    </div>
  )
}
