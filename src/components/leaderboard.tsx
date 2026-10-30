import { GameResult, supabase } from '@/types/types'
import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'

/** The final standings, shown to the host and to every player when the game ends */
export default function Leaderboard({
  gameId,
  title,
  participantId,
}: {
  gameId: string
  title: string
  /** The player looking at this, so their place can be picked out */
  participantId?: string
}) {
  const [gameResults, setGameResults] = useState<GameResult[]>([])

  const { width, height } = useWindowSize()

  useEffect(() => {
    const getResults = async () => {
      const { data, error } = await supabase
        .from('game_results')
        .select()
        .eq('game_id', gameId)
        .order('total_score', { ascending: false })
      if (error) {
        return alert(error.message)
      }

      setGameResults(data)
    }
    getResults()
  }, [gameId])

  const podium = gameResults.slice(0, 3)
  const rest = gameResults.slice(3)

  const myIndex = gameResults.findIndex(
    (result) => result.participant_id === participantId
  )

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center gap-8 px-4 py-8 sm:px-6">
      <div className="text-center">
        <p className="pill">Final results</p>
        <h1 className="break-words pt-3 font-display text-4xl font-extrabold md:text-5xl">
          {title}
        </h1>
        {myIndex >= 0 && (
          <p className="pt-2 font-display text-xl font-bold text-choice-yellow">
            You came #{myIndex + 1} with {gameResults[myIndex].total_score ?? 0} pts
          </p>
        )}
      </div>

      {/* Second, first and third, with first in the middle and tallest */}
      <div className="flex w-full items-end justify-center gap-4">
        {[1, 0, 2].map((place) => {
          const result = podium[place]
          if (!result) return null
          return (
            <div
              key={result.participant_id}
              className="flex w-1/3 max-w-[220px] animate-pop-in flex-col items-center"
            >
              <p className="break-all pb-2 text-center font-display text-2xl font-extrabold">
                {result.nickname}
              </p>
              {place === myIndex && <YouBadge className="mb-2" />}
              <p className="pb-3 font-semibold text-white/80 tabular-nums">
                {result.total_score} pts
              </p>
              <div
                className={`flex w-full items-start justify-center rounded-t-2xl border-2 border-b-0 border-ink pt-4 font-display text-5xl font-extrabold text-ink ${
                  PODIUM_STYLES[place]
                }`}
              >
                {place + 1}
              </div>
            </div>
          )
        })}
      </div>

      {rest.length > 0 && (
        <div className="card w-full max-w-2xl divide-y-2 divide-ink/10">
          {rest.map((gameResult, index) => (
            <div
              key={gameResult.participant_id}
              className={`flex items-center gap-4 px-5 py-3 ${
                index + 3 === myIndex ? 'bg-choice-yellow/40' : ''
              }`}
            >
              <span className="w-8 font-display text-xl font-extrabold text-ink/50">
                {index + 4}
              </span>
              <span className="min-w-0 flex-grow break-words font-display text-xl font-bold">
                {gameResult.nickname}
              </span>
              {index + 3 === myIndex && <YouBadge />}
              <span className="font-semibold tabular-nums">{gameResult.total_score} pts</span>
            </div>
          ))}
        </div>
      )}
      {/* Fixed so it stays in view when scrolling down the list */}
      <Confetti
        width={width}
        height={height}
        recycle={true}
        style={{ position: 'fixed' }}
      />
    </div>
  )
}

function YouBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`rounded-full border-2 border-ink bg-choice-yellow px-2 py-0.5 text-sm font-bold text-ink ${className}`}
    >
      You
    </span>
  )
}

/** Height and colour of each podium step: first, second, third */
const PODIUM_STYLES = [
  'h-48 bg-choice-yellow',
  'h-36 bg-white',
  'h-28 bg-choice-red',
]
