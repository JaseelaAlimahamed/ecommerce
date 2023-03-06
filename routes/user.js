const { Router } = require('express');
const express = require('express');
const router = express.Router();
const userController=require('../controller/userController');
const session= require('../middleware/sessions');
const orderController=require('../controller/orderController');

/* GET home page. */
router.get('/',userController.userIndex);

router.get('/signin',session.userSession,userController.signInRender);

router.get('/signup',session.userSession,userController.signUpRender);

router.get('/otp',session.userSession,userController.otpPage);

router.post('/register',session.userSession,userController.userSignup);

router.post('/verifyOTP',userController.verifyOTP);

router.post('/resendOtp',userController.resendOTP)

router.post('/logIn',userController.loginVarification);

router.get('/logout',userController.userLogout);

router.get('/profile/:id',session.userSessionLogin,userController.profileRender);

router.post('/editProfile/:id',session.userSessionLogin,userController.editProfile);

router.post('/addaddress/:id',session.userSessionLogin,userController.addAddress)

router.get('/spectacular/:catogoryname/:id',userController.categoryHome);

router.post('/search',userController.searchProduct)

router.get('/addcart/:id',session.userSessionLogin,userController.addToCart);

router.get('/product/:id',userController.productRender)

router.get('/deleteaddress/:id',session.userSessionLogin,userController.deleteAddress)

router.get('/cart/:id',session.userSessionLogin,userController.cartRender)

router.get('/deletecart/:id/:_id',session.userSessionLogin,userController.removeCartItem);

router.post('/changeQuantity',session.userSessionLogin,userController.changeQuantity);

//checkout page and order management

router.get('/checkout',session.userSessionLogin,userController.checkoutRender);

router.post("/placeOrder", session.userSessionLogin,orderController.placeOrder);

router.post("/verifyPayment",session.userSessionLogin,orderController.verifyPayment);

router.get('/order', session.userSessionLogin,orderController.orderDetails);

router.get('/orderSuccess',session.userSessionLogin,orderController.orderSuccess)

router.get('/orderedProduct/:id',session.userSessionLogin,orderController.orderedProduct);

router.get('/cancelOrder/:id',session.userSessionLogin,orderController.cancelOrder);

module.exports = router;
