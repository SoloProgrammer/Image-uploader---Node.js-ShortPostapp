const express = require('express');

const router = express.Router();

const Post = require('../../models/Post');

const User = require('../../models/User');

const fetchuser = require('../../middleware/fetchuser');

const fs = require('fs');

const upload = require('../../middleware/multer_postImage_upload');

// Adding new post of logged in user.......................................................................

router.post('/AddPost', fetchuser, upload.single('postImage'), async (req, res) => {

    let success = false

    try {
        const user = await User.findById(req.user.id);

        const { title } = req.body;

        const author = user.fname;

        const author_id = req.user.id;

        if (!req.file) return res.status(400).json({ success, message: "Plz Choose at least one Image for posting it" });

        if (!title) return res.status(400).json({ success, message: "Plz Gave some title to this post" });

        const new_post = new Post({
            title, author, author_id, image: req.file.filename
        }).save()


        success = true

        if (new_post) res.status(200).json({ success, message: "New Post Uploaded Sucessfully" })

    } catch (error) {
        res.status(505).json({ success: false, message: "Internal server Error", error: error.message });
    }

});

// Updating Post details of logged in user.................................................................

router.put('/updatePost/:id/:current_img', upload.single('postImage'), async (req, res) => {

    let success = false
    try {

        if (Object.keys(req.body).length === 0 && !req.file) return res.status(400).json({ success, message: "Data is required to update the post" });

        if (req.file) {

            const DIR = 'Upload_post_Image';

            fs.unlinkSync(DIR + '/' + req.params.current_img)

            await Post.findByIdAndUpdate(req.params.id, { $set: { ...req.body, image: req.file.filename } })
            success = true

        }
        else {
            await Post.findByIdAndUpdate(req.params.id, { $set: { ...req.body } });
            success = true
        }

        if (success) res.status(200).json({ success, message: "Post Updated Successfully" });

    } catch (error) {
        res.status(505).json({ success: false, message: "Internal server Error", error: error.message });
    }

});

// Like the Post..........................................................................................

router.put('/likePost/:id', fetchuser, async (req, res) => {

    try {

        const post_id = req.params.id

        const post = await Post.findById(post_id);

        await Post.updateOne({ "_id": req.params.id }, { $pull: { dislikeArr: req.user.id } })

        if (post.likeArr.includes(req.user.id)) {
            await Post.updateOne({ "_id": req.params.id }, { $pull: { likeArr: req.user.id } })
            res.status(200).json({ success: true, message: "Removed Like.." })

        }
        else {
            await Post.updateOne({ "_id": req.params.id }, { $addToSet: { likeArr: req.user.id } })
            res.status(200).json({ success: true, message: "Liked.." })
        }

    } catch (error) {

        res.status(505).json({ success: false, message: "Internal server Error", error: error.message });

    }


});

// disLike the Post.......................................................................................

router.put('/dislikePost/:id', fetchuser, async (req, res) => {

    try {

        const post_id = req.params.id

        const post = await Post.findById(post_id);

        await Post.updateOne({ "_id": req.params.id }, { $pull: { likeArr: req.user.id } })

        if (post.dislikeArr.includes(req.user.id)) {
            await Post.updateOne({ "_id": req.params.id }, { $pull: { dislikeArr: req.user.id } })
            res.status(200).json({ success: true, message: "Removed disLike.." })

        }
        else {
            await Post.updateOne({ "_id": req.params.id }, { $addToSet: { dislikeArr: req.user.id } })
            res.status(200).json({ success: true, message: "disLiked.." })
        }
    } catch (error) {

        res.status(505).json({ success: false, message: "Internal server Error", error: error.message });
    }


});

// Pagination Route for getting 5 posts per page.........................................................

router.get('/getlimited_Posts', async (req, res) => {
    try {

        const limited_posts = await Post.find({}).skip(req.query.from).limit(5)
        res.json(limited_posts)

    } catch (error) {

        res.status(505).json({ success: false, message: "Internal server Error", error: error.message });
    }
})

// get posts of only that users to whom an they are follows.............................................. 


router.get('/getPosts_of_folowing_users', fetchuser, async (req, res) => {

    try {
        const user = await User.findById(req.user.id);

        let posts_of_folowing_users = []

        for (let i = 0; i < user.following.length; i++) {

            const posts = await Post.find({ "author_id": user.following[i] })

            for (let ind = 0; ind < posts.length; ind++) {
                posts_of_folowing_users.push(posts[ind])
            }
        }

        res.status(200).json({ success: true, posts_of_folowing_users })
    } catch (error) {

        res.status(505).json({ success: false, message: "Internal server Error", error: error.message });
    }


})




module.exports = router;