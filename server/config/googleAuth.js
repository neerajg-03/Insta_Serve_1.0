const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Configure Google OAuth only if credentials exist
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET
) {
  console.log('✅ Google OAuth credentials found');

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          'https://insta-serve-1-0.onrender.com/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('✅ Google profile received');

          // Check existing Google user
          let user = await User.findOne({
            googleId: profile.id
          });

          if (user) {
            return done(null, user);
          }

          // Check if email already exists
          user = await User.findOne({
            email: profile.emails[0].value
          });

          if (user) {
            user.googleId = profile.id;
            user.authMethod = 'google';
            user.emailVerified = true;

            if (profile.photos[0]?.value) {
              user.profilePicture =
                profile.photos[0].value;
            }

            await user.save();

            return done(null, user);
          }

          // For new users, create with placeholder values that will be updated via completion flow
          const newUser = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            profilePicture:
              profile.photos[0]?.value || '',
            authMethod: 'google',
            emailVerified: true,
            password:
              Math.random().toString(36).slice(-8) +
              'Google123!',
            phone: '9999999999', // Placeholder - will be updated
            role: 'customer' // Placeholder - will be updated
          });

          await newUser.save();

          console.log(
            '✅ New Google user created with placeholder data - awaiting completion'
          );

          return done(null, newUser);
        } catch (error) {
         console.error('FULL GOOGLE ERROR');
         console.error(JSON.stringify(error, null, 2));

          return done(error, null);
        }
      }
    )
  );
} else {
  console.log(
    '⚠️ Google OAuth credentials not found'
  );
}

module.exports = passport;
