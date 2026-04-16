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
    const x = e.clientX
    const y = e.clientY
    
    document.documentElement.style.setProperty('--x', `${x}px`)
    document.documentElement.style.setProperty('--y', `${y}px`)

    const isDark = theme === "dark"
    const nextTheme = isDark ? "light" : "dark"

    if (!('startViewTransition' in document)) {
      setTheme(nextTheme)
      return
    }

    document.documentElement.classList.add('theme-switching')
    
    // @ts-ignore
    const transition = document.startViewTransition(() => {
      setTheme(nextTheme)
    })

    transition.finished.finally(() => {
      document.documentElement.classList.remove('theme-switching')
    })
  }
  return (
    <button
      onClick={toggleTheme}
      className="p-2 relative rounded-full hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 transition-colors text-gray-600 dark:text-white/60 hover:text-neon-blue dark:hover:text-neon-blue w-9 h-9 flex items-center justify-center cursor-pointer"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 absolute transition-opacity opacity-100 dark:opacity-0" />
      <Moon className="h-5 w-5 absolute transition-opacity opacity-0 dark:opacity-100" />
    </button>
  )
}
