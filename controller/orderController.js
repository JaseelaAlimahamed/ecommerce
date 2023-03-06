const cart = require("../models/cartModel");
const users = require("../models/userModel");
const order = require("../models/orderModel");
const coupon = require("../models/couponModel");
const category = require('../models/catogeryModel')
const moment = require("moment");
const mongoose = require("mongoose");
const promise = require("promise");
const { adminSession } = require("../middleware/sessions");
const { loginVarification } = require("./userController");
const product = require("../models/productModel");
const instance = require("../config/razorpay");
const crypto = require('crypto');
const { Console } = require("console");

let countInCart;
let countInWishlist;

function checkCoupon(data, id) {
    return new promise((resolve) => {
        if (data.coupon) {
            coupon
                .find(
                    { couponName: data.coupon },
                    { users: { $elemMatch: { userId: id } } }
                )
                .then((exist) => {
                    if (exist[0].users.length) {
                        resolve(true);
                    } else {
                        coupon.find({ couponName: data.coupon }).then((discount) => {
                            resolve(discount);
                        });
                    }
                });
        } else {
            resolve(false);
        }
    });
}

module.exports = {

    placeOrder: async (req, res) => {
        try {
            let invalid;
            let couponDeleted;
            const data = req.body;
            const session = req.session.email;
            const userData = await users.findOne({ email: session.email });
            const cartData = await cart.findOne({ userId: session._id });
            const objId = mongoose.Types.ObjectId(userData._id);
            if (data.coupon) {
                invalid = await coupon.findOne({ couponName: data.coupon });

                if (invalid?.delete == true) {
                    couponDeleted = true;
                }
            } else {
                invalid = 0;
            }

            if (invalid == null) {
                res.json({ invalid: true });
            } else if (couponDeleted) {
                res.json({ couponDeleted: true });
            } else {
                const discount = await checkCoupon(data, objId);

                if (discount == true) {
                    res.json({ coupon: true });
                } else {

                    if (cartData) {


                        const productData = await cart
                            .aggregate([
                                {
                                    $match: { userId: userData._id },
                                },
                                {
                                    $unwind: "$product",
                                },
                                {
                                    $project: {
                                        productItem: "$product.productId",
                                        productQuantity: "$product.quantity",
                                        productCategory: "$Product.category",
                                    },
                                },
                                {
                                    $lookup: {
                                        from: "products",
                                        localField: "productItem",
                                        foreignField: "_id",
                                        as: "productDetail",
                                    },
                                },
                                {
                                    $project: {
                                        productItem: 1,
                                        productQuantity: 1,
                                        productCategory: 1,
                                        productDetail: { $arrayElemAt: ["$productDetail", 0] },
                                    },
                                },
                                {
                                    $addFields: {
                                        productPrice: {
                                            $multiply: ["$productQuantity", "$productDetail.price"],
                                        },
                                    },
                                },
                            ])
                            .exec();

                        

                        const sum = productData.reduce((accumulator, object) => {
                            return accumulator + object.productPrice;
                        }, 0);
                        if (discount == false) {
                            var total = sum;
                        } else {
                            var dis = sum * discount[0].discount;
                            if (dis > discount[0].maxLimit) {
                                total = sum - discount[0].maxLimit;
                            } else {
                                total = sum - dis;
                            }
                        }


                        const orderData = await order.create({
                            userId: userData._id,
                            name: userData.username,
                            email: userData.email,
                            address: req.body.address,
                            orderItems: cartData.product,
                            totalAmount: total,
                            paymentMethod: req.body.paymentMethod,
                            orderDate: moment().format("MMM Do YY"),
                            deliveryDate: moment().add(3, "days").format("MMM Do YY"),

                          })
              
                          const amount = orderData.totalAmount * 100
                          const orderId = orderData._id
                    
                          
              
              
                          if (req.body.paymentMethod === "COD") {
              
                            await order.updateOne({ _id: orderId }, { $set: { orderStatus: 'placed' } })
              
                            await cart.deleteOne({ userId: userData._id });

                            const result = await Promise.all(
                                productData.map(async (x) => {
                                    const updatedProduct = await product.updateOne(
                                        { _id: x.productItem },
                                        { $inc: { stock: -1 * x.productQuantity } }
                                    );
                                    return updatedProduct;
                                })
                            );
    
              
                            res.json({ success: true });
                            
                            coupon.updateOne(
                              { couponName: data.coupon },
                              { $push: { users: { userId: objId } } }
                            ).then((updated) => {
                              console.log(updated + "hey this process modified");
                            });
              
                        } else {
                            let options = {
                                amount: amount,
                                currency: "INR",
                                receipt: "" + orderId,
                            };
                            console.log(options+"options");
                            instance.orders.create(options, function (err, order) {

                                if (err) {
                                    console.log(err);
                                } else {
                                   
                                    res.json({ order: order });
                                    cart.deleteOne({ userId: userData._id });
                                    coupon.updateOne(
                                        { couponName: data.coupon },
                                        { $push: { users: { userId: objId } } }
                                    ).then((updated) => {
                                        console.log(updated);
                                    });
                                }
                            })

                        }
                    } else {

                        res.redirect("/Cart");
                    }
                }

            }
        } catch (error) {
            console.log(error);
            res.render("error",{error});
        }
    },
    verifyPayment: async (req, res) => {
        const session = req.session.email;
        const userData = await users.findOne({ email: session.email });
        const productData = await cart
        .aggregate([
            {
                $match: { userId: userData._id },
            },
            {
                $unwind: "$product",
            },
            {
                $project: {
                    productItem: "$product.productId",
                    productQuantity: "$product.quantity",
                    productCategory: "$Product.category",
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productItem",
                    foreignField: "_id",
                    as: "productDetail",
                },
            },
            {
                $project: {
                    productItem: 1,
                    productQuantity: 1,
                    productCategory: 1,
                    productDetail: { $arrayElemAt: ["$productDetail", 0] },
                },
            },
            {
                $addFields: {
                    productPrice: {
                        $multiply: ["$productQuantity", "$productDetail.price"],
                    },
                },
            },
        ])
        .exec();

        try {
          const details = req.body;
          console.log(details);
          const orderId = details['payment[razorpay_order_id]'];
          const paymentId = details['payment[razorpay_payment_id]'];
          const razorpay_signature = details['payment[razorpay_signature]'];
          const receipt = details['order[receipt]'];
          
          let hmac = crypto.createHmac("SHA256", process.env.KETSECRET);
          hmac.update(orderId + "|" + paymentId);
          hmac = hmac.digest("hex");
    
          if (hmac == razorpay_signature) {

            const result = await Promise.all(
                productData.map(async (x) => {
                    const updatedProduct = await product.updateOne(
                        { _id: x.productItem },
                        { $inc: { stock: -1 * x.productQuantity } }
                    );
                    return updatedProduct;
                })
            );
       
            const objId = mongoose.Types.ObjectId(receipt);
    
            order.updateOne({ _id: objId }, { $set: { paymentStatus: "paid", orderStatus: 'placed' } }).then(() => {

    
              res.json({ success: true });
    
            }).catch((err) => {
              console.log(err);
              res.json({ status: false, err_message: "payment failed" });
            })
    
          } else {
            console.log(err);
            res.json({ status: false, err_message: "payment failed" });
          }
    
    
        } catch (error) {
          console.log(error);
          res.render("error");
        }
      },    

    orderDetails: async (req, res) => {
        const session = req.session.email;
        const userData = await users.findOne({ email: session.email });
        const userId = session._id;
        const objId = mongoose.Types.ObjectId(userId);
        console.log(objId);
        const productData = await order
            .aggregate([
                {
                    $match: { userId: objId },
                },
                {
                    $unwind: "$orderItems",
                },
                {
                    $project: {
                        productItem: "$orderItems.productId",
                        productQuantity: "$orderItems.quantity",
                        address: 1,
                        name: 1,
                        phonenumber: 1,
                        totalAmount: 1,
                        orderStatus: 1,
                        paymentMethod: 1,
                        paymentStatus: 1,
                        orderDate: 1,
                        deliveryDate: 1,
                        createdAt: 1,
                    },
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "productItem",
                        foreignField: "_id",
                        as: "productDetail",
                    },
                },
                {
                    $project: {
                        productItem: 1,
                        productQuantity: 1,
                        name: 1,
                        phoneNumber: 1,
                        address: 1,
                        totalAmount: 1,
                        orderStatus: 1,
                        paymentMethod: 1,
                        paymentStatus: 1,
                        orderDate: 1,
                        deliveryDate: 1,
                        createdAt: 1,
                        productDetail: { $arrayElemAt: ["$productDetail", 0] },
                    },
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "productDetail.category",
                        foreignField: "_id",
                        as: "category_name",
                    },
                },
                {
                    $unwind: "$category_name",
                },
            ])
            .sort({ createdAt: -1 });
        const orderDetails = await order
            .find({ userId: userData._id })
            .sort({ createdAt: -1 });
        console.log(productData.length);
        res.render("orderDetailsUser", {
            productData,
            orderDetails,
            countInCart,
            countInWishlist,
        });
    },
    orderedProduct: async (req, res) => {
        const id = req.params.id;
        const session = req.session.email;
        const userData = await users.findOne({ email: session.email });
        const orderDetails = await order
            .find({ userId: userData._id })
            .sort({ createdAt: -1 });
        const objId = mongoose.Types.ObjectId(id);
        const productData = await order.aggregate([
            {
                $match: { _id: objId },
            },
            {
                $unwind: "$orderItems",
            },
            {
                $project: {
                    productItem: "$orderItems.productId",
                    productQuantity: "$orderItems.quantity",
                    productSize: "$orderItems.size",
                    address: 1,
                    name: 1,
                    phonenumber: 1,
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productItem",
                    foreignField: "_id",
                    as: "productDetail",
                },
            },
            {
                $project: {
                    productItem: 1,
                    productQuantity: 1,
                    name: 1,
                    email: 1,
                    address: 1,
                    productDetail: { $arrayElemAt: ["$productDetail", 0] },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "productDetail.category",
                    foreignField: "_id",
                    as: "category_name",
                },
            },
            {
                $unwind: "$category_name",
            },
        ]);

        // console.log(orderDetails);

        res.render("orderedProductUser", {
            productData,
            orderDetails,
            countInCart,
            countInWishlist,
        });
    },
    orderSuccess: async (req, res) => {
        try{
            let session = req.session.email;

        const categories = await category.find();

        res.render("orderSuccessUser", { session, categories, countInCart, countInWishlist });
        const query = req.query;
        const orderId = query.orderId;
        await order.updateOne(
            { _id: orderId },
            { $set: { orderStatus: "placed", paymentStatus: "paid" } }
        );
        await cart.deleteOne({ userId: query.cartId });
    } catch (error) {
        console.log(error);
        res.render("user/error");
      }
    },
    cancelOrder: async (req, res) => {
        const data = req.params.id;
        if (data) {
            await order.updateOne(
                { _id: data },
                { $set: { orderStatus: "cancelled" } }
            );
            res.redirect("/order");
        }
        else {
            res.render('error')
        }
    },

    getOrders: async (req, res) => {
        order
            .aggregate([
                {
                    $lookup: {
                        from: "products",
                        localField: "orderItems.productId",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "users",
                    },
                },
                {
                    $sort: {
                        createdAt: -1,
                    },
                },
            ])
            .then((orderDetails) => {
                console.log(orderDetails);
                res.render("ordersDetails", { orderDetails });
            });
    },

    getOrderedProduct: async (req, res) => {
        const id = req.params.id;

        const objId = mongoose.Types.ObjectId(id);
        const productData = await order.aggregate([
            {
                $match: { _id: objId },
            },
            {
                $unwind: "$orderItems",
            },
            {
                $project: {
                    productItem: "$orderItems.productId",
                    productQuantity: "$orderItems.quantity",
                    productSize: "$orderItems.size",
                    address: 1,
                    name: "$orderItems.size",
                    phoneNumber: 1,
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productItem",
                    foreignField: "_id",
                    as: "productDetail",
                },
            },
            {
                $project: {
                    productItem: 1,
                    productQuantity: 1,
                    productSize: 1,
                    address: 1,
                    name: 1,
                    phoneNumber: 1,
                    productDetail: { $arrayElemAt: ["$productDetail", 0] },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "productDetail.category",
                    foreignField: "_id",
                    as: "category_name",
                },
            },
            {
                $unwind: "$category_name",
            },
        ]);
        res.render("orderedProductAdmin", { productData });
    },

    orderedProduct: async (req, res) => {
        const id = req.params.id;
        const session = req.session.email;
        const userData = await users.findOne({ email: session.email });
        const orderDetails = await order
            .find({ userId: userData._id })
            .sort({ createdAt: -1 });
        const objId = mongoose.Types.ObjectId(id);
        const productData = await order.aggregate([
            {
                $match: { _id: objId },
            },
            {
                $unwind: "$orderItems",
            },
            {
                $project: {
                    productItem: "$orderItems.productId",
                    productQuantity: "$orderItems.quantity",
                    productSize: "$orderItems.size",
                    address: 1,
                    name: 1,
                    phonenumber: 1,
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productItem",
                    foreignField: "_id",
                    as: "productDetail",
                },
            },
            {
                $project: {
                    productItem: 1,
                    productQuantity: 1,
                    name: 1,
                    phoneNumber: 1,
                    address: 1,
                    productDetail: { $arrayElemAt: ["$productDetail", 0] },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "productDetail.category",
                    foreignField: "_id",
                    as: "category_name",
                },
            },
            {
                $unwind: "$category_name",
            },
        ]);

        // console.log(orderDetails);

        res.render("orderedProductUser", {
            productData,
            orderDetails,
            countInCart,
            countInWishlist,
        });
    },

    orderStatusChanging: async (req, res) => {
        const id = req.params.id;
        const data = req.body;
        await order.updateOne(
            { _id: id },
            {
                $set: {
                    orderStatus: data.orderStatus,
                    paymentStatus: data.paymentStatus,
                }
            }
        )
        res.redirect("/admin/order");
    },
};
