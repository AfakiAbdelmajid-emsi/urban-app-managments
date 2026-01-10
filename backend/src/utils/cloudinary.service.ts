import { Injectable, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  onModuleInit() {
    // Initialize Cloudinary configuration
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'alert-photos',
          resource_type: 'image',
          format: 'jpg',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('❌ [CLOUDINARY] Upload error:', error);
            reject(error);
          } else if (result) {
            console.log(`✅ [CLOUDINARY] Upload successful: ${result.secure_url}`);
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        },
      );

      // Convert buffer to stream
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      bufferStream.pipe(uploadStream);
    });
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract public_id from Cloudinary URL
      // Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
      // We need to extract the public_id including the folder path
      if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
        console.warn('⚠️ [CLOUDINARY] Invalid Cloudinary URL:', imageUrl);
        return;
      }

      // Try to extract public_id from URL
      const urlParts = imageUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1 || uploadIndex >= urlParts.length - 1) {
        console.warn('⚠️ [CLOUDINARY] Could not parse Cloudinary URL:', imageUrl);
        return;
      }

      // Get the part after 'upload' - format: v{version}/{public_id}.{format}
      const afterUpload = urlParts.slice(uploadIndex + 1).join('/');
      // Remove version prefix (v1234567890) if present
      const withoutVersion = afterUpload.replace(/^v\d+\//, '');
      // Remove file extension to get public_id
      const publicId = withoutVersion.replace(/\.[^/.]+$/, '');

      if (!publicId) {
        console.warn('⚠️ [CLOUDINARY] Could not extract public_id from URL:', imageUrl);
        return;
      }

      await cloudinary.uploader.destroy(publicId);
      console.log(`✅ [CLOUDINARY] Deleted image: ${publicId}`);
    } catch (error) {
      console.error('❌ [CLOUDINARY] Delete error:', error);
      // Don't throw - continue even if delete fails
    }
  }
}

