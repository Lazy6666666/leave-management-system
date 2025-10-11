import React from 'react'
import { AvatarUpload } from '@/components/features/AvatarUpload'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useUserProfile } from '@/hooks/use-user-profile'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getBrowserClient } from '@/lib/supabase-client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  department: z.string().optional(),
  photo_url: z.string().optional().nullable(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user } = useAuth()
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile(user?.id)
  const queryClient = useQueryClient()
  const supabase = getBrowserClient()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: userProfile?.full_name || '',
      department: userProfile?.department || '',
      photo_url: userProfile?.photo_url || null,
    },
  })

  // Reset form with new default values when userProfile changes
  React.useEffect(() => {
    if (userProfile) {
      reset({
        full_name: userProfile.full_name || '',
        department: userProfile.department || '',
        photo_url: userProfile.photo_url || null,
      })
    }
  }, [userProfile, reset])

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          department: values.department,
          photo_url: values.photo_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['userProfile', user?.id],
      })
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleAvatarUploadSuccess = (newUrl: string) => {
    updateProfileMutation.mutate({
      ...userProfile,
      photo_url: newUrl,
    } as ProfileFormValues)
  }

  if (isProfileLoading) {
    return (
      <div className="space-y-6 p-6 md:p-8">
        <PageHeader title="Profile" description="Manage your profile settings" />
        <div className="flex flex-col items-center space-y-4">
          <div className="h-24 w-24 rounded-full bg-muted animate-pulse"></div>
          <div className="h-10 w-48 bg-muted animate-pulse rounded-md"></div>
        </div>
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
          <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader title="Profile" description="Manage your profile settings" />

      <form onSubmit={handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-6">
        <AvatarUpload
          userId={user?.id || ''}
          avatarUrl={userProfile?.photo_url || null}
          onUploadSuccess={handleAvatarUploadSuccess}
        />

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              defaultValue={userProfile?.full_name || ''}
              disabled={isSubmitting}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              {...register('department')}
              defaultValue={userProfile?.department || ''}
              disabled={isSubmitting}
            />
            {errors.department && (
              <p className="text-sm text-destructive">{errors.department.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Profile
          </Button>
        </div>
      </form>
    </div>
  )
}
