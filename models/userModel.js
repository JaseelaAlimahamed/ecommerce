const mongoose = require('mongoose');
const Scheme = mongoose.Schema
const userScheme = new Scheme({
    username: String,
    email: {
        type: String,
        require: true,
        unique: true,
    },
    gender: String,
    password: String,
    address: [{
        name: String,
        housename: String,
        place: String,
        post: String,
        dist: String,
        state: String,
        pin: Number,
        phone: Number
    }],
    status: Boolean,
});


const user = mongoose.model('user', userScheme);


module.exports = user;

