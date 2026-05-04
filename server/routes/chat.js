const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');

// Utility function to check access
const hasChatAccess = (booking, userId) => {
  const userIdStr = userId.toString();

  const isCustomer = booking.customer?.toString() === userIdStr;
  const isProvider = booking.provider?.toString() === userIdStr;

  const isInBroadcastList = booking.broadcastTo?.some(
    id => id.toString() === userIdStr
  );

  const isBroadcastAcceptor =
    booking.broadcastAcceptedBy?.toString() === userIdStr;

  return {
    isCustomer,
    isProvider,
    isInBroadcastList,
    isBroadcastAcceptor,
    hasAccess:
      isCustomer || isProvider || isInBroadcastList || isBroadcastAcceptor,
  };
};

// ===================== GET MESSAGES =====================
router.get('/messages/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const access = hasChatAccess(booking, userId);

    if (!access.hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Not part of this booking',
      });
    }

    const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        bookingId,
        recipientId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
    });
  }
});

// ===================== SEND MESSAGE =====================
router.post('/send', protect, async (req, res) => {
  try {
    const { bookingId, message, type = 'text' } = req.body;
    const senderId = req.user._id;

    if (!bookingId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const access = hasChatAccess(booking, senderId);

    if (!access.hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Cannot send message',
      });
    }

    // 🔥 Determine recipient properly
    let recipientId;
    let recipientName = 'User';

    if (req.user.role === 'customer') {
      if (!booking.provider) {
        return res.status(400).json({
          success: false,
          message: 'No provider assigned yet',
        });
      }

      recipientId = booking.provider;

      const Provider = require('../models/Provider');
      const provider = await Provider.findById(booking.provider);
      recipientName = provider?.name || 'Provider';
    } else {
      recipientId = booking.customer;

      const User = require('../models/User');
      const customer = await User.findById(booking.customer);
      recipientName = customer?.name || 'Customer';
    }

    // ✅ Create message (ObjectId safe)
    const newMessage = new Message({
      bookingId,
      senderId,
      senderName: req.user.name,
      recipientId,
      recipientName,
      message: message.trim(),
      type,
      senderRole: req.user.role,
    });

    await newMessage.save();

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      const bookingRoom = `booking_${bookingId}`;
      io.to(bookingRoom).emit('receive_message', newMessage);
    }

    res.json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
    });
  }
});

// ===================== UNREAD COUNT =====================
router.get('/unread-count', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Message.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error('❌ Error unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
    });
  }
});

// ===================== MARK AS READ =====================
router.post('/mark-read/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const access = hasChatAccess(booking, userId);

    if (!access.hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const result = await Message.updateMany(
      {
        bookingId,
        recipientId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      data: { markedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error('❌ Error mark read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages',
    });
  }
});

// ===================== DELETE HISTORY =====================
router.delete('/history/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only allowed after completion',
      });
    }

    const access = hasChatAccess(booking, userId);

    if (!access.hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const result = await Message.deleteMany({ bookingId });

    res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error('❌ Error deleting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat',
    });
  }
});

module.exports = router;
