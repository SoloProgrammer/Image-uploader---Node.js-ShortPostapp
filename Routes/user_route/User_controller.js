const express = require('express');

const router = express.Router();

const fetchuser = require('../../middleware/fetchuser');

const User = require('../../models/User');

const fs = require('fs');

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const SendEmail = require('../../utils/SendEmail');

const crypto = require('crypto');

const Token = require('../../models/EmailToken');

const upload = require('../../middleware/multer_avatar_upload')

// Route to create a new user.......................................................................

router.post('/create_user', async (req, res) => {

    const data = { ...req.body };

    const { fname, profession, email, password } = data

    if (Object.keys(data).length == 0) return res.status(400).json({ success: false, "message": "All fields are manditory !" });

    if (!fname) return res.status(400).json({ success: false, "message": "fullname is manditory!!" });
    if (!profession) return res.status(400).json({ success: false, "message": "profession is manditory!!" });
    if (!email) return res.status(400).json({ success: false, "message": "email is manditory!!" });
    if (!password) return res.status(400).json({ success: false, "message": "password is manditory!!" });


    let user = await User.findOne({ "email": email });

    if (user) return res.status(400).json({ success: false, "message": "This email is already in use!" })

    try {
        const salt = await bcrypt.genSalt();
        const hashed_pass = await bcrypt.hash(password, salt)

        user = await new User({ ...req.body, password: hashed_pass }).save()

        const token = await new Token({
            userId: user._id,
            token: crypto.randomBytes(32).toString('hex')
        }).save();

        const url = `${process.env.BASE_URL}users/${user._id}/verify/${token.token}`;

        await SendEmail(user.email, "Verify Email", url);

        res.json({ success: false, status: "send", message: "Email Verification link is send to your Email plz verify", })

    } catch (error) {
        res.json({ success: "Some error occured", "reason": error.message })
    }

})

// Route to Authneticate user.......................................................................

router.post('/auth_user', async (req, res) => {

    try {
        const data = { ...req.body }

        const { email, password } = data;

        let success = false

        if (Object.keys(data).length == 0) return res.status(400).json({ success: false, "message": "All fields are manditory !" });

        if (!email) return res.status(400).json({ success, "message": "Email is manditory!!" });
        if (!password) return res.status(400).json({ success, "message": "Password is manditory!!" });

        const user = await User.findOne({ "email": email });

        if (!user) return res.status(400).json({ success, "message": "User not found need to Sign-up first !" });

        const comapare_pass = await bcrypt.compare(password, user.password)

        if (!comapare_pass) return res.json({ success, "message": "Invalid Credentails !" })

        if (!user.verified) {
            let token = await Token.findOne({ userId: user._id });
            if (!token) {
                token = await new Token({
                    userId: user._id,
                    token: crypto.randomBytes(32).toString('hex')
                }).save();
            }

            const url = `${process.env.BASE_URL}users/${user._id}/verify/${token.token}`;
            await SendEmail(user.email, "Verify Email", url);

            return res.status(400).json({ success, status: "send", message: "Email Verification link is send to your Email plz verify" });
        }

        const payload = {
            user: {
                id: user._id
            }
        }

        const authToken = jwt.sign(payload, process.env.jwt_secret);

        res.json({ success: true, authToken, message: "Login Sucessfull " })

    } catch (error) {
        res.json({ success: "Some error occured", status: "not send", "reason": error.message, message: "Netwok Error plz try again later" })
    }
})

// Route to Email verification of user..............................................................

router.get('/:id/verify/:token', async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        let success = false;

        if (!user) return res.status(400).json({ success, "message": "Invald Link" });

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token
        })


        if (!token) {
            return res.status(400).json({ success, message: "Invalid Link1" })
        }

        await User.updateOne({ _id: user._id, verified: true });

        await token.remove();

        res.status(200).json({ success: true, message: "Email Verified Sucessfully!" });

    } catch (error) {
        res.json({ success: false, reason: error.message })
    }

})

// Route to get all details of logged in user.......................................................

router.get('/getuser', fetchuser, async (req, res) => {

    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(505).json({ success, message: "Internal server Error" })
    }

})

// Route to Update Profile details of logged in user................................................

router.put('/updateProfile/:current_avatar', upload.single('avatar'), fetchuser, async (req, res) => {

    let success = false

    try {

        if (Object.keys(req.body).length === 0 && !req.file) return res.status(400).json({ success, message: "Data is required to Update Profile" });

        if (req.file) {

            const DIR = "Upload_avatar";

            fs.unlinkSync(DIR + "/" + req.params.current_avatar);

            await User.findByIdAndUpdate(req.user.id, { $set: { ...req.body, avatar: req.file.filename } });
            success = true

        }
        else {
            await User.findByIdAndUpdate(req.user.id, { $set: { ...req.body } });
            success = true
        }

        if (success) res.status(200).json({ success, message: "Profile Updated Successfully" });

    } catch (error) {
        res.status(505).json({ success, message: "Internal server Error" });
    }
})

// Route to Remove avatar of user request...........................................................

router.put('/removeAvatar/:current_avatar', fetchuser, async (req, res) => {

    try {

        const DIR = "Upload_avatar";

        fs.unlinkSync(DIR + "/" + req.params.current_avatar);

        await User.findByIdAndUpdate(req.user.id, { $set: { avatar: "null" } });

        res.status(200).json({ success: true, message: "Avatar Removed Sucessfully" });

    }
    catch (error) {

        res.status(505).json({ success: false, message: "Internal server Error", error: error.message });

    }

})

// Route to Remove avatar of user request...........................................................

router.get('/getuserbyname', async (req, res) => {

    // console.log(req.query.search);

    try {

        const user_by_name = await User.findOne({ "fname": req.query.search });
        res.json(user_by_name)
    }
    catch (error) {
        res.status(505).json({ success: false, message: "Internal server Error", error: error.message });
    }
})

// Route to Follow and unfollow any User by logged in user..........................................

router.put('/follow_unfollow_User/:touserid',fetchuser,async (req,res)=>{

    const User_to_follow = await User.findById(req.params.touserid);

    const User_who_follow = await User.findById(req.user.id);

    if(!User_to_follow) return res.status(400).json({success:false,messsage:"User to follow not Exixts"});

    if(User_to_follow.followers.includes(req.user.id)){

        await User.updateOne({"_id":User_to_follow._id},{$pull:{followers:req.user.id}})
    }
    else{

        await User.updateOne({"_id":User_to_follow._id},{$addToSet:{followers:req.user.id}})
    }

    if(User_who_follow.following.includes(req.params.touserid)){

        await User.updateOne({"_id":User_who_follow._id},{$pull:{following:req.params.touserid}})

        res.status(200).json({success:true,messsage:"Unfollowed..."})
    }
    else{

        await User.updateOne({"_id":User_who_follow._id},{$addToSet:{following:req.params.touserid}})

        res.status(200).json({success:true,messsage:"Following..."})

    }
    

})

//  Get post of users to whom the logged in users folow............................................

// router.get('/getAllpostsofFollowing_users',fetchuser,async(req,res) =>{
//     const 
// })




module.exports = router