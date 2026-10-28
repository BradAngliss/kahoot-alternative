import { useEffect, useRef } from 'react'

/** Calls submit once when time runs out, with the player's latest answer. */
export function useAutoSubmit(isTimeUp: boolean, submit: () => void) {
  // Always the latest submit, so the effect sends what's on screen now
  const submitRef = useRef(submit)
  submitRef.current = submit

  useEffect(() => {
    if (isTimeUp) submitRef.current()
  }, [isTimeUp])
}
