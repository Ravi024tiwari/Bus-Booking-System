import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Uploads a file buffer directly to Cloudinary from memory.
 * This avoids writing temporary files to server disk.
 *
 * @param fileBuffer The Buffer representing the uploaded file
 * @param folder The target directory name in Cloudinary (e.g. 'profiles')
 * @returns The secure URL of the uploaded asset
 */
export async function uploadToCloudinary(fileBuffer: Buffer, folder: string = 'profiles'): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // Auto-detect format (PNG, JPG, etc.)
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned an empty response.'));
        }
        resolve(result.secure_url);
      }
    );

    // End the write stream with the buffer content
    uploadStream.end(fileBuffer);
  });
}
