import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const registerUser = asyncHandler(async (req, res) => {
    
    // STEPS TO REGISTER
    // get user details (sign up form data) from frontend
    // validation check - field empty or not
    // check if user already exists or not - username, email
    // check for images, check for avatar (cause avatar is required)
    // upload images to cloudinary , then check avatar again
    // create user object - create entry in db
    // remove password and refresh token from the response
    // check for user creation (if it is created or not)
    // return response

    const { fullname, email, username, password } = req.body
    console.log("request body",req.body);
    

    // THIS WAY ALL FIELDS CAN BE CHECKED ONCE (ADVANCED CODE)
    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required!")
    }

    // THIS WAY YOU HAVE TO CHECK ALL FIELDS ONE BY ONE
    // if(fullname){
    //     throw new ApiError(400, "fullname is required")
    // }


    // CHECKING IF USER ALREADY EXIST OR NOT

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    console.log("existing user", existedUser)
    if(existedUser){
        throw new ApiError(409, "User with email | username already exist")
    }

    // the file is still on the server it's not yet sent on cloudinary that is why it is localpath
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath  = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    // uploading on cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar is required")
    }


    // User is talking to db
    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    // checking if user is created or not
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!")
    )
    
})