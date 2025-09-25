const Post = require('../models/postsModel');
const { createPostSchema } = require('../middlewares/validator');


exports.getPosts = async(req, res) => {
    const {page} = req.query;
    const postsPerPage = 10;

    try {
        let pageNum = 0;
        if(page <= 1){
            pageNum = 0;
        }else{
            pageNum = page-1;
        }

        const result = await Post.find().sort({createdAt: -1}).skip(pageNum * postsPerPage).limit(postsPerPage).populate({path: 'userId', select: 'email'});
       res.status(200).json({success: true, message: "All the Posts" , data: result});
    } catch (error) {
        console.error(error);
    }
}

exports.createPost = async(req, res) => {
    const {title, description} = req.body;
    const {userId} = req.user;
    // console.log(userId);
    try {
     const { error, value } = createPostSchema.validate({ title, description, userId });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }   
        const result = new Post({
            title,
            description,    
            userId
        });
        await result.save();
        res.status(201).json({success: true, message: "Post created successfully", data: result});
    } catch (error) {
        console.error(error);
    }
}

exports.singlePost = async(req, res) => {
    // const {_id} = req.query;
    const id = req.params.id;
    const _id = id;
    
    try {
       const result = await Post.findById({_id})
       .populate({path: 'userId', select: 'email'});
       res.status(200).json({success: true, message: "Single Post" , data: result});
    } catch (error) {
        console.error(error);
    }
}

exports.updatePost = async(req, res) => {
    const {_id} = req.query;
    const { title, description} = req.body;
    const {userId} = req.user;

    try {
        const { error, value } = createPostSchema.validate({ title, description, userId });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        const existingPost = await Post.findOne({_id});
        if(!existingPost){
            return res.status(404).json({success: false, message: "Post not found"});
        }   
        if(existingPost.userId.toString() !== userId){
            return res.status(403).json({success: false, message: "You are not authorized to update this post"});
        }  
        existingPost.title = title;
        existingPost.description = description;
        await existingPost.save();
        res.status(200).json({success: true, message: "Post updated successfully", data: existingPost});
    } catch (error) {       
        console.error(error);
    }
}

exports.deletePost = async(req, res) => {
    const {_id} = req.query;
    const {userId} = req.user;  
    try {
        const existingPost = await Post.findOne({_id});
        if(!existingPost){
            return res.status(404).json({success: false, message: "Post not found"});
        }   
        if(existingPost.userId.toString() !== userId){
            return res.status(403).json({success: false, message: "You are not authorized to delete this post"});
        }
        await Post.deleteOne({_id});
        res.status(200).json({success: true, message: "Post deleted successfully", data: existingPost});
    } catch (error) {
        console.error(error);
    }       
}