import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getBrowserClient } from '@/lib/supabase-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Loader2, Camera } from 'lucide-react';

interface AvatarUploadProps {
  userId: string;
  avatarUrl: string | null;
  onUploadSuccess?: (newUrl: string) => void;
}

const supabase = getBrowserClient();

async function uploadAvatarToStorage(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Math.random()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}

async function updateProfileAvatarUrl(userId: string, newUrl: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ photo_url: newUrl })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

export function AvatarUpload({ userId, avatarUrl, onUploadSuccess }: AvatarUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      const newUrl = await uploadAvatarToStorage(file, userId);
      await updateProfileAvatarUrl(userId, newUrl);
      return newUrl;
    },
    onSuccess: (newUrl) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      if (onUploadSuccess) {
        onUploadSuccess(newUrl);
      }
      setFile(null);
    },
    onError: (error: Error) => {
      console.error('Avatar upload failed:', error.message);
      alert(`Upload failed: ${error.message}`);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0] || null);
    } else {
      setFile(null);
    }
  };

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={avatarUrl || undefined} alt="User Avatar" />
        <AvatarFallback className="text-4xl font-semibold"><Camera /></AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2">
        <div>
          <Input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploadMutation.isPending}
          />
          <Label htmlFor="avatar-upload">
            <Button variant="outline" disabled={uploadMutation.isPending} type="button">
              {file ? file.name : 'Choose File'}
            </Button>
          </Label>
        </div>
        <Button
          onClick={handleUpload}
          disabled={!file || uploadMutation.isPending}
        >
          {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Upload
        </Button>
      </div>
    </div>
  );
}
