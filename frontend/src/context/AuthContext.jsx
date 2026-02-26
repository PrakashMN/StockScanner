import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ss_token'))
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('ss_user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })

  const login = (token, user) => {
    localStorage.setItem('ss_token', token)
    localStorage.setItem('ss_user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('ss_token')
    localStorage.removeItem('ss_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
