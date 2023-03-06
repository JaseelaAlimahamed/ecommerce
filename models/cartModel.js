const mongoose = require('mongoose');
const Scheme = mongoose.Schema
const cartScheme = new Scheme({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user'
    },
    product :[ {
        productId:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'product'
    },
    quantity : Number
    }],
});

const cart = mongoose.model('cart', cartScheme);

module.exports = cart;