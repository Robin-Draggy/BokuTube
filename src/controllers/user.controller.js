import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Creating a generic model to generate that can be used many times
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // 🔥 safer update
    await User.findByIdAndUpdate(
      userId,
      {
        $set: { refreshToken },
      },
      { new: true }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("TOKEN ERROR:", error);
    throw new ApiError(500, error.message || "Token generation failed");
  }
};

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

  const { fullname, email, username, password } = req.body;

  // THIS WAY ALL FIELDS CAN BE CHECKED ONCE (ADVANCED CODE)
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  // THIS WAY YOU HAVE TO CHECK ALL FIELDS ONE BY ONE
  // if(fullname){
  //     throw new ApiError(400, "fullname is required")
  // }

  // CHECKING IF USER ALREADY EXIST OR NOT

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email | username already exist");
  }

  // the file is still on the server it's not yet sent on cloudinary that is why it is localpath
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath  = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // uploading on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  // User is talking to db
  const user = await User.create({
    fullname,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // checking if user is created or not
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully!"));
});

// STEPS TO LOGIN
// 1. req body -> body
// 2. check if there is username or email
// 3. find the user
// 4. password check
// 5. generate access & refresh Token
// 6. send cookie

export const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incommingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token invalid");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshTOken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // OPTIONAL(if there is confirm password)
  // checking if new and confirm password is same or not
  if (!(newPassword === confirmPassword)) {
    throw new ApiError(400, "New and confirm password did not match!");
  }

  if (oldPassword === newPassword) {
  throw new ApiError(400, "New password must be different from old password");
}

  // Getting the user
  const user = await User.findById(req.user?._id);
  // Checking the new password if it is okay or not from model user method isPasswordCorrect
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old Password did not match");
  }
  // if the password is correct then setting the new password to the user
  user.password = newPassword;
  // saving the user on database
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully!"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully!"));
});

export const updateAccount = asyncHandler(async (req, res) => {
  // getting the fields which can be updated
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required.");
  }

  // updating the fields using mongodb update method
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        // this is es6 syntax (if two are same then only one should be enough)
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(201)
    .json(new ApiResponse(201, user, "Account updated successfully!"));
});

export const updateAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

export const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image local file path not found.");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(400, "Error while uploading cover image on cloudinary.");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(201)
    .json(new ApiResponse(201, user, "Cover Image updated successfully!"));
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username not found!");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    // Counting how many subscriber and subscribed to channel
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelSubscribedTo: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        subscriberCOunt: 1,
        channelSubscribedTo: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(400, "Channel does not exist.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully!")
    );
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        // this videos is Video from model in db it is saved as videos
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  },
                },
              ],
            },
          },
          {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
          }
        ],
      },
    },
  ]);

  if(!user.length){
    throw new ApiError(400, "Watch history is not found!")
  }
  return res
  .status(200)
  .json(
    new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully!"
    )
  )
});

// THIS IS MORE OPTIMIZED WAY TO UPDATE COVER IMAGE
/*
export const updateCoverImage = asyncHandler(async (req, res) => {
    // 1. Check if user exists
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized: User not found");
    }

    // 2. Check if file exists
    if (!req.file || !req.file.path) {
        throw new ApiError(400, "No cover image file provided");
    }

    const coverImageLocalPath = req.file.path;

    // 3. Validate file type and size (cover images can be larger)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB for cover images
    
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
        fs.unlinkSync(coverImageLocalPath);
        throw new ApiError(400, "Invalid file type. Only JPEG, PNG, JPG, and WEBP are allowed");
    }
    
    if (req.file.size > maxFileSize) {
        fs.unlinkSync(coverImageLocalPath);
        throw new ApiError(400, "File too large. Maximum size is 10MB");
    }

    // 4. Get current user
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
        fs.unlinkSync(coverImageLocalPath);
        throw new ApiError(404, "User not found");
    }

    // 5. Upload to Cloudinary with cover image specific options
    const coverImage = await uploadOnCloudinary(coverImageLocalPath, {
        folder: "cover-images",
        transformation: [
            { width: 1920, height: 1080, crop: "fill" }, // 16:9 aspect ratio
            { quality: "auto" },
            { fetch_format: "auto" }
        ]
    });

    if (!coverImage || !coverImage.url) {
        fs.unlinkSync(coverImageLocalPath);
        throw new ApiError(500, "Error while uploading cover image to Cloudinary");
    }

    // 6. Delete old cover image from Cloudinary (optional but saves costs)
    if (currentUser.coverImage && currentUser.coverImage.includes("cloudinary")) {
        const publicId = currentUser.coverImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`cover-images/${publicId}`);
    }

    // 7. Update user with new cover image
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url,
                coverImagePublicId: coverImage.public_id
            }
        },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    // 8. Clean up local file
    fs.unlinkSync(coverImageLocalPath);

    // 9. Return response
    return res.status(200).json(
        new ApiResponse(200, user, "Cover image updated successfully")
    );
});
*/
