import { ReactNode, useRef } from 'react'
import useIsomorphicLayoutEffect from 'react-use/lib/useIsomorphicLayoutEffect'

const MIN_FONT_SIZE = 8
const SMALLEST_BASE_FONT_SIZE = 16
const LARGEST_BASE_FONT_SIZE = 32

/** 16px on a 1280x720 window, growing in step with larger screens */
const getBaseFontSize = () =>
  Math.min(
    LARGEST_BASE_FONT_SIZE,
    Math.max(
      SMALLEST_BASE_FONT_SIZE,
      Math.min(window.innerWidth / 80, window.innerHeight / 45)
    )
  )

/**
 * A game screen that fills the window, so players never have to scroll. Text
 * and spacing are set in rem, so the root font size scales all of it: up on a
 * large screen, and down when the content is too tall (a long question, a
 * short window).
 */
export default function FitStage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLElement>(null)

  useIsomorphicLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const root = document.documentElement

    const fit = () => {
      let fontSize = getBaseFontSize()
      root.style.fontSize = `${fontSize}px`
      while (stage.scrollHeight > stage.clientHeight && fontSize > MIN_FONT_SIZE) {
        fontSize -= 0.5
        root.style.fontSize = `${fontSize}px`
      }
    }

    fit()

    // Runs before the browser paints, so an overflowing screen is never shown
    const contentObserver = new MutationObserver(fit)
    contentObserver.observe(stage, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    const sizeObserver = new ResizeObserver(fit)
    sizeObserver.observe(stage)

    return () => {
      contentObserver.disconnect()
      sizeObserver.disconnect()
      root.style.fontSize = ''
    }
  }, [])

  return (
    <main ref={stageRef} className="stage stage-fit">
      {children}
    </main>
  )
}
