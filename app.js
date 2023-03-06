var createError = require('http-errors');
var express = require('express');
var path = require('path');
require('dotenv').config()
const cookieParser=require("cookie-parser");
const sessions=require("express-session");
const nocache = require("nocache");
var logger = require('morgan');


const db=require('./config/connection')
db();

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(sessions({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized:true,
  cookie: { maxAge: 600000 },
  resave: false 
}));

app.use(nocache());

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
// const PORT= 3000
// app.listen(PORT,()=>{
//   console.log("ENTER")
// }
// )
module.exports = app;
