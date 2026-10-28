import { SliderSettings } from '../types'

// No thousands separator below 10,000, so years read as 1996 rather than 1,996
export const formatValue = (value: number, { unit }: SliderSettings) => {
  const number = value.toLocaleString(undefined, {
    useGrouping: Math.abs(value) >= 10000,
  })
  return unit ? `${number} ${unit}` : number
}
