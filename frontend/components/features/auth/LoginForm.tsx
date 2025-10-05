'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { loginSchema, type LoginFormData } from '@/lib/schemas/auth'
import { useLogin, getSupabaseClient } from '@/hooks/use-auth'
import { Input } from '@/ui/input'
import { Button } from '@/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/form'
import { Alert, AlertDescription } from '@/ui/alert'
import { AlertCircle } from 'lucide-react'

interface LoginFormProps {
  redirectTo?: string
  onSuccess?: () => void
}

export function LoginForm({ redirectTo, onSuccess }: LoginFormProps) {
  const { toast } = useToast()
  const [isSubmittingMagicLink, setIsSubmittingMagicLink] = useState(false)
  const loginMutation = useLogin()
  const supabase = getSupabaseClient()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
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
        form.setError('root', { message: error.message })
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        })
      },
    })
  })

  const handleMagicLink = async () => {
    const email = form.getValues('email')
    if (!email) {
      form.setError('email', { message: 'Email is required for magic link' })
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
    <Form {...form}>
      <form className="space-y-6" onSubmit={onSubmit} noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-slate-700">
                Email address
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your work email"
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  error={!!form.formState.errors.email}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-slate-700">
                Password
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  error={!!form.formState.errors.password}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button 
            type="submit" 
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium" 
            loading={loginMutation.isPending}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in to LeaveFlow'}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={handleMagicLink}
            loading={isSubmittingMagicLink}
            disabled={isSubmittingMagicLink}
          >
            {isSubmittingMagicLink ? 'Sending magic link...' : 'Send magic link instead'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
