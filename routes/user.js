/* MAIN MODULES */
const passport = require('passport');
const async = require('async');
const crypto = require('crypto');
/* CUSTOM MODULES */
const passportConf = require('../config/passport');
const config = require('../config/secret');
const User = require('../models/user');

module.exports = function(app) {

  /* SIGNUP ROUTE */
  app.route('/signup')
  /* GET METHOD */
  .get(function(req, res, next) {
    res.render('accounts/signup', { message: req.flash('errors')});
  })
  /* POST METHOD */
  .post(function(req, res, next) {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    if (password !== req.body.confirmPassword) {
      req.flash('errors', 'Password and Confirm Password doesn"t match');
      return res.redirect('/signup');
    }

    if (!email || !password) {
      req.flash('errors', 'Email address or that password is invalid');
      return res.redirect('/signup');
    }
    // See if a user with the given email exists
    User.findOne({ email: email }, function(err, existingUser) {
      if (err) { return next(err); }
      // If a user with email does exist, return an error
      if (existingUser) {
        req.flash('errors', 'Account with that email address already exists');
        return res.redirect('/signup');
      }
      // If a user with email does NOT exist, create and save user record
      const user = new User();
      user.profile.name = name;
      user.email = email;
      user.password = password;
      user.profile.photo = user.gravatar();

      user.save(function(err) {
        if (err) { return next(err); }
        req.logIn(user, function(err) {
          if (err) return next(err);
          res.redirect('/profile');
        });
      });
    });
  });

  /* LOGIN ROUTE */
  app.route('/login')
  /* GET METHOD */
  .get(function(req, res, next) {
    res.render('accounts/login', { message: req.flash('errors') });
  })

  /* POST METHOD */
  .post(passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }));

  /* FACEBOOK OAUTH */
  app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/login'
  }));

  /* PROFILE ROUTE && GET METHOD*/
  app.get('/profile', passportConf.isAuthenticated, function(req, res, next) {
    res.render('accounts/profile', { user: req.user });
  });

  /* LOGOUT ROUTE */
  app.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
  });

  /* FORGOT PASSWORD ROUTE -- ON HOLD */
  app.route('/forgot')

  .get(function(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/');
    }
    res.render('accounts/forgot', { error: req.flash('errors'), success: req.flash('info')});
  })

  .post((req, res, next) => {

    async.waterfall([
      function createRandomToken(done) {
        crypto.randomBytes(16, (err, buf) => {
          const token = buf.toString('hex');
          done(err, token);
        });
      },
      function setRandomToken(token, done) {
        User.findOne({ email: req.body.email }, (err, user) => {
          if (err) { return done(err); }
          if (!user) {
            req.flash('errors', { message: 'Account with that email address does not exist.' });
            return res.redirect('/forgot');
          }
          user.passwordResetToken = token;
          user.passwordResetExpires = Date.now() + 3600000; // 1 hour
          user.save((err) => {
            done(err, token, user);
          });
        });
      },
      function sendForgotPasswordEmail(token, user, done) {

        const helper = require('sendgrid').mail;
        const from_email = new helper.Email("arashyahaya@gmail.com");
        const to_email = new helper.Email(user.email)
        const subject = "Reset your password on Hackathon Starter";
        const content = new helper.Content("text/plain", `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`);

        const mail = new helper.Mail(from_email, subject, to_email, content);

        const sg = require('sendgrid')(config.sendgrid);
        const request = sg.emptyRequest({
          method: 'POST',
          path: '/v3/mail/send',
          body: mail.toJSON()
        });

        sg.API(request, function(error, response) {
          console.log(response.statusCode);
          console.log(response.body);
          console.log(response.headers);
          done(error);
        });
      }
      ], (err) => {
        if (err) { return next(err); }
        res.redirect('/forgot');
      });
    });


  }
