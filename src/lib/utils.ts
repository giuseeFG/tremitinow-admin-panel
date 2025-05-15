import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseImg(filename: string | null | undefined): string | null {
    if (!filename) {
        return null;
    }
    if (filename.includes('picsum.photo') ||
        filename.includes('platform-lookaside') ||
        filename.includes('googleusercontent') ||
        filename.includes('firebasestorage.googleapis') ||
        filename.includes('storage.googleapis.com') ||
        filename.includes('placehold.co')) { // Added placehold.co here
        return filename;
    }
    if (filename.startsWith('https://') || filename.startsWith('http://')) { // Added http://
        return filename;
    }
    // Ensure NEXT_PUBLIC_CDN is available and not undefined
    const cdnBase = process.env.NEXT_PUBLIC_CDN;
    if (!cdnBase) {
        console.warn('NEXT_PUBLIC_CDN is not defined. Cannot construct full image URL for:', filename);
        return null; // Or return a default placeholder
    }
    return `${cdnBase}/${filename.startsWith('/') ? filename.substring(1) : filename}`;
}
