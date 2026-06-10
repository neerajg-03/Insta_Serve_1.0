const express = require('express');
const multer = require('multer');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { storage, cloudinary } = require('../config/cloudinary');

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Verify document number before KYC submission
router.post('/kyc/verify', protect, async (req, res) => {
  try {
    const { documentType, documentNumber } = req.body;

    if (!documentType || !documentNumber) {
      return res.status(400).json({ 
        message: 'Document type and number are required' 
      });
    }

    if (!['aadhar', 'pan'].includes(documentType)) {
      return res.status(400).json({ 
        message: 'Document type must be aadhar or pan' 
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is a provider
    if (user.role !== 'provider') {
      return res.status(403).json({ 
        message: 'Only providers can verify KYC documents' 
      });
    }

    // Check if document number already exists
    let existingUser;

    if (documentType === 'pan') {
      // Check both PAN field and kycDocuments array for PAN
      existingUser = await User.findOne({
        $or: [
          { pan: documentNumber },
          {
            'kycDocuments.documentNumber': documentNumber,
            'kycDocuments.documentType': 'pan'
          }
        ],
        role: 'provider',
        _id: { $ne: req.user._id }
      });
    } else if (documentType === 'aadhar') {
      // Check kycDocuments array for Aadhar
      existingUser = await User.findOne({
        'kycDocuments.documentNumber': documentNumber,
        'kycDocuments.documentType': 'aadhar',
        role: 'provider',
        _id: { $ne: req.user._id }
      });
    }

    if (existingUser) {
      return res.status(400).json({ 
        message: `This ${documentType.toUpperCase()} number already exists with another user`,
        available: false
      });
    }

    res.json({
      message: `${documentType.toUpperCase()} number is available`,
      available: true
    });

  } catch (error) {
    console.error('KYC verification error:', error);
    res.status(500).json({ 
      message: 'Verification failed',
      error: error.message 
    });
  }
});

// Upload KYC document
router.post('/upload/kyc-document', protect, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { documentType } = req.body;
    
    if (!documentType) {
      // Clean up uploaded file if document type is missing
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Document type is required' });
    }

    // Create file URL
    const documentUrl = `/uploads/kyc/${req.file.filename}`;

    res.json({
      message: 'Document uploaded successfully',
      documentUrl: documentUrl,
      filename: req.file.filename
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file if error occurred
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: 'Upload failed',
      error: error.message 
    });
  }
});

// Upload KYC verification photo
router.post('/kyc/upload-verification-photo', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    // Cloudinary returns the secure URL in req.file.path or req.file.secure_url
    const photoUrl = req.file.secure_url || req.file.path;

    // Update user's kycVerificationPhoto
    const user = await User.findById(req.user._id);

    if (!user) {
      // Delete uploaded file from Cloudinary if user not found
      await cloudinary.uploader.destroy(req.file.public_id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old photo from Cloudinary if exists
    if (user.kycVerificationPhoto) {
      try {
        // Extract public ID from the URL
        const urlParts = user.kycVerificationPhoto.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split('.')[0];
        await cloudinary.uploader.destroy(`kyc-verification/${publicId}`);
      } catch (err) {
        console.error('Error deleting old photo from Cloudinary:', err);
      }
    }

    user.kycVerificationPhoto = photoUrl;
    await user.save();

    res.json({
      message: 'Verification photo uploaded successfully',
      photoUrl: photoUrl
    });

  } catch (error) {
    console.error('Photo upload error:', error);

    // Clean up uploaded file from Cloudinary if error occurred
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.public_id);
    }

    res.status(500).json({
      message: 'Photo upload failed',
      error: error.message
    });
  }
});

// Submit KYC documents
router.post('/kyc', protect, async (req, res) => {
  try {
    const { documents } = req.body;
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ message: 'Documents are required' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is a provider
    if (user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can submit KYC documents' });
    }

    // Check if KYC is already submitted and approved
    if (user.kycStatus === 'approved') {
      return res.status(400).json({ message: 'KYC already approved' });
    }

    // Validate each document
    for (const doc of documents) {
      if (!doc.documentType || !doc.documentNumber || !doc.documentUrl) {
        return res.status(400).json({ 
          message: 'All documents must have type, number, and URL' 
        });
      }
    }

    // Check for duplicate document numbers across all users
    const documentNumbers = documents.map(doc => doc.documentNumber);
    const existingUsers = await User.find({
      'kycDocuments.documentNumber': { $in: documentNumbers },
      _id: { $ne: req.user._id }
    });

    if (existingUsers.length > 0) {
      const duplicateNumbers = existingUsers.flatMap(user => 
        user.kycDocuments
          .filter(doc => documentNumbers.includes(doc.documentNumber))
          .map(doc => doc.documentNumber)
      );

      return res.status(400).json({ 
        message: `Document number(s) already exist with another user: ${duplicateNumbers.join(', ')}` 
      });
    }

    // Update user's KYC documents and save PAN to pan field
    user.kycDocuments = documents.map(doc => ({
      documentType: doc.documentType,
      documentNumber: doc.documentNumber,
      documentUrl: doc.documentUrl,
      uploadDate: new Date()
    }));

    // Save PAN number to pan field if PAN document is submitted
    const panDoc = documents.find(doc => doc.documentType === 'pan');
    if (panDoc) {
      user.pan = panDoc.documentNumber;
    }

    user.kycStatus = 'pending';
    await user.save();

    res.json({
      message: 'KYC documents submitted successfully',
      kycStatus: user.kycStatus,
      documents: user.kycDocuments
    });

  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({ 
      message: 'KYC submission failed',
      error: error.message 
    });
  }
});

// Get KYC status
router.get('/kyc/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('kycStatus kycDocuments');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      kycStatus: user.kycStatus,
      documents: user.kycDocuments
    });

  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ 
      message: 'Failed to get KYC status',
      error: error.message 
    });
  }
});

// Admin routes for KYC management
router.get('/admin/kyc/pending', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const pendingUsers = await User.find({
      role: 'provider',
      kycStatus: 'pending'
    }).select('name email phone kycDocuments kycStatus createdAt');

    res.json({
      pendingUsers,
      count: pendingUsers.length
    });

  } catch (error) {
    console.error('Get pending KYC error:', error);
    res.status(500).json({ 
      message: 'Failed to get pending KYC applications',
      error: error.message 
    });
  }
});

// Get all KYC applications (pending, approved, rejected)
router.get('/admin/kyc/all', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status } = req.query;
    let filter = { role: 'provider' };
    
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.kycStatus = status;
    }

    const users = await User.find(filter)
      .select('name email phone kycDocuments kycStatus kycRejectionReason createdAt')
      .sort({ createdAt: -1 });

    res.json({
      users,
      count: users.length
    });

  } catch (error) {
    console.error('Get all KYC error:', error);
    res.status(500).json({ 
      message: 'Failed to get KYC applications',
      error: error.message 
    });
  }
});

// Serve uploaded documents
router.get('/uploads/kyc/:filename', protect, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/kyc', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get file extension to determine content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.pdf') contentType = 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);

  } catch (error) {
    console.error('Serve document error:', error);
    res.status(500).json({ 
      message: 'Failed to serve document',
      error: error.message 
    });
  }
});

// Approve/Reject KYC
router.post('/admin/kyc/:userId/review', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, reason } = req.body;
    const { userId } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'provider') {
      return res.status(400).json({ message: 'User is not a provider' });
    }

    user.kycStatus = status;
    
    if (status === 'rejected' && reason) {
      user.kycRejectionReason = reason;
    }

    await user.save();

    res.json({
      message: `KYC ${status} successfully`,
      kycStatus: user.kycStatus
    });

  } catch (error) {
    console.error('KYC review error:', error);
    res.status(500).json({ 
      message: 'KYC review failed',
      error: error.message 
    });
  }
});

module.exports = router;
