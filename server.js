/* Strictly only for building websites */

/* Module dependecies */
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const expressValidator = require('express-validator');
const ejs = require('ejs');
const engine = require('ejs-mate');

/* Custom module */
const config = require('./config/secret');
const passportConf = require('./config/passport');

/* Instance of express / create express server */
const app = express();

mongoose.connect(config.database, function(err) {
  if (err) {
    console.log("Error connected");
  } else {
    console.log("Connected to the database");
  }
});

/* Middleware */
app.use(express.static(__dirname + '/public'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(morgan('dev')); // Set to dev for debugging
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.secret,
  store: new MongoStore({ url: config.database, autoReconnect: true })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});

const mainRoute = require('./routes/main');
const userRoute = require('./routes/user');
/* App routes */
mainRoute(app);
userRoute(app);

app.listen(config.port, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log(`Running on port ${config.port}`);
  }
});
