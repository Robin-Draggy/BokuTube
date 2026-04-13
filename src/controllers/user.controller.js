import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';


// Creating a generic model to generate that can be used many times
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new Error("User not found")
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // 🔥 safer update
        await User.findByIdAndUpdate(
            userId,
            {
                $set: { refreshToken }
            },
            { new: true }
        )

        return { accessToken, refreshToken }

    } catch (error) {
        console.error("TOKEN ERROR:", error)
        throw new ApiError(500, error.message || "Token generation failed")
    }
}

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


// STEPS TO LOGIN
// 1. req body -> body
// 2. check if there is username or email
// 3. find the user 
// 4. password check
// 5. generate access & refresh Token
// 6. send cookie


export const loginUser = asyncHandler(async (req, res) =>{


    const {email, username, password} = req.body

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }
   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out")
    )
})


export const refreshAccessToken = asyncHandler( async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incommingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id);
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incommingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Refresh token invalid")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res 
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshTOken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token")
    }
})