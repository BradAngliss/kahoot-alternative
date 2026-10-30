import PlayerName from '@/components/player-name'
import QuestionCard from '@/components/quiz-types/question-card'
import QuestionProgress from '@/components/quiz-types/question-progress'
import { getQuizVariant } from '@/components/quiz-types/registry'
import { TIME_TIL_CHOICE_REVEAL, TIME_TIL_NEXT_QUESTION } from '@/constants'
import { Answer, Participant, Question, supabase } from '@/types/types'
import { useEffect, useRef, useState } from 'react'
import { ColorFormat, CountdownCircleTimer } from 'react-countdown-circle-timer'

export default function Quiz({
  question: question,
  questionCount: questionCount,
  gameId,
  participants,
}: {
  question: Question
  questionCount: number
  gameId: string
  participants: Participant[]
}) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const [answers, setAnswers] = useState<Answer[]>([])

  const { HostView, RevealView } = getQuizVariant(question)

  // Seconds left before moving on automatically, while the answer is shown
  const [secondsUntilNext, setSecondsUntilNext] = useState<number | null>(null)

  // The question already moved on from, so pressing Next as the countdown
  // ends only moves on once
  const advancedFromRef = useRef<string | null>(null)

  const getNextQuestion = async () => {
    if (advancedFromRef.current === question.id) return
    advancedFromRef.current = question.id

    var updateData
    if (questionCount == question.order + 1) {
      updateData = { phase: 'result' }
    } else {
      updateData = {
        current_question_sequence: question.order + 1,
        is_answer_revealed: false,
      }
    }

    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)
    if (error) {
      // Let the host try again with Next
      advancedFromRef.current = null
      return alert(error.message)
    }
  }

  // Latest getNextQuestion, so the countdown below doesn't restart every render
  const getNextQuestionRef = useRef(getNextQuestion)
  getNextQuestionRef.current = getNextQuestion

  const onTimeUp = async () => {
    setIsAnswerRevealed(true)
    await supabase
      .from('games')
      .update({
        is_answer_revealed: true,
      })
      .eq('id', gameId)
  }

  useEffect(() => {
    setIsAnswerRevealed(false)
    setHasShownChoices(false)
    setAnswers([])

    setTimeout(() => {
      setHasShownChoices(true)
    }, TIME_TIL_CHOICE_REVEAL)

    const channel = supabase
      .channel('answers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
          setAnswers((currentAnswers) => {
            return [...currentAnswers, payload.new as Answer]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [question.id])

  // Show the answer as soon as everyone has answered. Checked after rendering,
  // because answers arrive in batches and can land before the count updates
  useEffect(() => {
    if (
      !isAnswerRevealed &&
      participants.length > 0 &&
      answers.length >= participants.length
    ) {
      onTimeUp()
    }
  }, [answers.length, participants.length])

  // Once the answer is shown, count down and move on to the next question
  useEffect(() => {
    if (!isAnswerRevealed) {
      setSecondsUntilNext(null)
      return
    }

    let remaining = TIME_TIL_NEXT_QUESTION / 1000
    setSecondsUntilNext(remaining)
    const interval = setInterval(() => {
      remaining -= 1
      setSecondsUntilNext(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        getNextQuestionRef.current()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isAnswerRevealed, question.id])

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-6">
      <div className="flex items-center gap-4">
        <div className="flex-grow">
          <QuestionProgress question={question} questionCount={questionCount} />
        </div>
        {isAnswerRevealed && (
          <button className="btn btn-primary py-2" onClick={getNextQuestion}>
            {secondsUntilNext === null ? 'Next' : `Next in ${secondsUntilNext}s`}
          </button>
        )}
      </div>

      <QuestionCard body={question.body} size="lg" />

      <div className="flex flex-grow flex-col justify-center">
        {!hasShownChoices && (
          <p className="text-center font-display text-2xl font-bold text-white/80">
            Get ready…
          </p>
        )}
        {hasShownChoices && !isAnswerRevealed && (
          <div className="flex items-center justify-center gap-16 font-display">
            <div className="text-6xl font-extrabold">
              <CountdownCircleTimer
                onComplete={() => {
                  onTimeUp()
                }}
                isPlaying
                duration={question.time_limit_seconds}
                colors={['#ffffff', '#ffc93c', '#ff5c7a', '#ff5c7a']}
                colorsTime={[7, 5, 2, 0]}
                trailColor={'rgba(255,255,255,0.2)' as ColorFormat}
                strokeWidth={12}
                size={180}
              >
                {({ remainingTime }) => remainingTime}
              </CountdownCircleTimer>
            </div>
            <div className="text-center">
              <div className="text-7xl font-extrabold tabular-nums">{answers.length}</div>
              <div className="text-2xl font-semibold text-white/80">
                of {participants.length} answered
              </div>
            </div>
          </div>
        )}
        {isAnswerRevealed && (
          <RevealView question={question} answers={answers} />
        )}
      </div>

      {hasShownChoices && (
        <HostView question={question} isAnswerRevealed={isAnswerRevealed} />
      )}

      {hasShownChoices && !isAnswerRevealed && (
        <div
          aria-label="Players who have answered"
          className="flex min-h-[5rem] flex-wrap content-start gap-3 rounded-2xl border-2 border-white/20 bg-white/5 p-4"
        >
          {answers.length === 0 && (
            <p className="m-auto text-lg text-white/60">Waiting for answers…</p>
          )}
          {answers.map((answer) => {
            const joinIndex = participants.findIndex(
              (participant) => participant.id === answer.participant_id
            )
            if (joinIndex === -1) return null
            return (
              <PlayerName
                key={answer.id}
                nickname={participants[joinIndex].nickname}
                joinIndex={joinIndex}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
