import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UploadResult {
  path: string;
  publicUrl: string;
}

export function useStorage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (
    bucket: string,
    filePath: string,
    file: File
  ): Promise<UploadResult> => {
    setUploading(true);
    setProgress(10);
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });
      if (error) throw error;

      setProgress(80);

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);
      return { path: data.path, publicUrl: urlData.publicUrl };
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, []);

  const deleteFile = useCallback(async (bucket: string, path: string): Promise<void> => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  }, []);

  const getPublicUrl = useCallback((bucket: string, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }, []);

  return { uploadFile, deleteFile, getPublicUrl, uploading, progress };
}
