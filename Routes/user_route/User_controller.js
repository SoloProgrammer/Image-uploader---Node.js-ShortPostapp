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

        const url = `${process.env.BASE_URL}/users/${user._id}/verify/${token.token}`;

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

            const url = `${process.env.BASE_URL}/users/${user._id}/verify/${token.token}`;
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

router.put('/follow_unfollow_User/:touserid', fetchuser, async (req, res) => {

    try {

        const User_to_follow = await User.findById(req.params.touserid);

        const User_who_follow = await User.findById(req.user.id);

        if (!User_to_follow) return res.status(400).json({ success: false, messsage: "User to follow not Exixts" });

        if (User_to_follow.followers.includes(req.user.id)) {

            await User.updateOne({ "_id": User_to_follow._id }, { $pull: { followers: req.user.id } })
        }
        else {

            await User.updateOne({ "_id": User_to_follow._id }, { $addToSet: { followers: req.user.id } })
        }

        if (User_who_follow.following.includes(req.params.touserid)) {

            await User.updateOne({ "_id": User_who_follow._id }, { $pull: { following: req.params.touserid } })

            res.status(200).json({ success: true, messsage: "Unfollowed..." })
        }
        else {

            await User.updateOne({ "_id": User_who_follow._id }, { $addToSet: { following: req.params.touserid } })

            res.status(200).json({ success: true, messsage: "Following..." })

        }
    } catch (error) {

        res.status(505).json({ success: false, message: "Internal server Error", error: error.message });

    }
})

// below three routes are the steps for resetting user password.....................................

router.post('/resetPass/Sendemail/:email', async (req, res) => {
    let success = false;
    const user = await User.findOne({ "email": req.params.email });

    try {
        if (!user) {
            data = `<h3> We received an account recovery request on Blogg app for ${req.params.email}, but that email does not exist in our records </h3>
            </br>
            <h4>If you meant to sign up for blog app, you can <a href=${process.env.BASE_URL}/signup> SignUp </a> here </h4> 
            </br>
            <p>If this password reset link is not send by you just ignore it, dont't worry your account is safe.`
            const email = await SendEmail(req.params.email, "Password Reset : Blogg app", data)
        
            if(email.success) return res.json({ success, status: email.status, message: email.message })
            if(!email.success) return res.json({ success, status: email.status, message: email.message  })
        }
        else {
            
            const token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString('hex')
            }).save();
            
            const url = `${process.env.BASE_URL}/account/${user._id}/reset_password/${token.token}`;
            data = `<h4> Click the link below and visit the password reset page to create new password</h4>
            <br/>
            <p> URL (🔑) - ${url}</p>
            <br/>
            <small>Dont't worry this process is safe at all 🔒</small>`
            
            const email =  await SendEmail(req.params.email, "Password Reset : Blogg app", data)
            
            if(email.success) return res.json({ success, status: email.status, message: email.message })
            if(!email.success) {
                await token.remove();
                return res.json({ success, status: email.status, message: email.message  });
            }

        }
    } catch (error) {
        res.status(505).json({ success: false, message: "Internal server Error", error: error.message });

    }

})

router.get('/account/:userid/reset_password/:token', async (req, res) => {
    try {

        const user = await User.findById(req.params.userid);

        let success = false;

        if (!user) return res.status(400).json({ success, "message": "Invald Link" });

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token
        })

        if (!token) {
            return res.status(400).json({ success, message: "Invalid Link" })
        }

        res.status(200).json({ success: true, message: "Reset password here" })
    } catch (error) {

        res.status(505).json({ success: false, message: "Internal server Error", error: error.message });

    }
})

router.get('/:userid/change_password', async (req, res) => {

    let success = false

    try {

        const user = await User.findById(req.params.userid);

        const token = await Token.findOne({userId: user._id});

        const { new_password } = req.body;

        if(!new_password) return res.status(400).json({success,message:"Plz enter new password"})

        const salt = await bcrypt.genSalt();

        const hashed_pass = await bcrypt.hash(new_password, salt)

        await User.findByIdAndUpdate(req.params.userid, { $set: { "password": hashed_pass } })

        await token.remove();

        res.status(200).json({ success: true, message: "Your password has been resetted sucessfully,SignIn now !" })

    } catch (error) {

        res.status(505).json({ success, message: "Internal server Error", error: error.message });

    }

})


module.exports = router