import {
  choicesInPosition,
  sliderSettings as savedSliderSettings,
  typeAnswerSettings,
} from '@/components/quiz-types/json'
import { QUESTION_TYPE_LABELS, QuestionType } from '@/components/quiz-types/registry'
import { Json } from '@/types/supabase'
import { Question } from '@/types/types'

export const MAX_CHOICES = 6

/** Form state for a choice. key is only for React. id is set once it's saved. */
export type ChoiceDraft = { key: string; id?: string; body: string; isCorrect: boolean }

/** Form state for a question. Numbers stay strings until the pack is saved. id is set once it's saved. */
export type QuestionDraft = {
  key: string
  id?: string
  type: QuestionType
  body: string
  timeLimit: string
  /** The saved picture, or a local preview of imageFile */
  imageUrl: string | null
  /** A picture to upload when the pack is saved */
  imageFile: File | null
  choices: ChoiceDraft[]
  /** type_answer: one accepted answer per line */
  acceptedAnswers: string
  // slider
  min: string
  max: string
  step: string
  answer: string
  margin: string
  unit: string
}

let lastKey = 0
const newKey = () => `draft-${++lastKey}`

export const newChoice = (body = '', isCorrect = false): ChoiceDraft => ({
  key: newKey(),
  body,
  isCorrect,
})

/** The choices a question of this type starts with, keeping what's already typed. */
const choicesForType = (type: QuestionType, choices: ChoiceDraft[]): ChoiceDraft[] => {
  switch (type) {
    case 'true_false':
      return [newChoice('True', true), newChoice('False')]
    case 'type_answer':
    case 'slider':
      return []
  }

  const isFixed = choices.length === 2 && choices[0].body === 'True' && choices[1].body === 'False'
  const kept = choices.length > 0 && !isFixed ? choices : [newChoice(), newChoice(), newChoice(), newChoice()]

  if (type === 'ordering' || type === 'poll') {
    return kept.map((choice) => ({ ...choice, isCorrect: false }))
  }
  if (type === 'multiple_choice') {
    // Needs one correct choice to start with
    return kept.some((choice) => choice.isCorrect)
      ? kept
      : kept.map((choice, index) => ({ ...choice, isCorrect: index === 0 }))
  }
  return kept
}

export const newQuestion = (type: QuestionType = 'multiple_choice'): QuestionDraft => ({
  key: newKey(),
  type,
  body: '',
  timeLimit: '20',
  imageUrl: null,
  imageFile: null,
  choices: choicesForType(type, []),
  acceptedAnswers: '',
  min: '0',
  max: '100',
  step: '1',
  answer: '',
  margin: '',
  unit: '',
})

/** Form state for a question that's already saved. */
export const fromQuestion = (question: Question): QuestionDraft => {
  const slider = savedSliderSettings(question)
  return {
    ...newQuestion(question.type),
    id: question.id,
    body: question.body,
    timeLimit: String(question.time_limit_seconds),
    imageUrl: question.image_url,
    choices: choicesInPosition(question).map((choice) => ({
      ...newChoice(choice.body, choice.is_correct),
      id: choice.id,
    })),
    acceptedAnswers: typeAnswerSettings(question).accepted_answers.join('\n'),
    ...(question.type === 'slider' && {
      min: String(slider.min),
      max: String(slider.max),
      step: String(slider.step ?? 1),
      answer: String(slider.answer),
      margin: slider.margin === undefined ? '' : String(slider.margin),
      unit: slider.unit ?? '',
    }),
  }
}

export const changeType = (question: QuestionDraft, type: QuestionType): QuestionDraft => ({
  ...question,
  type,
  choices: choicesForType(type, question.choices),
})

const acceptedAnswers = (question: QuestionDraft) =>
  question.acceptedAnswers
    .split('\n')
    .map((answer) => answer.trim())
    .filter(Boolean)

const toNumber = (text: string) => (text.trim() === '' ? NaN : Number(text))

const sliderProblems = (question: QuestionDraft): string[] => {
  const [min, max, step, answer] = [question.min, question.max, question.step, question.answer].map(toNumber)
  if ([min, max, step, answer].some(Number.isNaN)) {
    return ['needs a minimum, maximum, step and answer']
  }
  const problems: string[] = []
  if (min >= max) problems.push('minimum must be below the maximum')
  if (step <= 0) problems.push('step must be above 0')
  if (answer < min || answer > max) {
    problems.push('answer must be between the minimum and maximum')
  } else if (step > 0) {
    // Otherwise the slider can't land on the answer and nobody gets full points
    const steps = (answer - min) / step
    if (Math.abs(steps - Math.round(steps)) > 1e-9) {
      problems.push('answer must land on a step of the slider')
    }
  }
  if (question.margin.trim() !== '' && !(toNumber(question.margin) >= 0)) {
    problems.push('margin must be 0 or more')
  }
  return problems
}

const choiceProblems = (question: QuestionDraft): string[] => {
  const problems: string[] = []
  if (question.choices.length < 2) problems.push('needs at least 2 choices')
  if (question.choices.some((choice) => !choice.body.trim())) problems.push('has an empty choice')

  const correct = question.choices.filter((choice) => choice.isCorrect).length
  if (question.type === 'true_false' && correct !== 1) {
    problems.push('needs exactly one correct choice')
  }
  if (['multiple_choice', 'multi_select'].includes(question.type) && correct === 0) {
    problems.push('needs at least one correct choice')
  }
  return problems
}

/** What's stopping the pack being saved, as messages to show. Empty when it's ready. */
export const packProblems = (name: string, questions: QuestionDraft[]): string[] => {
  const problems: string[] = []
  if (!name.trim()) problems.push('The pack needs a name')
  if (questions.length === 0) problems.push('The pack needs at least one question')

  questions.forEach((question, index) => {
    const found: string[] = []
    if (!question.body.trim()) found.push('needs question text')

    const timeLimit = Number(question.timeLimit)
    if (!Number.isInteger(timeLimit) || timeLimit < 5 || timeLimit > 600) {
      found.push('time limit must be a whole number from 5 to 600 seconds')
    }

    if (question.type === 'slider') found.push(...sliderProblems(question))
    else if (question.type === 'type_answer') {
      if (acceptedAnswers(question).length === 0) found.push('needs at least one accepted answer')
    } else found.push(...choiceProblems(question))

    const label = `Question ${index + 1} (${QUESTION_TYPE_LABELS[question.type]})`
    problems.push(...found.map((problem) => `${label}: ${problem}`))
  })

  return problems
}

const sliderSettings = (question: QuestionDraft) => ({
  min: toNumber(question.min),
  max: toNumber(question.max),
  step: toNumber(question.step),
  answer: toNumber(question.answer),
  ...(question.margin.trim() !== '' && { margin: toNumber(question.margin) }),
  ...(question.unit.trim() !== '' && { unit: question.unit.trim() }),
})

/** The questions argument for create_quiz_set and update_quiz_set. */
export const toPayload = (questions: QuestionDraft[]): Json =>
  questions.map((question) => ({
    ...(question.id && { id: question.id }),
    body: question.body.trim(),
    type: question.type,
    time_limit_seconds: Number(question.timeLimit),
    image_url: question.imageUrl,
    settings:
      question.type === 'slider'
        ? sliderSettings(question)
        : question.type === 'type_answer'
          ? { accepted_answers: acceptedAnswers(question) }
          : {},
    choices: question.choices.map((choice) => ({
      ...(choice.id && { id: choice.id }),
      body: choice.body.trim(),
      is_correct: choice.isCorrect,
    })),
  }))
