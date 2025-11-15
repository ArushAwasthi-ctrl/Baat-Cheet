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
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    avatar: {
      type: String,
      default:
        "https://www.freepik.com/free-vector/user-blue-gradient_145856969.htm#fromView=keyword&page=1&position=0&uuid=a41547ff-3562-4842-bbbe-55daf1aa5f92&query=User+avatar",
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

// ------------------------------
//  OPTIMIZED INDEXES
// ------------------------------

// // ------------------------------------------
// //  PASSWORD HASHING MIDDLEWARE (BEST PRACTICE)
// // ------------------------------------------
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);

//   next();
// });

// ------------------------------------------------
//  INSTANCE METHODS: TOKEN CREATION & VALIDATION
// ------------------------------------------------
userSchema.methods.createAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

userSchema.methods.createRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

// Safely validate refresh token (no crashing)
userSchema.methods.validateRefreshToken = function (token) {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (e) {
    return null;
  }
};

// ------------------------------------------------
//  PASSWORD VALIDATION
// ------------------------------------------------
userSchema.methods.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
