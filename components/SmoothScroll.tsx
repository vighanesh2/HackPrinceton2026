'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08, // Heavy, luxurious feel - lower value = heavier/smoother (default is 0.1)
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: false, // Disable smooth touch for better mobile performance
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Cleanup
    return () => {
      lenis.destroy()
    }
  }, [])

  return null
}