const user = require('../models/userModel');
const UserOTPVerification = require('../models/userOTPVerification');
const bcrypt = require('bcrypt');
const dotenv = require("dotenv");
dotenv.config();
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { response } = require('express');
const category = require('../models/catogeryModel')
const product = require('../models/productModel');
const cart = require('../models/cartModel');
const banner = require('../models/bannerModel')
const wishlist = require('../models/whishlistModel')
const mongoose = require("mongoose");
const session = require('express-session');
const ObjectId = mongoose.Types.ObjectId;
const { render } = require('ejs');
let message = ""

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'spectacular6776@gmail.com',
        pass: 'fbefpxkqgwjpjogz'
    }
});
const randomOTP = Math.floor(1000 + Math.random() * 9000).toString()

module.exports = {
    userIndex: async (req, res) => {
        let session = req.session.email;
        const categories = await category.find()
        const banners = await banner.find()
        // req.session.errormsg = false;
        res.render('home', { session, categories, banners })
    },
    categoryHome: async (req, res) => {
        try {
            const session = req.session.email;
            const categories = await category.find();

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const endIndex = page * limit;
            const startIndex = (page - 1) * limit;

            const products = await product.find({ category: req.params.id, status: true }).populate('category').skip(startIndex).limit(limit).exec();

            const productCount = products.length;
            
            const results = {};
            if (endIndex <= productCount) {
                results.next = {
                    page: page + 1,
                    limit: limit
                };
            }
            if (startIndex > 0) {
                results.previous = {
                    page: page - 1,
                    limit: limit
                }
            }
            console.log(limit + "limit");
            res.render('homeCategory', { session, categories, productCount, products, results,page })
        } catch (error) {
            res.render('error', { error })
        }
    },
    searchProduct: async (req, res) => {
        const session = req.session.email;
        const categories = await category.find();
      
        try {
          const value = req.body.search ? req.body.search.trim().toUpperCase() : '';
          const normalProducts = await product.find().populate('category');
          const allProducts = normalProducts.map((product) => {
            return {
              _id: product._id,
              productname: product.productname.toUpperCase(),
              price: product.price,
              image: [...product.image],
            };
          });
          const searchProducts = (query) => {
            return allProducts.filter((product) => {
              const regex = new RegExp(query, 'i');
              return product.productname.match(regex);
            });
          };
          const products = searchProducts(value);
          let messageresult = products.length > 0 ? null : "Sorry, no products found";
  
          res.render('searchResult', {
            session,
            categories,
            products,
            messageresult,
        
          });
        } catch (error) {
          res.render('error', { error });
        }
      },
      
    productRender: async (req, res) => {
        try {
          const session = req.session.email;
          const categories = await category.find();
          const productId = req.params.id;
          console.log(productId);
          const products = await product.findOne({ _id: productId });
          console.log(products.image.length);
          res.render('productRender', { session, categories, products });
        } catch (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
        }
      },
      
    signInRender: (req, res) => {
        if (req.session.mail) {
            res.redirect('/')
        } else {
            console.log(message)
            res.render('signIn', { message });
            message = ""
        }
    },
    signUpRender: (req, res) => {
        res.render('signup', { message })
        message = ""

    },
    otpPage: (req, res) => {
        const userInfo = req.query
        res.render('otp', { userInfo })
    },
    userSignup: async (req, res) => {

        try {
            req.session.otp = null;
            const existingUser = await user.findOne({ email: req.body.email });

            if (existingUser) {
                message = 'Email already exists';
                return res.redirect('/signup');
            }

            const hashpassword = await bcrypt.hash(req.body.password, 5);

            const accountSid = process.env.accountSid;
            const authToken = process.env.authToken;

            const client = twilio(accountSid, authToken);

            const User = {
                username: req.body.username,
                email: req.body.email,
                gender: req.body.gender,
                mobile: req.body.mobile,
                password: hashpassword,
                status: true,
            };
            const OTP = randomOTP;
            const expirationTime = Date.now() + 5 * 60 * 1000;

            req.session.otp = OTP;

            client.messages.create({
                body: `Hi,Your OTP is ${OTP}`,
                from: '+12762623837', // replace with your Twilio phone number
                to: '+91' + User.mobile,
            }).then(() => {
                console.log('OTP sent via SMS');
            }).catch((error) => {
                console.log('Error sending OTP via SMS:', error);
            });

            const mailOptions = {
                from: 'spectacular6776@gmail.com',
                to: User.email,
                subject: 'OTP',
                text: `Your otp is :${OTP}`,
                html: `
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Spectacular</a>
              </div>
              <p style="font-size:1.1em">Hi ${User.username},</p>
              <p>Thank you for choosing Spectacular. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
              <p style="font-size:0.9em;">Regards,<br />Spectacular</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Spectacular</p>
              </div>
              </div>
              </div>`
            };

            await transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Error sending email: ${error}`);
                }
                console.log(`OTP sent to ${User.email}: ${OTP}`);
                res.redirect(`/otp?username=${User.username}&email=${User.email}&gender=${User.gender}&password=${User.password}&status=${User.status}`);
            });
        } catch (err) {
            console.error(`Error inserting user: ${err}`);
        }
    },
    verifyOTP: async (req, res) => {
        console.log(req.body.otp);
        try {
            // const userOtp = await UserOTPVerification.findOne({ email: req.body.email });

            // console.log(userOtp);
            let otp = req.session.otp
            const email = req.body.email
            const trimmedEmail = email.trim();
            if (req.body.otp == otp) {
                const newUser = new user({
                    username: req.body.username,
                    email: trimmedEmail,
                    gender: req.body.gender,
                    password: req.body.password,
                    status: true,
                });

                await newUser.save();
                await UserOTPVerification.deleteOne({ email: req.body.email });

                res.redirect("/");
            } else {
                const userInfo = {
                    username: req.body.username,
                    email: req.body.email,
                    gender: req.body.gender,
                    password: req.body.password,
                    block: true,
                };

                res.render('otp', { invalidMessage: "Invalid OTP", userInfo });
            }
        } catch (error) {
            console.log(error);
        }
    },

    resendOTP: async (req, res) => {
        try {
            const hashpassword = await bcrypt.hash(req.body.password, 5);

            const User = {
                username: req.body.userName,
                email: req.body.email,
                gender: req.body.gender,
                password: hashpassword,
                status: true,
            };


            const OTP = randomOTP;
            const expirationTime = Date.now() + 5 * 60 * 1000;

            // const newOTPVerification = new UserOTPVerification({
            //     email: User.email,
            //     otp: OTP,
            //     expiresAt: expirationTime
            // });

            // await newOTPVerification.save();

            const mailOptions = {
                from: 'spectacular6776@gmail.com',
                to: User.email,
                subject: 'Resend OTP',
                text: `Your otp is :${OTP}`,
                html: `
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Spectcular</a>
              </div>
              <p style="font-size:1.1em">Hi ${User.username},</p>
              <p>Thank you for choosing Spectacular. Use the following Resend OTP to complete your Sign Up procedures. Resend OTP is valid for 5 minutes</p>
              <h2 style="background: #427677;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
              <p style="font-size:0.9em;">Regards,<br />Spectacular</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Spectacular</p>
              </div>
              </div>
              </div>`
            };

            await transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Error sending email: ${error}`);
                }
                console.log(`OTP sent to ${User.email}: ${OTP}`);
                res.redirect(`/otp?username=${User.username}&email=${User.email}&gender=${User.gender}&password=${User.password}&status=${User.status}`);
            });
        } catch (err) {
            console.error(`Error inserting user: ${err}`);
        }
    },
    loginVarification: async (req, res) => {
        try {
            const email = req.body.email;
            const trimmedEmail = email.trim();

            const Password = req.body.password
            const userdata = await user.findOne({ email: trimmedEmail });


            if (userdata) {

                if (userdata.status) {
                    const result = await bcrypt.compare(Password, userdata.password)
                    console.log(result);

                    if (result) {
                        console.log("error1");
                        response.email = userdata;
                        req.session.email = response.email;
                        req.session.otp = null;
                        console.log(response.email);
                        console.log(req.session.email)
                        console.log("Login success")
                        res.redirect('/');
                    } else {
                        console.log("error2");
                        message = "Incorrect Password";
                        res.redirect('/signin');
                    }
                } else {
                    console.log("error3");
                    message = "Email Id Blocked";
                    res.redirect('/signin');
                }
            } else {
                console.log("error");
                message = "Incorrect Email Id";
                res.redirect('/signin')
            }
        } catch (err) {
            console.log("err");
        }
    },
    userLogout: function (req, res) {
        req.session.email = null;
        res.redirect('/');
    },

    profileRender: async (req, res) => {
        console.log("session" + req.params.id)
        const User = await user.findOne({ _id: req.params.id })

        res.render('userProfile', { User })
    },
    editProfile: async (req, res) => {
        const id = req.params.id
        await user.updateOne({ _id: req.params.id }, {
            $set: {
                username: req.body.username,
                email: req.body.email,
                gender: req.body.gender
            }
        })
        res.redirect('/profile/' + id)
    },
    addAddress: async (req, res) => {
        const id = req.params.id
        await user.updateOne({ _id: id }, {
            $push: {
                address: {
                    name: req.body.name,
                    housename: req.body.housename,
                    place: req.body.place,
                    post: req.body.post,
                    dist: req.body.dist,
                    state: req.body.state,
                    pin: req.body.pin,
                    phone: req.body.phone
                }
            }
        })
        res.redirect('/checkout/')
    },

    deleteAddress: async (req, res) => {

        const session = req.session.email;
        try {
            let userId = session._id;
            let addressId = req.params.id;

            await user.updateOne({ _id: userId }, { $pull: { address: { _id: addressId } } })
            res.redirect('/profile/' + session._id)

        } catch (error) {
            console.log(error);
            res.render('error')
        }

    },
    addToCart: async (req, res) => {
        try {
            const id = req.params.id;
            const objId = mongoose.Types.ObjectId(id);
            const session = req.session.email;


            let proObj = {
                productId: objId,
                quantity: 1,
            };
            const userData = await user.findOne({ email: session.email });
            const userCart = await cart.findOne({ userId: userData._id });
            if (userCart) {
                let proExist = userCart.product.findIndex(
                    (product) => product.productId == id
                );
                if (proExist != -1) {
                    await cart.aggregate([
                        {
                            $unwind: "$product",
                        },
                    ]);
                    await cart.updateOne(
                        { userId: userData._id, "product.productId": objId },
                        { $inc: { "product.$.quantity": 1 } }
                    );
                    res.redirect("/cart/" + session._id);

                } else {
                    cart
                        .updateOne({ userId: userData._id }, { $push: { product: proObj } })
                        .then(() => {
                            res.redirect("/cart/" + session._id);
                        });
                }
            } else {
                const newCart = new cart({
                    userId: userData.id,
                    product: [
                        {
                            productId: objId,
                            quantity: 1,
                        },
                    ],
                });
                newCart.save().then(() => {
                    res.redirect("/cart/" + session._id);
                });
            }
        } catch (error) {
            console.log(error);
            res.render("error");
        }
    },

    cartRender: async (req, res) => {

        let session = req.session.email;
        const categories = await category.find();

        try {

            const userData = await user.findOne({ email: session.email });
            console.log(userData.id);
            const objid = mongoose.Types.ObjectId(userData.id)

            const productData = await cart.aggregate([
                {
                    $match: { userId: objid },
                },
                {
                    $unwind: "$product",
                },
                {
                    $project: {
                        productItem: "$product.productId",
                        productQuantity: "$product.quantity",
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

            const sumnum = productData.reduce((accumulator, object) => {
                return accumulator + object.productPrice;
            }, 0);

            const sum = sumnum.toFixed(2)

            countInCart = productData.length;
            console.log(countInCart);
            res.render("cart", {
                productData,
                userData,
                sum,
                countInCart,
                session,
                categories,
            });
        } catch (error) {
            console.log(error);
            res.redirect("/");
        }
    },
    removeCartItem: async (req, res) => {
        const session = req.session.email;
        try {
            const productId = req.params._id
            const productobjId = mongoose.Types.ObjectId(productId)
            const cartId = req.params.id
            const cartobjId = mongoose.Types.ObjectId(cartId)


            await cart.aggregate([
                {
                    $unwind: "$product",
                },
            ]);
            await cart.updateOne(
                { _id: cartobjId, "product.productId": productobjId },
                { $pull: { product: { productId: productobjId } } }
            )
            res.redirect("/cart/ " + session._id);

        } catch (error) {
            console.log(error);
            res.render("error");
        }

    },
    changeQuantity: (req, res, next) => {
        try {
          const data = req.body
          console.log(data, "counted");          
          const productid = ObjectId(req.body.product.trim());
          const count=parseInt(data.Count);
          const quantity=parseInt(data.Quantity);
          const cartId = ObjectId(req.body.cart.trim());
          let Numbers=parseInt(data.Num)
    
          if (count === -1 && quantity === 1) {
            
            cart.updateOne(

              { _id: cartId , "product.productId": productid },
              { $pull: { product: { productId: productid} } }
            )
              .then(() => {
                res.json({ quantity: true })
              }).catch(err => console.log(err))
          } else {
            cart.updateOne(
              { _id: cartId , "product.productId": productid },
              { $inc: { "product.$.quantity":count } }
            ).then(async () => {
                

              // Get updated product data
              const productData = await cart.aggregate([
                {
                  $match: { _id: mongoose.Types.ObjectId(cartId ) }
                },
                {
                  $unwind: "$product",
                },
                {
                  $project: {
                    productItem: "$product.productId",
                    productQuantity: "$product.quantity",
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
                {
                  $group: {
                    _id: null,
                    total: {
                      $sum: { $multiply: ["$productQuantity", "$productDetail.price"] },
                    },
                    productPrice: {
                        $push: "$productPrice"
                      },
                  },
                },
              ]).exec();
              let quant= parseInt(quantity+count)
              const totals=productData[0].total.toFixed(2)
              res.json({ success: true, productData: totals,Quant:quant})
            })
          }
        } catch (err) {
          console.log(err);
          next(err)
        }
      },
    

    // changeQuantity: async (req, res) => {
    //     const session = req.session.email;
    //     try {
    //         const data = {
    //             cart: req.params.id,
    //             product: req.params._id,
    //             count: req.params.num
    //         }
    //         console.log(data);

    //         const objId = mongoose.Types.ObjectId(data.product);
    //         await cart
    //             .aggregate([
    //                 {
    //                     $unwind: "$product",
    //                 },
    //             ])
    //             .then((data) => { console.log("data" + data); });

    //         await cart
    //             .updateOne(
    //                 { _id: data.cart, "product.productId": objId },
    //                 { $inc: { "product.$.quantity": data.count } }
    //             )
    //             .then((status) => {
    //                 res.redirect("/cart/ " + session._id)
    //             });
    //     } catch (error) {
    //         console.log(error);
    //         res.render("error");
    //     }
    // },
    checkoutRender: async (req, res) => {

        let session = req.session.email;
        const categories = await category.find();

        try {

            const userData = await user.findOne({ email: session.email });
            console.log(userData.id);
            const objid = mongoose.Types.ObjectId(userData.id)

            const productData = await cart.aggregate([
                {
                    $match: { userId: objid },
                },
                {
                    $unwind: "$product",
                },
                {
                    $project: {
                        productItem: "$product.productId",
                        productQuantity: "$product.quantity",
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

            const sumnum = productData.reduce((accumulator, object) => {
                return accumulator + object.productPrice;
            }, 0);

            const sum = sumnum.toFixed(2)

            countInCart = productData.length;
            console.log(countInCart);
            res.render("checkout", {
                productData,
                userData,
                sum,
                countInCart,
                session,
                categories,
            });
        } catch (error) {
            console.log(error);
            res.redirect("/");
        }
    },
    addToWishlist: async (req, res) => {
        try {
            const id = req.params.id;
            const objId = mongoose.Types.ObjectId(id)
            const session = req.session.email;

            let proObj = {
                productId: objId,
            };
            const userData = await user.findOne({ email: session.email });
            const userWishlist = await wishlist.findOne({ userId: userData._id });

            if (userWishlist) {

                let proExist = userWishlist.product.findIndex(
                    (product) => product.productId == id
                );
                if (proExist) {
                    console.log("already exist");
                    res.redirect('/wishlist')
                } else {

                    wishlist.updateOne(
                        { userId: userData._id }, { $push: { product: proObj } }
                    ).then(() => {
                        console.log("updated sucess");
                        res.redirect('/wishlist')
                    });
                }
            } else {

                const newWishlist = new wishlist({
                    userId: userData._id,
                    product: [
                        {
                            productId: objId,

                        },
                    ],
                });
                newWishlist.save().then(() => {
                    console.log("added sucess");
                    res.redirect('/wishlist')
                });
            }
        } catch (err) {
            console.log(err)

        }
    },


}
