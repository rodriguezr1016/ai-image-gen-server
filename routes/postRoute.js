import express from 'express';
import * as dotenv from 'dotenv';
import {v2 as cloudinary} from 'cloudinary';
import Post from '../mongodb/models/post.js';
import Like from '../mongodb/models/like.js';
import authMiddleware from '../middleware/auth.js'
dotenv.config();

const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.route('/').get(async (req, res) => {
    try {
        const posts = await Post.find({})
        res.status(200).json({success: true, data:posts})
    } catch (error) {
        res.status(500).json({success: false, message:error})
    }
})

router.use(authMiddleware);
router.route('/:userId').get( authMiddleware, async (req, res) => {
    try {
        const posts = await Post.find({author: req.params.userId})
        res.status(200).json({success: true, data:posts})
    } catch (error) {
        res.status(500).json({success: false, message:error})
    }
})
router.route('/').post(authMiddleware, async (req, res) => {
    try {
        const {name, prompt, photo, userId} = req.body;
    const photoURL = await cloudinary.uploader.upload(photo);
    const newPost = await Post.create({
        name,
        prompt,
        photo: photoURL.url,
        author: userId,
    })
    res.status(201).json({success: true, data: newPost});
    } catch (error) {
        res.status(500).json({success: false, message: error})
    }
})
router.route('/:postId/like').post(authMiddleware,async (req, res) => {
    const {userId} = req.user;
    const {postId} = req.params;
    try {
        const existingLike = await Like.findOne({user: userId, post: postId});
        if(existingLike){

            await Like.deleteOne({ user: userId, post: postId });
      res.status(200).json({ message: 'Like removed'});
        } else{
            const newLike = await Like.create({user: userId, post: postId})
            console.log(newLike)
        } 
        res.status(200).json({message: 'Post liked', data: existingLike})
    } catch (error) {
        console.log(error);
        
    }
})
router.route('/:userId/likes').get(authMiddleware, async (req, res)=>{
    const {userId} = req.params;
    try {
        const likes = await Like.find({ user: userId }).populate('post');
        const likedPosts = likes.map(like => like.post); // Extract the post property
        res.status(200).json({ success: true, data: likedPosts });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch likes', error: error.message });
      }
})

export default router;