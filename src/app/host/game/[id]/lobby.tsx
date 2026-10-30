import PlayerNames from '@/components/player-names'
import Wordmark from '@/components/wordmark'
import { Participant, supabase } from '@/types/types'
import { useQRCode } from 'next-qrcode'
import { useEffect, useState } from 'react'

export default function Lobby({
  participants: participants,
  gameId,
}: {
  participants: Participant[]
  gameId: string
}) {
  const { Canvas } = useQRCode()

  // window is only available in the browser, so read the origin after mount
  const [origin, setOrigin] = useState<string | null>(null)
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const joinUrl = origin ? `${origin}/game/${gameId}` : null

  const onClickStartGame = async () => {
    const { data, error } = await supabase
      .from('games')
      .update({ phase: 'quiz' })
      .eq('id', gameId)
    if (error) {
      return alert(error.message)
    }
  }

  return (
    <div className="stage-screen mx-auto max-w-[max(90vw,1152px)] px-6 pt-4">
      <Wordmark />
      <div className="grid min-h-0 flex-grow grid-rows-[auto_minmax(6rem,1fr)] gap-6 landscape:grid-cols-[auto_1fr] landscape:grid-rows-[minmax(0,1fr)]">
        <div className="card flex flex-col items-center justify-center p-6 text-center">
          <h1 className="font-display text-3xl font-extrabold">Join on your phone</h1>
          <p className="pb-4 text-ink/70">Scan the code with your camera</p>
          <div className="overflow-hidden rounded-xl border-2 border-ink [&_canvas]:!h-[min(20rem,25vh)] [&_canvas]:!w-auto landscape:[&_canvas]:!h-[min(20rem,45vh)]">
            {joinUrl && (
              <Canvas
                text={joinUrl}
                options={{
                  errorCorrectionLevel: 'M',
                  margin: 2,
                  scale: 4,
                  width: 640,
                }}
              />
            )}
          </div>
          {joinUrl && (
            <p className="max-w-[20rem] break-all pt-4 text-sm font-semibold text-ink/60">
              {joinUrl}
            </p>
          )}
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-7xl font-extrabold tabular-nums">
                {participants.length}
              </p>
              <p className="text-xl font-semibold text-white/80">
                {participants.length === 1 ? 'player' : 'players'} joined
              </p>
            </div>
            <button
              className="btn btn-accent px-10 py-4 text-2xl"
              onClick={onClickStartGame}
              disabled={participants.length === 0}
            >
              Start game
            </button>
          </div>

          <div className="min-h-0 flex-grow">
            <PlayerNames
              label="Players who have joined"
              emptyText="Waiting for players…"
              players={participants.map(({ id, nickname }, joinIndex) => ({
                id,
                nickname,
                joinIndex,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
