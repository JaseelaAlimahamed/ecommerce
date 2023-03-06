const mongoose = require('mongoose');
const category = require('./catogeryModel');
const Schema = mongoose.Schema;
const productScheme = new Schema({
    productname : String,
    category : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'category'
    },
    size:String,
    weight:String,
    description:String,
    Orginalprice:String,
    discounts: String,
    price:Number,
    stock:Number,
    company: String,
    image:[{
        path:String
    }],
    status :Boolean,
},
{timestamps:true});
const product = mongoose.model('product',productScheme);

module.exports = product;