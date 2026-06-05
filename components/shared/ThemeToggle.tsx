"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={`w-9 h-9 opacity-0 ${className}`} /> // placeholder
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 dark:bg-black/10 dark:border-white/10 dark:hover:bg-white/10 transition-colors backdrop-blur-md flex items-center justify-center ${className || ''}`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-400 dark:text-indigo-300" />
      )}
    </button>
  )
}
