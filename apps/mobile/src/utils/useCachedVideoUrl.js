import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';

export function useCachedVideoUrl(url) {
  const [cachedUrl, setCachedUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!url) return;

    const cacheVideo = async () => {
      try {
        // Extract filename from URL (e.g. from cloudinary)
        const parts = url.split('/');
        const filename = parts[parts.length - 1].split('?')[0]; // remove query params if any
        
        // Simple hash replacement to avoid invalid chars
        const safeFilename = filename.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileUri = `${FileSystem.cacheDirectory}${safeFilename}`;

        const info = await FileSystem.getInfoAsync(fileUri);
        
        if (info.exists) {
          // File is already cached
          if (isMounted) setCachedUrl(fileUri);
        } else {
          // Download and cache it
          const download = await FileSystem.downloadAsync(url, fileUri);
          if (isMounted) setCachedUrl(download.uri);
        }
      } catch (err) {
        console.error('Error caching video:', err);
        // Fallback to original URL if caching fails
        if (isMounted) setCachedUrl(url);
      }
    };

    cacheVideo();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return cachedUrl;
}
