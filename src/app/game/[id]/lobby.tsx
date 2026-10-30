import Wordmark from '@/components/wordmark'
import { Participant, supabase } from '@/types/types'
import { FormEvent, useEffect, useRef, useState } from 'react'

export default function Lobby({
  gameId,
  onRegisterCompleted,
}: {
  gameId: string
  onRegisterCompleted: (participant: Participant) => void
}) {
  const [participant, setParticipant] = useState<Participant | null>(null)

  // The parent passes a new callback on every render. Keeping the latest one
  // in a ref means the check below runs once per game, not on every render.
  const onRegisterCompletedRef = useRef(onRegisterCompleted)
  onRegisterCompletedRef.current = onRegisterCompleted

  useEffect(() => {
    const fetchParticipant = async () => {
      let userId: string | null = null

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()

      if (sessionData.session) {
        userId = sessionData.session?.user.id ?? null
      } else {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) console.error(error)
        userId = data?.user?.id ?? null
      }

      if (!userId) {
        return
      }

      const { data: participantData, error } = await supabase
        .from('participants')
        .select()
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        return alert(error.message)
      }

      if (participantData) {
        setParticipant(participantData)
        onRegisterCompletedRef.current(participantData)
      }
    }

    fetchParticipant()
  }, [gameId])

  return (
    <div className="stage-screen items-center px-4 pt-6">
      <Wordmark />
      <div className="flex w-full max-w-sm flex-grow flex-col justify-center">
        {!participant && (
          <Register
            gameId={gameId}
            onRegisterCompleted={(participant) => {
              onRegisterCompleted(participant)
              setParticipant(participant)
            }}
          />
        )}

        {participant && (
          <div className="card animate-pop-in p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-ink/60">
              You&apos;re in!
            </p>
            <h1 className="break-words py-3 font-display text-4xl font-extrabold">
              {participant.nickname}
            </h1>
            <p className="text-ink/70">
              Look for your name on the host&apos;s screen. The game starts
              when the host is ready.
            </p>
            <WaitingDots />
          </div>
        )}
      </div>
    </div>
  )
}

/** Three bouncing dots while waiting for the host */
function WaitingDots() {
  return (
    <div className="flex justify-center gap-2 pt-6" aria-hidden="true">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-3 w-3 animate-bounce rounded-full bg-stage"
          style={{ animationDelay: `${delay}ms` }}
        ></span>
      ))}
    </div>
  )
}

function Register({
  onRegisterCompleted,
  gameId,
}: {
  onRegisterCompleted: (player: Participant) => void
  gameId: string
}) {
  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Checked before setSending, so an empty name doesn't disable the button
    if (!nickname.trim()) {
      return
    }
    setSending(true)
    const { data: participant, error } = await supabase
      .from('participants')
      .insert({ nickname, game_id: gameId })
      .select()
      .single()

    if (error) {
      setSending(false)

      return alert(error.message)
    }

    onRegisterCompleted(participant)
  }

  const [nickname, setNickname] = useState('')
  const [sending, setSending] = useState(false)

  return (
    <form onSubmit={(e) => onFormSubmit(e)} className="card animate-pop-in p-6">
      <h1 className="pb-1 font-display text-3xl font-extrabold">Join the game</h1>
      <p className="pb-5 text-ink/70">Pick a nickname for the leaderboard.</p>
      <input
        className="input"
        type="text"
        onChange={(val) => setNickname(val.currentTarget.value)}
        placeholder="Nickname"
        aria-label="Nickname"
        maxLength={20}
        autoComplete="off"
        autoFocus
      />
      <button
        disabled={sending || !nickname.trim()}
        className="btn btn-accent mt-4 w-full"
      >
        {sending ? 'Joining…' : 'Join'}
      </button>
    </form>
  )
}
