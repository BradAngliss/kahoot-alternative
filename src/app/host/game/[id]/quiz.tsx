import PlayerNames from '@/components/player-names'
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
    <div className="stage-screen mx-auto max-w-[max(90vw,1152px)] px-6 pt-4">
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

      {!hasShownChoices && (
        <div className="flex flex-grow flex-col items-center justify-center gap-4 font-display">
          <div className="stage-timer text-5xl font-extrabold">
            <CountdownCircleTimer
              key={question.id}
              isPlaying
              duration={TIME_TIL_CHOICE_REVEAL / 1000}
              colors={['#ffc93c', '#ffc93c', '#ffc93c', '#ffc93c']}
              colorsTime={[7, 5, 2, 0]}
              trailColor={'rgba(255,255,255,0.2)' as ColorFormat}
              strokeWidth={12}
              size={140}
            >
              {({ remainingTime }) => remainingTime}
            </CountdownCircleTimer>
          </div>
          <p className="text-3xl font-bold text-white/80">Get ready…</p>
        </div>
      )}

      {/* Half of the spare space, shared with the choices below. Names never add
          to it. A narrow window puts them under the timer, where they have room. */}
      {hasShownChoices && !isAnswerRevealed && (
        <div className="flex min-h-[16rem] flex-1 flex-col gap-4 md:min-h-[8.75rem] md:flex-row md:gap-6">
          <div className="flex shrink-0 items-center gap-6 font-display">
            <div className="stage-timer text-5xl font-extrabold">
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
                size={140}
              >
                {({ remainingTime }) => remainingTime}
              </CountdownCircleTimer>
            </div>
            <div className="text-center">
              <div className="text-6xl font-extrabold tabular-nums">{answers.length}</div>
              <div className="text-xl font-semibold text-white/80">
                of {participants.length} answered
              </div>
            </div>
          </div>
          <div className="min-h-0 min-w-0 flex-grow">
            <PlayerNames
              label="Players who have answered"
              emptyText="Waiting for answers…"
              players={answers.flatMap((answer) => {
                const joinIndex = participants.findIndex(
                  (participant) => participant.id === answer.participant_id
                )
                if (joinIndex === -1) return []
                return [
                  {
                    id: answer.id,
                    nickname: participants[joinIndex].nickname,
                    joinIndex,
                  },
                ]
              })}
            />
          </div>
        </div>
      )}

      {isAnswerRevealed && (
        <div className="flex flex-1 flex-col justify-center">
          <RevealView question={question} answers={answers} />
        </div>
      )}

      {hasShownChoices && (
        <div className="flex flex-1 flex-col justify-center">
          <HostView question={question} isAnswerRevealed={isAnswerRevealed} />
        </div>
      )}
    </div>
  )
}
