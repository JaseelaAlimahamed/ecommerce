const mongoose = require('mongoose');
const Schema   = mongoose.Schema
const ObjectId = Schema.ObjectId
const user=require('../models/userModel')

const orderSchema = new Schema(
    {
        userId:{
           type:ObjectId,
           ref:'user',
           required:true
        },
        name:{
            type:String,
            requiredd:true
        },
        address:{
           type:String,
           required:true
        },
        email:{ 
            type:String,
            required:true
        },
        orderItems:[
            {
                productId:{
                    type:ObjectId,
                    required:true
                },
                quantity:{
                    type:Number,
                    required:true
                },
            }
        ],
        totalAmount:{
            type:Number,
            required:true
        },
        orderStatus:{
            type:String,
            default:"pending"
        },
        paymentMethod:
        {
            type:String,
            required:true
        },
        paymentStatus:{
         type:String,
         default:"not paid"
        },
        orderDate:{
            type:String,
        },
        deliveryDate:{
            type:String
        }
    }, 
    {
        timestamps:true
    }
);

const order= mongoose.model("order",orderSchema)
module.exports = order;