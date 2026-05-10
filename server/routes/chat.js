const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// Save a chat message
router.post('/', protect, async (req, res) => {
  try {
    const { bookingId, recipientId, message, type = 'text' } = req.body;

    // Verify booking exists and user is part of it
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify sender is either customer or provider
    if (booking.customer.toString() !== req.user._id.toString() && 
        booking.provider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to send messages for this booking' });
    }

    // Verify recipient is the other party
    const recipientIdStr = recipientId.toString();
    if (recipientIdStr !== booking.customer.toString() && 
        recipientIdStr !== booking.provider?.toString()) {
      return res.status(400).json({ message: 'Invalid recipient' });
    }

    // Create chat message
    const chat = new Chat({
      booking: bookingId,
      sender: req.user._id,
      recipient: recipientId,
      message,
      type
    });

    await chat.save();

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({ message: 'Failed to save message' });
  }
});

// Get chat messages for a booking
router.get('/booking/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Verify booking exists and user is part of it
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user is either customer or provider
    if (booking.customer.toString() !== req.user._id.toString() && 
        booking.provider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view messages for this booking' });
    }

    // Get all messages for this booking
    const messages = await Chat.find({ booking: bookingId })
      .populate('sender', 'name email')
      .populate('recipient', 'name email')
      .sort({ createdAt: 1 });

    // Mark messages as read if the user is the recipient
    await Chat.updateMany(
      { 
        booking: bookingId, 
        recipient: req.user._id, 
        read: false 
      },
      { 
        read: true, 
        readAt: new Date() 
      }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Mark messages as read
router.patch('/:messageId/read', protect, async (req, res) => {
  try {
    const { messageId } = req.params;

    const chat = await Chat.findById(messageId);
    if (!chat) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify user is the recipient
    if (chat.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }

    chat.read = true;
    chat.readAt = new Date();
    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
});

// Get unread message count
router.get('/unread/count', protect, async (req, res) => {
  try {
    const unreadCount = await Chat.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({ count: unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

module.exports = router;
