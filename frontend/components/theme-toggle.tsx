"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const handleThemeToggle = () => {
    // Add transitioning class to enable smooth theme transition
    document.documentElement.classList.add('transitioning')
    
    setTheme(theme === "light" ? "dark" : "light")
    
    // Remove transitioning class after transition completes
    setTimeout(() => {
      document.documentElement.classList.remove('transitioning')
    }, 300)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleThemeToggle}
      className="h-9 w-9 px-0 hover:bg-accent/80 active:scale-95 transition-all duration-200"
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}