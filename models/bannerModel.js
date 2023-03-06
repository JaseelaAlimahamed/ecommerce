const { text } = require('express');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bannerScheme = new Schema({
    carousalhead1: String,
    carousalhead2: String,
    carousalhead3: String,
    
    carousalbody1:String,
    carousalbody2:String,
    carousalbody3:String,
    carousalimage:[String],

    containerimage:[String],
    containertext:String,

    image:[String],

});
const banner= mongoose.model('banner', bannerScheme);

module.exports = banner;