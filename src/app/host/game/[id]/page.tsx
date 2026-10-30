'use client'

import FitStage from '@/components/fit-stage'
import Leaderboard from '@/components/leaderboard'
import {
  Answer,
  Choice,
  Game,
  Participant,
  Question,
  QuizSet,
  supabase,
} from '@/types/types'
import { useEffect, useState } from 'react'
import Lobby from './lobby'
import Quiz from './quiz'

enum AdminScreens {
  lobby = 'lobby',
  quiz = 'quiz',
  result = 'result',
}

export default function Home({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  const [currentScreen, setCurrentScreen] = useState<AdminScreens>(
    AdminScreens.lobby
  )

  const [participants, setParticipants] = useState<Participant[]>([])

  const [quizSet, setQuizSet] = useState<QuizSet>()

  useEffect(() => {
    const getQuestions = async () => {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select()
        .eq('id', gameId)
        .single()
      if (gameError) {
        console.error(gameError.message)
        alert('Error getting game data')
        return
      }
      const { data, error } = await supabase
        .from('quiz_sets')
        .select(`*, questions(*, choices(*))`)
        .eq('id', gameData.quiz_set_id)
        .order('order', {
          ascending: true,
          referencedTable: 'questions',
        })
        .order('position', {
          ascending: true,
          referencedTable: 'questions.choices',
        })
        .single()
      if (error) {
        console.error(error.message)
        getQuestions()
        return
      }
      setQuizSet(data)
    }

    // A new name each time, because supabase.channel returns any channel with the
    // same name that's still being removed, and that one can't take new listeners
    const channel = supabase
      .channel(`game:${gameId}:${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const participant = payload.new as Participant
          setParticipants((currentParticipants) => {
            // Already there if they joined just before the list below loaded
            return currentParticipants.some(({ id }) => id === participant.id)
              ? currentParticipants
              : [...currentParticipants, participant]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          // start the quiz game
          const game = payload.new as Game
          setCurrentQuestionSequence(game.current_question_sequence)
          setCurrentScreen(game.phase as AdminScreens)
        }
      )
      .subscribe()

    const loadGame = async () => {
      const { data } = await supabase
        .from('participants')
        .select()
        .eq('game_id', gameId)
        .order('created_at')
      if (data) setParticipants(data)

      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select()
        .eq('id', gameId)
        .single()

      if (gameError) {
        alert(gameError.message)
        console.error(gameError)
        return
      }

      setCurrentQuestionSequence(gameData.current_question_sequence)
      setCurrentScreen(gameData.phase as AdminScreens)
    }

    getQuestions()
    loadGame()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)

  if (currentScreen == AdminScreens.result) {
    return (
      <main className="stage">
        <Leaderboard gameId={gameId} title={quizSet!.name} />
      </main>
    )
  }

  return (
    <FitStage>
      {currentScreen == AdminScreens.lobby && (
        <Lobby participants={participants} gameId={gameId}></Lobby>
      )}
      {currentScreen == AdminScreens.quiz && (
        <Quiz
          question={quizSet!.questions![currentQuestionSequence]}
          questionCount={quizSet!.questions!.length}
          gameId={gameId}
          participants={participants}
        ></Quiz>
      )}
    </FitStage>
  )
}
