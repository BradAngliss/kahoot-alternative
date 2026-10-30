import PlayerName from '@/components/player-name'
import { useRef, useState } from 'react'
import useIsomorphicLayoutEffect from 'react-use/lib/useIsomorphicLayoutEffect'

/** Largest first. The list uses the largest that fits everyone in the box. */
const SIZES = [
  'px-4 py-2 text-xl',
  'px-3 py-1.5 text-base',
  'px-2 py-1 text-sm',
  'px-1.5 py-0.5 text-xs',
  'px-1 text-[0.625rem]',
]

/** Players' names in a box that fills its space and never scrolls */
export default function PlayerNames({
  players,
  emptyText,
  label,
}: {
  players: { id: string; nickname: string; joinIndex: number }[]
  /** Shown until there are names to list */
  emptyText: string
  label: string
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [sizeIndex, setSizeIndex] = useState(0)
  const [resizeCount, setResizeCount] = useState(0)

  // Step down a size each render until the names fit
  useIsomorphicLayoutEffect(() => {
    const box = boxRef.current
    if (box && box.scrollHeight > box.clientHeight && sizeIndex < SIZES.length - 1) {
      setSizeIndex(sizeIndex + 1)
    }
  }, [players.length, sizeIndex, resizeCount])

  // Start again from the largest when the box changes size. The count makes
  // this measure again even when the names are already at the largest size.
  useIsomorphicLayoutEffect(() => {
    if (!boxRef.current) return
    const sizeObserver = new ResizeObserver(() => {
      setSizeIndex(0)
      setResizeCount((count) => count + 1)
    })
    sizeObserver.observe(boxRef.current)
    return () => sizeObserver.disconnect()
  }, [])

  return (
    <div
      ref={boxRef}
      aria-label={label}
      className="flex h-full min-h-0 flex-wrap content-start gap-1.5 overflow-hidden rounded-2xl border-2 border-white/20 bg-white/5 p-2"
    >
      {players.length === 0 && (
        <p className="m-auto text-lg text-white/60">{emptyText}</p>
      )}
      {players.map((player) => (
        <PlayerName
          key={player.id}
          nickname={player.nickname}
          joinIndex={player.joinIndex}
          sizeClassName={SIZES[sizeIndex]}
        />
      ))}
    </div>
  )
}
