import PlayerName from '@/components/player-name'
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
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-8">
      <Wordmark />
      <div className="grid flex-grow items-center gap-8 lg:grid-cols-[auto_1fr]">
        <div className="card flex flex-col items-center p-6 text-center">
          <h1 className="font-display text-3xl font-extrabold">Join on your phone</h1>
          <p className="pb-4 text-ink/70">Scan the code with your camera</p>
          <div className="overflow-hidden rounded-xl border-2 border-ink">
            {joinUrl && (
              <Canvas
                text={joinUrl}
                options={{
                  errorCorrectionLevel: 'M',
                  margin: 2,
                  scale: 4,
                  width: 320,
                }}
              />
            )}
          </div>
          {joinUrl && (
            <p className="max-w-[320px] break-all pt-4 text-sm font-semibold text-ink/60">
              {joinUrl}
            </p>
          )}
        </div>

        <div className="flex h-full flex-col gap-6">
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

          <div className="flex flex-grow flex-wrap content-start gap-3 rounded-2xl border-2 border-white/20 bg-white/5 p-4">
            {participants.length === 0 && (
              <p className="m-auto text-lg text-white/60">Waiting for players…</p>
            )}
            {participants.map((participant, index) => (
              <PlayerName
                key={participant.id}
                nickname={participant.nickname}
                joinIndex={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
