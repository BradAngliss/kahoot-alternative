import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { choiceColor } from '../colors'
import { choicesInPosition, shuffled } from '../json'
import { PlayerViewProps } from '../types'
import { useAutoSubmit } from '../use-auto-submit'
import { Choice } from '@/types/types'

export default function PlayerView({ question, onAnswer, isTimeUp }: PlayerViewProps) {
  const [choices, setChoices] = useState(() => shuffled(choicesInPosition(question)))

  // Sent even if nothing was moved
  const submit = () => onAnswer({ choice_ids: choices.map((choice) => choice.id) })
  useAutoSubmit(isTimeUp, submit)

  // Each item keeps its starting colour as it moves, so it's easy to follow
  const [colorIndexes] = useState(
    () => new Map(choices.map((choice, index) => [choice.id, index]))
  )

  const sensors = useSensors(
    // A short move before dragging starts, so a tap doesn't pick an item up
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Space to pick up, arrow keys to move, space to drop
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    setChoices((current) =>
      arrayMove(
        current,
        current.findIndex((choice) => choice.id === active.id),
        current.findIndex((choice) => choice.id === over.id)
      )
    )
  }

  return (
    <div>
      <p className="pb-3 text-center font-semibold text-white/80">
        Drag these into order, first at the top
      </p>
      <DndContext
        id={`ordering-${question.id}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={choices} strategy={verticalListSortingStrategy}>
          {choices.map((choice, index) => (
            <SortableItem
              key={choice.id}
              choice={choice}
              position={index + 1}
              colorIndex={colorIndexes.get(choice.id) ?? index}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button onClick={submit} className="btn btn-primary mt-4 w-full">
        Submit
      </button>
    </div>
  )
}

function SortableItem({
  choice,
  position,
  colorIndex,
}: {
  choice: Choice
  position: number
  colorIndex: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: choice.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      // touch-none stops the page scrolling while dragging on a phone
      className={`choice my-2 touch-none select-none ${choiceColor(colorIndex)} ${
        isDragging
          ? 'relative z-10 cursor-grabbing scale-[1.02] shadow-chunky-lg ring-4 ring-white'
          : 'cursor-grab'
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-white text-base font-extrabold">
        {position}
      </span>
      <span className="flex-grow">{choice.body}</span>
      <span className="text-2xl text-ink/60" aria-hidden="true">
        ⠿
      </span>
    </div>
  )
}
