import React from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button.jsx'
import { Sun, Moon } from 'lucide-react'

function ThemeToggle() {
  const { theme = 'light', setTheme } = useTheme()
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')
  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} className="ml-auto">
      {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  )
}

export default ThemeToggle
