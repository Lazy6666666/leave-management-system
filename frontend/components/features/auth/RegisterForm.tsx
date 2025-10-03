'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth'
import { useRegister } from '@/hooks/use-auth'
import { Input } from '@/ui/input'
import { Button } from '@/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { useToast } from '@/hooks/use-toast'

const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Success',
]

interface RegisterFormProps {
  redirectTo?: string
  onSuccess?: () => void
}

export function RegisterForm({ redirectTo, onSuccess }: RegisterFormProps) {
  const { toast } = useToast()
  const registerMutation = useRegister()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: '',
      role: 'employee',
    },
  })

  const onSubmit = handleSubmit((data) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Account created',
          description: 'Check your email to confirm your account.',
        })
        onSuccess?.()
        if (redirectTo) {
          window.location.assign(redirectTo)
        }
      },
      onError: (error) => {
        setError('root', { message: error.message })
        toast({
          title: 'Registration failed',
          description: error.message,
          variant: 'destructive',
        })
      },
    })
  })

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium text-foreground">
          Full name
        </label>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder="Enter your full name"
          {...register('fullName')}
        />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Department</label>
        <Controller
          control={control}
          name="department"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.department && (
          <p className="text-sm text-destructive">{errors.department.message}</p>
        )}
      </div>

      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}
