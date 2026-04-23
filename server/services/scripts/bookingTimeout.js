const cron = require('node-cron');
const Booking = require('../models/Booking');

// Function to check and expire broadcast bookings
const checkExpiredBroadcastBookings = async () => {
  try {
    console.log('Checking for expired broadcast bookings...');
    
    // Find broadcast bookings that were sent more than 5 minutes ago and are still in broadcast status
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    
    const expiredBookings = await Booking.find({
      status: 'broadcast',
      broadcastSentAt: { $exists: true, $lt: fiveMinutesAgo }
    }).populate('customer', 'name email')
      .populate('service', 'title category');

    if (expiredBookings.length === 0) {
      console.log('No expired broadcast bookings found.');
      return;
    }

    console.log(`Found ${expiredBookings.length} expired broadcast bookings to process.`);

    // Process each expired booking
    for (const booking of expiredBookings) {
      try {
        // Update booking status to cancelled
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancellationReason = 'Booking expired - No provider accepted within 5 minutes';
        booking.cancelledBy = null; // System cancelled
        
        // Add timeline entry
        booking.timeline.push({
          status: 'cancelled',
          timestamp: new Date(),
          note: 'Booking automatically cancelled - No provider accepted within 5 minutes',
          updatedBy: null // System action
        });

        await booking.save();
        
        console.log(`Cancelled expired booking ${booking._id} for customer ${booking.customer?.name} - Service: ${booking.service?.title}`);
        
        // TODO: Send notification to customer about booking expiry
        // This could be implemented later with email/SMS notifications
        
      } catch (error) {
        console.error(`Error processing expired booking ${booking._id}:`, error);
      }
    }

    console.log(`Successfully processed ${expiredBookings.length} expired broadcast bookings.`);
    
  } catch (error) {
    console.error('Error checking expired broadcast bookings:', error);
  }
};

// Schedule the cron job to run every minute
const startBookingTimeoutCron = () => {
  console.log('Starting booking timeout cron job (runs every minute)...');
  
  // Run every minute to check for expired bookings
  cron.schedule('* * * * *', async () => {
    await checkExpiredBroadcastBookings();
  });
  
  // Also run once immediately on startup to catch any expired bookings
  checkExpiredBroadcastBookings();
};

module.exports = {
  startBookingTimeoutCron,
  checkExpiredBroadcastBookings
};
