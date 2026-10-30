import { choiceColor } from '@/components/quiz-types/colors'

/** A player's name on the host screens. Pops in when first shown. */
export default function PlayerName({
  nickname,
  joinIndex,
}: {
  nickname: string
  /** Position in the list of players, so each player keeps the same colour */
  joinIndex: number
}) {
  return (
    <div
      className={`max-w-full animate-pop-in break-words rounded-xl border-2 border-ink px-4 py-2 font-display text-xl font-bold text-ink shadow-chunky ${choiceColor(
        joinIndex % 4
      )}`}
    >
      {nickname}
    </div>
  )
}
