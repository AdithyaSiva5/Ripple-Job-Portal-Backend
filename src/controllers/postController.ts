import Post from "../models/post/postModel";
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Report from "../models/reports/reportModel";
import { createNotification } from "../utils/notificationSetter";
import Notification from "../models/notifications/notificationsModel";

// @desc    Create new post
// @route   POST /post/create-post
// @access  Public

export const addPost = asyncHandler(async (req: Request, res: Response) => {
  const { userId, imageUrl,title, description ,hideLikes,hideComment } = req.body;
    console.log(userId,imageUrl, description,hideLikes,hideComment)
  if (!userId || !imageUrl || !description) {
    res.status(400);
    throw new Error("Provide all details");
  }
  const post = await Post.create({
    userId,
    imageUrl,
    title,
    description,
    hideComment,
    hideLikes,
  });

  if (!post) {
    res.status(400);
    throw new Error("Cannot add post");
  }

  const posts = await Post.find({userId:userId, isBlocked: false, isDeleted:false  }).populate({
    path: 'userId',
    select: 'username profileImageUrl'
  }).sort({date:-1});

  if (posts.length==0) {
    res.status(400);
    throw new Error("No Post available");
  }
  


  res.status(200).json({ message: "Post added successfully",posts:posts});
});

// @desc    Get all Posts
// @route   get /post/get-post
// @access  Public

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const posts = await Post.find({ isBlocked: false, isDeleted: false })
    .populate({
      path: 'userId',
      select: 'username profileImageUrl'
    })
    .populate({
      path: 'likes',
      select: 'username profileImageUrl'
    })
    .sort({ date: -1 });

  res.status(200).json(posts);
});



  // @desc    Get User Posts
// @route   get /post/get-post
// @access  Public

export const getUserPost = asyncHandler(async (req: Request, res: Response) => {

  
  
  const id = req.body.userId;
  console.log(id);
  
  

  const posts = await Post.find({userId:id, isBlocked: false, isDeleted:false  }).populate({
    path: 'userId',
    select: 'username profileImageUrl'
  }).sort({date:-1});

  if (posts.length==0) {
    res.status(400);
    throw new Error("No Post available");
  }
  
  res.status(200).json(posts);

});

// @desc    Edit Post
// @route   POST /post/update-post
// @access  Public

export const editPost = asyncHandler(async (req: Request, res: Response) => {
  
  const {userId,postId,title, description, hideComment, hideLikes } = req.body;
  const post = await Post.findById(postId);
  if (!post) {
    res.status(400);
    throw new Error("Post cannot be found");
  }

  if (title) post.title = title;
  if (description) post.description = description;
  if (hideComment !== undefined) post.hideComment = hideComment;
  if (hideLikes !== undefined) post.hideLikes = hideLikes;

  await post.save();
  
  const posts = await Post.find({userId:userId, isBlocked: false, isDeleted:false  }).populate({
    path: 'userId',
    select: 'username profileImageUrl'
  }).sort({date:-1});
  res.status(200).json(posts);

  
  

  
});


// @desc    Delete Post
// @route   POST /post/delete-post
// @access  Public
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
    
  const {postId,userId} = req.body;
  console.log(postId,userId)
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      throw new Error("Post Cannot be found")
    }

    post.isDeleted = true;
    await post.save();
    const posts = await Post.find({userId:userId, isBlocked: false,isDeleted:false }).populate({
      path: 'userId',
      select: 'username profileImageUrl'
    }).sort({date:-1});

    res.status(200).json({ posts });
  
});

// @desc    Like Post
// @route   POST /post/like-post
// @access  Public

export const likePost = asyncHandler(async (req: Request, res: Response) => {
  const { postId, userId } = req.body;
  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const isLiked = post.likes.includes(userId);

  if (isLiked) {
  
    await Post.findOneAndUpdate({_id: postId}, {$pull: {likes: userId}}, {new: true})
    await Notification.findOneAndDelete({senderId:userId,receiverId:post.userId,message:'liked your post'})

  } else {
    const notificationData = {
      senderId:userId,
      receiverId: post.userId,
      message: 'liked your post',
      link: `/visit-profile/posts/${post.userId}`, 
      read: false, 
      postId:postId
    };

    createNotification(notificationData)
 
    await Post.findOneAndUpdate({_id: postId}, {$push: {likes: userId }}, {new: true})
  }


  const posts = await Post.find({userId:userId, isBlocked: false,isDeleted:false }).populate({
    path: 'userId',
    select: 'username profileImageUrl'
  }).sort({date:-1});

  res.status(200).json({ posts });
});

// @desc   Post Report
// @route   POST /post/Report-Post
// @access  Public

export const reportPostController = asyncHandler(async (req : Request , res : Response)=>{
  const { userId , postId , cause} = req.body;
  const existingReport = await Report.findOne({ userId, postId });
  if(existingReport){
    res.status(400);
    throw new Error("You have already reported this post")
  }
  const report = new Report({
    userId,
    postId,
    cause
  })

  await report.save();
  
  const reportCount = await Report.countDocuments({ postId })

  const REPORT_THRESHOLD = 3;

  if(reportCount >= REPORT_THRESHOLD){
    await Post.findByIdAndUpdate(postId, {isBlocked: true})
    res
      .status(200)
      .json({message : "Your Post has been blocked due to multiple reports"});
    return;
  }
  res.status(200).json({message: "Post has been reported successfully"})
})