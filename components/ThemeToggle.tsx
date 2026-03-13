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
      <button className="p-2 rounded-full hover:bg-black/5 dark:bg-white/5 transition-colors text-gray-600 dark:text-white/60 w-9 h-9 flex items-center justify-center">
        <div className="w-5 h-5" />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 relative rounded-full hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 transition-colors text-gray-600 dark:text-white/60 hover:text-neon-blue dark:hover:text-neon-blue w-9 h-9 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 absolute transition-all rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="h-5 w-5 absolute transition-all rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
    </button>
  )
}
