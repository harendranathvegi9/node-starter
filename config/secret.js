module.exports = {

  database: process.env.DATABASE || 'mongodb://localhost/nodestarter',
  port: process.env.PORT || 3030,
  secret: process.env.SECRET || 'NODESTARTERISTHEBEAST1992',
  // Social

  facebook: {
    clientID: process.env.FACEBOOK_ID || '1763486533889891', // Test Key
    clientSecret: process.env.FACEBOOK_SECRET || '0e3bdcd58f43a0b29139e9cd9f5d0dd4', // Test Secret
    profileFields: ['emails', 'displayName'],
    callbackURL: 'http://localhost:3030/auth/facebook/callback',
    passReqToCallback: true

  },

  sendgrid: process.env.SENDGRID_API_KEY || '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'
}
