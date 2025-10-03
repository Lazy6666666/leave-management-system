'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { loginSchema, type LoginFormData } from '@/lib/schemas/auth'
import { useLogin, getSupabaseClient } from '@/hooks/use-auth'
import { Input } from '@/ui/input'
import { Button } from '@/ui/button'
import { useToast } from '@/hooks/use-toast'

interface LoginFormProps {
  redirectTo?: string
  onSuccess?: () => void
}

export function LoginForm({ redirectTo, onSuccess }: LoginFormProps) {
  const { toast } = useToast()
  const [isSubmittingMagicLink, setIsSubmittingMagicLink] = useState(false)
  const loginMutation = useLogin()
  const supabase = getSupabaseClient()

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = handleSubmit(async (data) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Signed in successfully',
          description: 'Welcome back! Redirecting...',
        })
        onSuccess?.()
        if (redirectTo) {
          window.location.assign(redirectTo)
        }
      },
      onError: (error) => {
        setError('root', { message: error.message })
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        })
      },
    })
  })

  const handleMagicLink = async () => {
    const email = getValues('email')
    if (!email) {
      setError('email', { message: 'Email is required for magic link' })
      return
    }

    try {
      setIsSubmittingMagicLink(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo ?? window.location.href,
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: 'Magic link sent',
        description: 'Check your inbox for the sign-in link.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send magic link'
      toast({
        title: 'Magic link failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingMagicLink(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your work email"
          className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <span>⚠</span>
            <span>{errors.email.message}</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <span>⚠</span>
            <span>{errors.password.message}</span>
          </p>
        )}
      </div>

      {errors.root && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800 flex items-center space-x-2">
            <span>⚠</span>
            <span>{errors.root.message}</span>
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Button 
          type="submit" 
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium" 
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            'Sign in to LeaveFlow'
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-slate-200 text-slate-700 hover:bg-slate-50"
          onClick={handleMagicLink}
          disabled={isSubmittingMagicLink}
        >
          {isSubmittingMagicLink ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
              <span>Sending magic link...</span>
            </div>
          ) : (
            'Send magic link instead'
          )}
        </Button>
      </div>
    </form>
  )
}
