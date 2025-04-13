import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload an image to Supabase Storage and return the public URL
 */
export async function uploadImage(
  file: File,
  bucket: string = 'posts',
  folder: string = 'images'
): Promise<{ url: string; error: Error | null }> {
  try {
    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL for the uploaded file
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      url: '',
      error: error as Error,
    };
  }
}

/**
 * Upload multiple images to Supabase Storage and return their public URLs
 */
export async function uploadMultipleImages(
  files: File[],
  bucket: string = 'posts',
  folder: string = 'images'
): Promise<{ urls: string[]; errors: Error[] }> {
  const results = await Promise.all(
    files.map((file) => uploadImage(file, bucket, folder))
  );

  const urls = results.filter(result => !result.error).map(result => result.url);
  const errors = results.filter(result => result.error).map(result => result.error as Error);

  return { urls, errors };
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(
  url: string,
  bucket: string = 'posts'
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Extract the file path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === bucket);
    
    if (bucketIndex === -1) {
      throw new Error('Invalid URL format: cannot find bucket in path');
    }
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    // Delete the file from Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('Error deleting image:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
}
