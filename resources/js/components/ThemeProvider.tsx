import { router } from '@inertiajs/react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

type Theme = 'dark' | 'light'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const timer = useRef<number>()

  useEffect(() => {
    localStorage.setItem(storageKey, defaultTheme)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)

      setTheme(theme)

      clearTimeout(timer.current)

      timer.current = setTimeout(() => {
        router.put('/toggle-dark-mode', {
          dark_mode: theme === 'dark',
        })
      }, 1000)
    },
  }

  return (
    <ThemeProviderContext.Provider
      {...props}
      value={value}
    >
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
