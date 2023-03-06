const { response } = require('express');
const user = require('../models/userModel');
const category = require('../models/catogeryModel')
const dotenv = require('dotenv');
const session = require('express-session');
const product = require('../models/productModel');
const { body, validationResult } = require('express-validator');
const multer = require("multer");
const storage = multer.memoryStorage();

const path = require("path");
dotenv.config();



module.exports = {
  addProduct: async (req, res) => {
    let categories = await category.find()
    res.render('addProduct', { categories })

  },
  productDetails: async (req, res) => {
    const products = await product.find().populate('category')

    res.render('productDetails', { products })

  },
 

addImage: async (req, res) => {
  try {
    const productId = req.params.id;
    const imageFile = req.file;

    const result = await product.updateOne(
      { _id: productId },
      { $push: { image: { path: imageFile.filename } } }
    );
    res.redirect('/admin/products')
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
},
deleteImage: async (req, res) => {
  try {
    const productId = req.params.id;
    const imageId = req.params.imageid;

    const result = await product.updateOne(
      { _id: productId },
      { $pull: { image: { _id: imageId} } }
    );

    res.redirect('/admin/products')
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
},

  productsAdd: async (req, res) => {
    let categoryId = req.body.category;
    console.log(req.files);

    // let image = req.files.map((obj)=>{
    //   return obj?.filename
    // })
    const images = req.files.map(file => ({ path: file.filename }));

    let Orginalprice = req.body.price;
    let discount = req.body.discount;
    let DiscountAmount = (Orginalprice * discount / 100);
    let price = Orginalprice - DiscountAmount;

    const newproduct = new product({
      productname: req.body.name,
      category: categoryId,
      size: req.body.size,
      weight: req.body.weight,
      description: req.body.description,
      Orginalprice: Orginalprice,
      discounts: discount,
      stock: req.body.stock,
      price: price,
      company: req.body.company,
      image: images,
      status: true,
    });

    newproduct
      .save()
      .then(function () {
        res.redirect("/admin/products");
        console.log("product added succesfully");
      })
      .catch((err) => {
        console.log(err + "product adding failed");
      });


  },

  editProductRender: async (req, res) => {

    let Product = await product.findOne({ _id: req.params.id }).populate('category')

    let categories = await category.find()

    res.render('productEdit', { Product, categories })

  },
  productEdit: async (req, res) => {
    try {
      // Validate and sanitize input fields
      await body('name').trim().escape().run(req);
      await body('category').trim().escape().run(req);
      await body('size').trim().escape().run(req);
      await body('weight').trim().escape().run(req);
      await body('description').trim().escape().run(req);
      await body('stock').toInt().run(req);
      await body('company').trim().escape().run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let categoryId = req.body.category;
      let originalPrice = req.body.price;
      let discount = req.body.discount;
      let discountAmount = (originalPrice * discount / 100);
      let price = originalPrice - discountAmount;

      await product.updateOne({ _id: req.params.id }, {
        $set: {
          productname: req.body.name,
          category: categoryId,
          size: req.body.size,
          weight: req.body.weight,
          description: req.body.description,
          stock: req.body.stock,
          originalPrice: originalPrice,
          discounts: discount,
          price: price,
          company: req.body.company,
          status: true
        }
      });

      res.redirect('/admin/products');
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  },


  imageEdit: async (req, res) => {
    try {
      const productId = req.params.id;
      const imageId = req.params.imageId;
      const imageFile = req.file;
      console.log(productId);
      console.log(imageId);
      // update the image with the new file data
      const result = await product.updateOne(
        { _id: productId, 'image._id': imageId },
        { $set: { 'image.$.path': imageFile.filename } }
      );
      res.redirect('/admin/products');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  },







}