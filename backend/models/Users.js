import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true, // makes search faster
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    avatar: {
      type: String,
      default: "https://avatar.iran.liara.run/public/boy",
    },

    bio: {
      type: String,
      maxlength: 150,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },

    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);



// ------------------------------------------------
// INSTANCE METHODS
// ------------------------------------------------
// Note: Password hashing is done manually in auth-controller.js
// during registration and password reset for explicit control
userSchema.methods.createAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

userSchema.methods.createRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
  );
};

userSchema.methods.validateRefreshToken = function (token) {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    return null;
  }
};

userSchema.methods.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
