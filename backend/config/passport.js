const passport = require('passport');

// Only set up Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const User = require('../models/User');

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        if (!user.avatar) {
          user.avatar = profile.photos[0]?.value;
          await user.save();
        }
        return done(null, user);
      }

      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        passwordHash: `google_${profile.id}_${Date.now()}`,
        avatar: profile.photos[0]?.value,
        role: 'renter',
        verified: true,
        googleId: profile.id,
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));

  console.log('✅ Google OAuth enabled');
} else {
  console.log('⚠️  Google OAuth disabled (GOOGLE_CLIENT_ID not set)');
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(id);
    done(null, user);
  } catch (err) { done(err, null); }
});

module.exports = passport;