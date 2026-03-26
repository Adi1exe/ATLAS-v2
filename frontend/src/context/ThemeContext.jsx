import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark')
  const [ripple, setRipple] = useState(null) // { x, y }
  const rafRef = useRef(null)

  const toggleTheme = useCallback((e) => {
    const x = e?.clientX ?? window.innerWidth / 2
    const y = e?.clientY ?? window.innerHeight / 2

    setRipple({ x, y })

    // Let ripple grow, then switch theme
    setTimeout(() => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }, 180)

    setTimeout(() => setRipple(null), 700)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme} style={{ minHeight: '100vh' }}>
        {/* Ripple overlay */}
        {ripple && (
          <div
            className="theme-ripple"
            style={{
              '--rx': `${ripple.x}px`,
              '--ry': `${ripple.y}px`,
            }}
          />
        )}
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
