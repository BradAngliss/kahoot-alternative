import { Question } from '@/types/types'
import multipleChoice from './multiple-choice'
import { QuizVariant } from './types'

export type QuestionType = 'multiple_choice'

export const quizVariants: Record<QuestionType, QuizVariant> = {
  multiple_choice: multipleChoice,
}

// Questions have no type column yet, so every question is multiple choice.
export const getQuizVariant = (_question: Question): QuizVariant =>
  quizVariants.multiple_choice
