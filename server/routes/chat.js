const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');

// Get all messages for a booking
router.get('/messages/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Verify user is part of this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is either the customer or provider
    const isCustomer = booking.customer?.toString() === userId;
    const isProvider = booking.provider?.toString() === userId;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get messages for this booking
    const messages = await Message.find({ bookingId })
      .sort({ createdAt: 1 });

    // Mark unread messages as read for this user
    await Message.updateMany(
      { 
        bookingId, 
        recipientId: userId, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { bookingId, recipientId, message, type = 'text' } = req.body;
    const senderId = req.user.id;
    const senderName = req.user.name;
    const senderRole = req.user.role;

    // Validate required fields
    if (!bookingId || !recipientId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify booking exists and user is part of it
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is either the customer or provider
    const isCustomer = booking.customer?.toString() === senderId;
    const isProvider = booking.provider?.toString() === senderId;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get recipient details
    let recipientName = 'Unknown';
    if (isCustomer && booking.provider) {
      const Provider = require('../models/Provider');
      const provider = await Provider.findById(booking.provider);
      recipientName = provider?.name || 'Provider';
    } else if (isProvider && booking.customer) {
      const User = require('../models/User');
      const customer = await User.findById(booking.customer);
      recipientName = customer?.name || 'Customer';
    }

    // Create and save message
    const newMessage = new Message({
      bookingId,
      senderId,
      senderName,
      recipientId,
      recipientName,
      message: message.trim(),
      type,
      senderRole
    });

    await newMessage.save();

    // Get socket.io instance to emit real-time message
    const io = require('socket.io');
    const app = require('../index');
    const socketIo = app.get('io');
    
    if (socketIo) {
      // Emit message to booking room
      const messageData = {
        ...newMessage.toObject(),
        timestamp: newMessage.createdAt
      };
      
      const bookingRoom = `booking_${bookingId}`;
      socketIo.to(bookingRoom).emit('receive_message', messageData);
      console.log(`💬 Message emitted to room ${bookingRoom}:`, messageData);
    }

    res.json({
      success: true,
      data: newMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      recipientId: userId,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

// Mark messages as read
router.post('/mark-read/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Verify user is part of this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is either the customer or provider
    const isCustomer = booking.customer?.toString() === userId;
    const isProvider = booking.provider?.toString() === userId;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark unread messages as read
    const result = await Message.updateMany(
      { 
        bookingId, 
        recipientId: userId, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({
      success: true,
      data: { 
        markedCount: result.modifiedCount 
      }
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

// Delete chat history (only when booking is completed)
router.delete('/history/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Verify booking exists and is completed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only allow deletion if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete chat history after booking completion'
      });
    }

    // Check if user is either the customer or provider
    const isCustomer = booking.customer?.toString() === userId;
    const isProvider = booking.provider?.toString() === userId;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete all messages for this booking
    const result = await Message.deleteMany({ bookingId });

    res.json({
      success: true,
      data: { 
        deletedCount: result.deletedCount 
      }
    });

  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat history'
    });
  }
});

module.exports = router;
