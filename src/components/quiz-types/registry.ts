import { Database } from '@/types/supabase'
import { Question } from '@/types/types'
import multiSelect from './multi-select'
import multipleChoice from './multiple-choice'
import ordering from './ordering'
import poll from './poll'
import slider from './slider'
import trueFalse from './true-false'
import typeAnswer from './type-answer'
import { QuizVariant } from './types'

export type QuestionType = Database['public']['Enums']['question_type']

export const quizVariants: Record<QuestionType, QuizVariant> = {
  multiple_choice: multipleChoice,
  true_false: trueFalse,
  multi_select: multiSelect,
  type_answer: typeAnswer,
  slider,
  ordering,
  poll,
}

export const getQuizVariant = (question: Question): QuizVariant =>
  quizVariants[question.type]

/** Names shown to hosts, e.g. on the dashboard */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple choice',
  true_false: 'True or false',
  multi_select: 'Multi-select',
  type_answer: 'Type the answer',
  slider: 'Slider',
  ordering: 'Put in order',
  poll: 'Poll',
}
