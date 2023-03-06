const express= require('express');
const path =require('path');
const multer =require('multer');
 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public");
    },
    filename: function (req, file, cb) {
      cb(null, `products/${Date.now()}${path.extname(file.originalname)}`);
    },
  });
  
  
  const upload = multer({ storage: storage });
  
  
  module.exports = upload;