const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User           = require('../models/User');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️  Google OAuth disabled (GOOGLE_CLIENT_ID not set)');
} else {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({ email });

      if (user) {
        // Existing user — update avatar if not set
        if (!user.avatar) {
          user.avatar = profile.photos[0]?.value;
          await user.save();
        }
        return done(null, user);
      }

      // New user via Google — canRent default, onboarding not complete
      user = await User.create({
        name:               profile.displayName,
        email,
        passwordHash:       `google_${profile.id}_${Date.now()}`,
        avatar:             profile.photos[0]?.value,
        googleId:           profile.id,
        verified:           true,
        type:               'user',
        canRent:            true,
        canList:            false,
        onboardingComplete: false,
        role:               'renter', // legacy sync
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

passport.serializeUser((user, done)   => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try   { done(null, await User.findById(id)); }
  catch (err) { done(err, null); }
});

module.exports = passport;