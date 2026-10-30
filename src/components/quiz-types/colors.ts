/** Background colour for each choice, by position. Choices past the fourth reuse the last colour. */
export const CHOICE_COLORS = [
  'bg-choice-red',
  'bg-choice-blue',
  'bg-choice-yellow',
  'bg-choice-green',
]

export const choiceColor = (index: number) =>
  CHOICE_COLORS[Math.min(index, CHOICE_COLORS.length - 1)]

/** A, B, C… so choices aren't told apart by colour alone */
export const choiceLetter = (index: number) => String.fromCharCode(65 + index)
