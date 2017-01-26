const passport = require('passport');

const passportConf = require('../config/passport');
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
        const user = new User({
          email: email,
          password: password
        });

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

  /* PROFILE ROUTE && GET METHOD*/
  app.get('/profile', passportConf.isAuthenticated, function(req, res, next) {
    res.render('accounts/profile', { user: req.user });
  });


}
