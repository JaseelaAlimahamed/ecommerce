const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const categoryScheme = new Schema({
    categoryname: {type:String,
        unique:true},
    status:Boolean
});
const category = mongoose.model('category', categoryScheme);

module.exports = category;