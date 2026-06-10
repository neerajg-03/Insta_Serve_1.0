const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => {
      // Use different folders based on the route
      if (req.originalUrl.includes('kyc')) {
        return 'kyc-verification';
      } else if (req.originalUrl.includes('profile')) {
        return 'profile-pictures';
      } else if (req.originalUrl.includes('voice')) {
        return 'voice-notes';
      }
      return 'uploads';
    },
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' }, // Limit image size
      { quality: 'auto' } // Auto-optimize quality
    ]
  }
});

module.exports = {
  cloudinary,
  storage
};
