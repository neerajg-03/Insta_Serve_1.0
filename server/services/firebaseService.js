let admin = null;
let firebaseInitialized = false;

// Try to load firebase-admin, but don't crash if it's not installed
try {
  admin = require('firebase-admin');
} catch (error) {
  console.warn('⚠️ firebase-admin module not found. Push notifications will be disabled.');
  console.warn('⚠️ To enable push notifications, run: npm install firebase-admin');
}

// Initialize Firebase Admin SDK
// Note: You need to set up a Firebase project and download the service account key
// For now, we'll use a placeholder - you'll need to replace this with actual Firebase credentials
function initializeFirebase() {
  if (!admin) {
    console.warn('⚠️ firebase-admin not installed, skipping Firebase initialization');
    return;
  }

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
  // If firebase-admin is not installed, just log and return
  if (!admin) {
    console.log(`📤 [PUSH] Would send push notification to user ${userId}: ${title} - ${body}`);
    console.log('📤 [PUSH] (firebase-admin not installed, notification not sent)');
    return { success: false, message: 'firebase-admin not installed' };
  }

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
        priority: 'high',
        ttl: 2419200, // 28 days in seconds
        notification: {
          channelId: 'default',
          priority: 'high',
          sound: 'default',
          visibility: 'public'
        }
      },
      apns: {
        headers: {
          'apns-priority': '10'
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'interruption-level': 'active'
          }
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
  // If firebase-admin is not installed, just log and return
  if (!admin) {
    console.log(`📤 [PUSH] Would send push notifications to ${userIds.length} users: ${title} - ${body}`);
    console.log('📤 [PUSH] (firebase-admin not installed, notifications not sent)');
    return { success: false, message: 'firebase-admin not installed' };
  }

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
        priority: 'high',
        ttl: 2419200, // 28 days in seconds
        notification: {
          channelId: 'default',
          priority: 'high',
          sound: 'default',
          visibility: 'public'
        }
      },
      apns: {
        headers: {
          'apns-priority': '10'
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'interruption-level': 'active'
          }
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
