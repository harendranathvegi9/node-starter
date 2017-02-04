const request = require('request');
const async = require('async');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const config = require('./secret');
const User = require('../models/user');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
},
function(req, email, password, done) {

  User.findOne({ email: email }, function(err, user) {

    if (err) {
      return done(err);
    }

    if (!user) {
      return done(null, false, req.flash('loginMessage', "User doesn't exist"));
    }
    
    if (!user.comparePassword(password)) {
      return done(null, false, req.flash('loginMessage', 'Oops! Wrong password'));
    }

    return done(null, user);
  });
}));

passport.use(new FacebookStrategy(config.facebook, function(req, token, refreshToken, profile, done) {
  User.findOne({ facebook: profile.id }, function(err, user) {
    if (err) return done(err);
    if (user) {
      return done(null, user);
    } else {
      var newUser = new User();
      newUser.email = profile._json.email;
      newUser.facebook = profile.id;
      newUser.tokens.push({ kind: 'facebook', token: token });
      newUser.profile.name = profile.displayName;
      newUser.profile.photo = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
      newUser.save(function(err) {
        if (err) throw err;
        return done(null, user);
      });
    }
  });
}));

exports.emailToMailchimp = function(user, done) {
  request({
    url: 'https://us13.api.mailchimp.com/3.0/lists/42c5aa2eca/members',
    method: 'POST',
    headers: {
      'Authorization': 'randomUser 26a187a7c52557aa4ee09fa64f4a3d61-us13',
      'Content-Type': 'application/json'
    },
    json: {
      'email_address': user.email,
      'status': 'subscribed'
    }
  }, function(err, response, body) {
    if (err) {
      return done(err);
    } else {
      console.log("success");
      return done(null, user);
    }
  });
}

exports.isAuthenticated = function(req, res, next) {

  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}
