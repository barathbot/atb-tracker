"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut } from "@/lib/firebase"

interface User {
  id: string
  email: string
  name: string
  picture?: string
  provider: "email" | "google"
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userData: User) => void
  logout: () => void
  verifyToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const verifyToken = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) return false

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
        return true
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem("user")
        localStorage.removeItem("isAuthenticated")
        localStorage.removeItem("authToken")
        setUser(null)
        setIsAuthenticated(false)
        return false
      }
    } catch (error) {
      console.error("Token verification error:", error)
      return false
    }
  }

  useEffect(() => {
    // Check for existing authentication on mount
    const checkAuth = async () => {
      try {
        // First check if we have a token and verify it
        const tokenValid = await verifyToken()
        
        if (!tokenValid) {
          // If no valid token, check localStorage as fallback
          const storedUser = localStorage.getItem("user")
          const storedAuth = localStorage.getItem("isAuthenticated")

          if (storedUser && storedAuth === "true") {
            const userData = JSON.parse(storedUser)
            setUser(userData)
            setIsAuthenticated(true)
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        // Clear invalid data
        localStorage.removeItem("user")
        localStorage.removeItem("isAuthenticated")
        localStorage.removeItem("authToken")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          picture: firebaseUser.photoURL || undefined,
          provider: 'google' as const
        }
        setUser(userData)
        setIsAuthenticated(true)
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("isAuthenticated", "true")
      } else {
        // User is signed out from Firebase
        setUser(null)
        setIsAuthenticated(false)
        localStorage.removeItem("user")
        localStorage.removeItem("isAuthenticated")
        localStorage.removeItem("authToken")
      }
    })

    return () => unsubscribe()
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("isAuthenticated", "true")
  }

  const logout = async () => {
    let didRedirect = false;
    const doRedirect = () => {
      if (!didRedirect) {
        didRedirect = true;
        window.location.href = "/login";
      }
    };

    try {
      // Sign out from Firebase (with timeout fallback)
      await Promise.race([
        firebaseSignOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Sign out timeout")), 3000))
      ]);
    } catch (error) {
      console.error("Logout error:", error);
      // Continue to redirect even if sign out fails
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("authToken");
      doRedirect();
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isLoading, verifyToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
