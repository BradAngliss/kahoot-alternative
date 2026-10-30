import { choiceColor } from '@/components/quiz-types/colors'

/** A player's name on the host screens. Pops in when first shown. */
export default function PlayerName({
  nickname,
  joinIndex,
  sizeClassName,
}: {
  nickname: string
  /** Position in the list of players, so each player keeps the same colour */
  joinIndex: number
  /** Padding and text size */
  sizeClassName: string
}) {
  return (
    <div
      className={`max-w-full animate-pop-in break-words rounded-xl border-2 border-ink font-display font-bold text-ink shadow-chunky ${sizeClassName} ${choiceColor(
        joinIndex % 4
      )}`}
    >
      {nickname}
    </div>
  )
}
