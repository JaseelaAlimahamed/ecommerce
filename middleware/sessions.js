module.exports = {
    adminSession: (req, res, next) => {
        if (req.session.amail) {
            next();
        }
        else {
            res.redirect('/admin');
        }
    },
    userSession: (req, res, next) => {
        if (req.session.email) {
            res.redirect('/')
        } else {
            next();
        }
    },
    userSessionLogin:(req,res,next)=>{
        if(req.session.email){
            next();
        }
    else{
        res.redirect('/')
    }
    }
}