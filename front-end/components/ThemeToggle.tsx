"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-full hover:bg-black/5 dark:bg-white/5 transition-colors text-gray-600 dark:text-white/60 w-9 h-9 flex items-center justify-center cursor-pointer">
        <div className="w-5 h-5" />
      </button>
    )
  }

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const isDark = theme === "dark"
    const nextTheme = isDark ? "light" : "dark"

    if (!('startViewTransition' in document)) {
      setTheme(nextTheme)
      return
    }

    const x = e.clientX
    const y = e.clientY
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      setTheme(nextTheme)
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ]

      document.documentElement.animate(
        {
          clipPath: isDark ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 500,
          easing: "ease-out",
          pseudoElement: isDark ? "::view-transition-old(root)" : "::view-transition-new(root)",
        }
      )
    })
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 relative rounded-full hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 transition-colors text-gray-600 dark:text-white/60 hover:text-neon-blue dark:hover:text-neon-blue w-9 h-9 flex items-center justify-center cursor-pointer"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 absolute transition-all rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="h-5 w-5 absolute transition-all rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
    </button>
  )
}
