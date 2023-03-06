const { response } = require('express');
const user = require('../models/userModel');
const category = require('../models/catogeryModel')
const dotenv = require('dotenv');
const session = require('express-session');
const product = require('../models/productModel');
const banner = require('../models/bannerModel');
const coupon = require('../models/couponModel');
const order = require('../models/orderModel');
const { findOne } = require('../models/userModel');

dotenv.config();
let msg = ""
let message = ""
module.exports = {
    adminLogIn: (req, res) => {
        if (req.session.amail) {
            res.redirect('/admin/adminhome')
        } else {
            res.render('adminLogin', { msg })
            msg = ""
        }
    },
    adminPost: (req, res) => {
        const aEmail = process.env.Email;
        const aPassword = process.env.Password;
        const email = req.body.email;
        const password = req.body.password;
        if (email == aEmail && password == aPassword) {
            req.session.amail = email;
            res.redirect("/admin/adminhome");
        } else {
            msg = "invalid Email and Password"
            res.redirect('/admin');
        }
    },
    adminHome: (req, res) => {
        res.render('adminhome')
    },
    adminLogout: (req, res) => {
        req.session.amail = null;
        res.redirect('/admin')
    },

    usersList: async (req, res) => {

        let users = await user.find({}).cursor().toArray()
        res.render('usersDetails', { users })
        message = ""
    },

    orderDetails: (req, res) => {
        res.render('ordersDetails')

    },
    userBlock: async (req, res) => {
        await user.updateOne({ _id: req.params.id }, { $set: { status: true } })
        res.redirect('/admin/users')
    },
    userUnblock: async (req, res) => {
        await user.updateOne({ _id: req.params.id }, { $set: { status: false } })
        res.redirect('/admin/users')
    },

    // category management

    categoryLists: async (req, res) => {
        const categories = await category.find({}).cursor().toArray()
        const banners = await banner.find()
        res.render('categories', { categories, message, banners })
    },
    addCategory: async (req, res) => {
        console.log(req.body)
        const existingCaterogery = await category.findOne({ categoryname: req.body.categoryname })

        if (existingCaterogery) {

            message = "This Category Already Exist Please Try Another"

            res.redirect('/admin/categories')

        } else {
            const newCategory = new category({
                categoryname: req.body.categoryname,
                status: true
            })
            newCategory.save()
            message = ""
            res.redirect('/admin/categories')
        }
    },
    deleteCategory: async (req, res) => {
        await category.updateOne({ _id: req.params.id }, { $set: { status: false } })
        res.redirect('/admin/categories')
    },
    ActiveCategory: async (req, res) => {
        await category.updateOne({ _id: req.params.id }, { $set: { status: true } })
        res.redirect('/admin/categories')
    },
    bannerUpdateCarousal: async (req, res) => {

        let image = req.files.map((obj) => {
            return obj?.filename
        });
        await banner.updateOne({ _id: req.params.id }, {
            $set: {
                carousalhead1: req.body.carousalhead1,
                carousalhead2: req.body.carousalhead2,
                carousalhead3: req.body.carousalhead3,

                carousalbody1: req.body.carousalbody1,
                carousalbody2: req.body.carousalbody2,
                carousalbody3: req.body.carousalbody3,
                carousalimage: image,
            }
        });


        res.redirect('/admin/categories')
    },
    bannerUpdateContainer: async (req, res) => {
        let image = req.files.map((obj) => {
            return obj?.filename
        })
        await banner.updateOne({ _id: req.params.id }, {
            $set: {
                containerimage: image,
                containertext: req.body.containertext,
            }
        });
        res.redirect('/admin/categories')
    },
    bannerUpdateImage: async (req, res) => {
        let image = req.files.map((obj) => {
            return obj?.filename
        })
        await banner.updateOne({ _id: req.params.id }, {
            $set: {
                image: image
            }
        });
        res.redirect('/admin/categories')
    },
    couponRender: async (req, res) => {
        const couponData = await coupon.find()
        res.render('coupons', { couponData, message })
        message = "";
    },

    addCoupon: async (req, res) => {
        const couponname = req.body.couponName.toUpperCase()
        const exstcoupon = await coupon.findOne({ couponName: couponname });
        if (exstcoupon) {
            message = "This Coupon is  already exist";
            res.redirect('/admin/coupons')

        } else {
            try {
                const data = req.body;
                const dis = parseInt(data.discount);
                const maxLimit = parseInt(data.maxLimit);
                const discount = dis / 100;
                coupon.create({
                    couponName: couponname,
                    discount: discount,
                    maxLimit: maxLimit,
                    expirationTime: data.expirationTime,
                    delete: false,
                }).then((data) => {
                    // console.log(data);
                    res.redirect("/admin/coupons")
                });
            } catch {
                console.error();
                res.render("error")
            }
        }
    },
    editCoupon: async (req, res) => {
        try {
            const id = req.params.id;
            const data = req.body;
            const couponname = data.couponName.toUpperCase();
            const exstcoupon = await coupon.findOne({ couponName: couponname });
            if (exstcoupon) {
                message = "This Coupon is  already exist";
                res.redirect('/admin/coupons')

            } else {
                coupon.updateOne(
                    { _id: id },
                    {
                        couponName: couponname,
                        discount: data.discount / 100,
                        maxLimit: data.maxLimit,
                        expirationTime: data.expirationTime
                    }
                ).then(() => {
                    res.redirect("/admin/coupons");
                })
            }
        } catch {
            console.error();
        }

    },
    deleteCoupon:async (req,res)=>{
        const id = req.params.id;
        await coupon.updateOne({_id:id},{$set:{delete:false}})
        res.redirect('/admin/coupons');
    },
    restoreCoupon:async(req,res)=>{
        const id = req.params.id;
        await coupon.updateOne({_id:id},{$set:{delete:true}});
        res.redirect("/admin/coupons");
    },

}