"use client"

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'

import { getBrowserClient } from '@/lib/supabase-client'
import type { LoginCredentials, RegisterCredentials } from '@/types/auth'

const supabase = getBrowserClient()

export function getSupabaseClient() {
  return supabase
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { error, data } = await supabase.auth.signInWithPassword(credentials)

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
      queryClient.setQueryData(['session'], data)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterCredentials) => {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            full_name: payload.fullName,
            department: payload.department,
            role: payload.role ?? 'employee',
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })
}
