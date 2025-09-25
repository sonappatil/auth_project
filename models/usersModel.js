
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email is already registered'],
        trim: true,
        minLength: [5, 'Email must be at least 5 characters long'],
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password must be provided'],
        trim: true,
        select: false,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    verificationCode: {
        type: String,
        select: false,
    },
    verificationCodeValidation: {
        type: Number,
        select: false,
    },
    forgetPasswordCode: {
        type: String,
        select: false,
    },
    forgetPasswordCodeValidation: {
        type: Number,
        select: false,
    },
},
    {
        timestamps: true
    });

module.exports = mongoose.model("User", userSchema);