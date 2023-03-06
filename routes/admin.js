var express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController')
const productController = require('../controller/productController')
const session=require('../middleware/sessions')
const upload=require('../middleware/multer');
const { Router } = require('express');
const orderController=require('../controller/orderController');
const exporter=require('../config/pdffile')

router.get('/',adminController.adminLogIn);

router.post('/adminhome',adminController.adminPost);

router.get('/adminhome',session.adminSession,adminController.adminHome);

router.get('/logout',adminController.adminLogout);

router.get('/users',session.adminSession,adminController.usersList);

router.get('/categories',session.adminSession,adminController.categoryLists);

router.get('/completedorders',session.adminSession,adminController.orderDetails);

router.get('/blockusers/:id',session.adminSession,adminController.userBlock);

router.get('/unblockusers/:id',session.adminSession,adminController.userUnblock);

router.post('/addcategory',session.adminSession,adminController.addCategory);

router.get('/deletecategory/:id',session.adminSession,adminController.deleteCategory);

router.get('/Activecategory/:id',session.adminSession,adminController.ActiveCategory);

router.post('/bannercarousal/:id',session.adminSession,upload.array('carousalimage',3),adminController.bannerUpdateCarousal)

router.post("/bannercontainer/:id",session.adminSession,upload.array('containerimage',1),adminController.bannerUpdateContainer)

router.post('/bannerimage/:id',session.adminSession,upload.array('image',3),adminController.bannerUpdateImage);
// sales reprt
router.get('/download/:year/:month',session.adminSession,exporter.exportOrders)
// products 

router.get('/addproduct',session.adminSession,productController.addProduct);

router.get('/products',session.adminSession,productController.productDetails);

router.post('/productsadd',session.adminSession,upload.array('images',6),productController.productsAdd);

router.get('/editproduct/:id',session.adminSession,productController.editProductRender);

router.post('/productedit/:id',session.adminSession,productController.productEdit)

router.post('/editimage/:id/:imageId',session.adminSession,upload.single('images'),productController.imageEdit);

router.post('/addimage/:id',session.adminSession,upload.single('images'),productController.addImage);

router.get('/deleteimage/:id/:imageid',session.adminSession,productController.deleteImage)

// coupons

router.get("/coupons",session.adminSession,adminController.couponRender);

router.post('/addcoupon',session.adminSession,adminController.addCoupon);

router.post('/editcoupon/:id',session.adminSession,adminController.editCoupon);

router.get('/deleteCoupon/:id',session.adminSession,adminController.deleteCoupon);

router.get('/restoreCoupon/:id',session.adminSession,adminController.restoreCoupon);

//order management

router.get('/order',session.adminSession,orderController.getOrders)

router.get('/orderedProduct/:id',session.adminSession,orderController.getOrderedProduct)

router.post('/orderStatuschange/:id',session.adminSession,orderController.orderStatusChanging)


module.exports = router;
