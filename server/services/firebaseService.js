const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: You need to set up a Firebase project and download the service account key
// For now, we'll use a placeholder - you'll need to replace this with actual Firebase credentials
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    // Check if Firebase credentials are available
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      console.warn('⚠️ Firebase service account key not found in environment variables');
      console.warn('⚠️ Push notifications will not work until FIREBASE_SERVICE_ACCOUNT_KEY is set');
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
  }
}

// Send push notification to a specific user
async function sendPushNotification(userId, title, body, data = {}) {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    if (!firebaseInitialized) {
      console.warn('⚠️ Firebase not initialized, cannot send push notification');
      return { success: false, message: 'Firebase not initialized' };
    }

    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user || !user.pushToken) {
      console.warn(`⚠️ No push token found for user: ${userId}`);
      return { success: false, message: 'No push token found' };
    }

    const message = {
      token: user.pushToken,
      notification: {
        title,
        body
      },
      data: data,
      android: {
        notification: {
          channelId: 'default',
          priority: 'high'
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Push notification sent to user ${userId}:`, response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    
    // If token is invalid, remove it from user
    if (error.code === 'messaging/registration-token-not-registered') {
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, { pushToken: null });
      console.log(`🗑️ Removed invalid push token for user: ${userId}`);
    }
    
    return { success: false, error: error.message };
  }
}

// Send push notification to multiple users
async function sendPushNotificationToMultiple(userIds, title, body, data = {}) {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    if (!firebaseInitialized) {
      console.warn('⚠️ Firebase not initialized, cannot send push notifications');
      return { success: false, message: 'Firebase not initialized' };
    }

    const User = require('../models/User');
    const users = await User.find({ _id: { $in: userIds }, pushToken: { $ne: null } });

    if (users.length === 0) {
      console.warn('⚠️ No users with valid push tokens found');
      return { success: false, message: 'No valid push tokens found' };
    }

    const messages = users.map(user => ({
      token: user.pushToken,
      notification: {
        title,
        body
      },
      data: data,
      android: {
        notification: {
          channelId: 'default',
          priority: 'high'
        }
      }
    }));

    const response = await admin.messaging().sendAll(messages);
    console.log(`✅ Sent ${response.successCount} push notifications successfully`);
    
    if (response.failureCount > 0) {
      console.warn(`⚠️ Failed to send ${response.failureCount} push notifications`);
      // Remove invalid tokens
      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].success) {
          const error = responses[i].error;
          if (error.code === 'messaging/registration-token-not-registered') {
            await User.findByIdAndUpdate(users[i]._id, { pushToken: null });
          }
        }
      }
    }

    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending push notifications:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeFirebase,
  sendPushNotification,
  sendPushNotificationToMultiple
};
