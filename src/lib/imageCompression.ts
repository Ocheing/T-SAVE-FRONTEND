/**
 * Image Compression Utility
 * Compresses images before upload to improve performance
 */

interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeMB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    maxSizeMB: 1,
};

/**
 * Compress an image file before uploading
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Skip compression for small files (under 500KB)
    if (file.size < 500 * 1024) {
        return file;
    }

    // Skip compression for non-image files
    if (!file.type.startsWith('image/')) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
        }

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;
            const maxWidth = opts.maxWidth!;
            const maxHeight = opts.maxHeight!;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to compress image'));
                        return;
                    }

                    // Create new file with compressed data
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    console.log(
                        `[Image Compression] Original: ${(file.size / 1024 / 1024).toFixed(2)}MB, Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
                    );

                    resolve(compressedFile);
                },
                'image/jpeg',
                opts.quality
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        // Read file as data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Create a thumbnail from an image file
 * @param file - The image file
 * @param size - Max size for thumbnail (default 200px)
 * @returns Promise<string> - Base64 data URL for the thumbnail
 */
export async function createThumbnail(file: File, size: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
        }

        img.onload = () => {
            let { width, height } = img;

            if (width > height) {
                if (width > size) {
                    height = (height * size) / width;
                    width = size;
                }
            } else {
                if (height > size) {
                    width = (width * size) / height;
                    height = size;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
}
