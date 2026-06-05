"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = theme === "dark"
  const nextTheme = isDark ? "light" : "dark"

  const toggleTheme = () => {
    if (isAnimating) {
      return
    }

    setIsAnimating(true)

    const overlay = document.createElement("div")
    overlay.className = `theme-corner-flare ${nextTheme}`
    document.body.appendChild(overlay)

    setTimeout(() => {
      setTheme(nextTheme)
    }, 150)

    setTimeout(() => {
      overlay.remove()
      setIsAnimating(false)
    }, 420)
  }

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-full border border-slate-200 bg-slate-100 text-slate-700 shadow-sm transition-colors duration-300 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 w-10 h-10 flex items-center justify-center cursor-pointer"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      disabled={isAnimating}
      className={`p-2 rounded-full border border-slate-200 bg-slate-100 text-slate-700 shadow-sm transition duration-300 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-500 w-10 h-10 flex items-center justify-center cursor-pointer ${isAnimating ? "cursor-not-allowed opacity-80" : ""}`}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <Sun className={`h-5 w-5 absolute transition-opacity duration-300 ${isDark ? "opacity-0" : "opacity-100"}`} />
      <Moon className={`h-5 w-5 absolute transition-opacity duration-300 ${isDark ? "opacity-100" : "opacity-0"}`} />
    </button>
  )
}
