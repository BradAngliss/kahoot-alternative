/** Background colour for each choice, by position. Choices past the fourth reuse the last colour. */
export const CHOICE_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-yellow-500',
  'bg-green-500',
]

export const choiceColor = (index: number) =>
  CHOICE_COLORS[Math.min(index, CHOICE_COLORS.length - 1)]
