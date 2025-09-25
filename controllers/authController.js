const { signupSchema, acceptFPCodeSchema } = require("../middlewares/validator");
const { doHash, hmacProcess } = require("../utils/hashing");
const User = require("../models/usersModel");
const jwt = require('jsonwebtoken');
const { signinSchema } = require("../middlewares/validator");
const { dohashValidation } = require("../utils/hashing");
const transport = require("../middlewares/sendMail");
const { acceptCodeSchema } = require("../middlewares/validator");
const { changePasswordSchema } = require("../middlewares/validator");



exports.signup = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signupSchema.validate({ email, password });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message })
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(401).json({ success: false, message: "User already exists!" });
        }

        const hashedPassword = await doHash(password, 12);

        const newUser = new User({
            email,
            password: hashedPassword,
        });
        const result = await newUser.save();
        result.password = undefined;
        res.status(201).json({
            success: true, message: "Account Created Successfully",
            result
        });
    } catch (error) {
        console.log(error);
    }
}

exports.signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signinSchema.validate({ email, password });
        // console.log(error);
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message })
        }

        const existingUser = await User.findOne({ email: email.trim() }).select("+password");
        console.log(existingUser);

        if (!existingUser) {
            return res.status(401).json({ success: false, message: "User does not exists!" });
        }
        const result = await dohashValidation(password, existingUser.password);
        if (!result) {
            return res.status(401).json({ success: false, message: "Invalid credentials!" });
        }
        const token = jwt.sign({
            userId: existingUser._id,
            email: existingUser.email,
            verified: existingUser.verified,
        },
            process.env.TOKEN_SECRET, { expiresIn: "30d" });

        res.cookie('Authorization', 'Bearer', token, {
            expires: new Date(Date.now() + 25892000000),
            httpOnly: process.env.NODE_ENV === 'production', secure: process.env.NODE_ENV === 'production'
        })
            .json({ success: true, message: "Logged in successfully", token });
    } catch (error) {
        console.log(error);
    }
}

exports.signout = async (req, res) => {
    res.clearCookie('Authorization').status(200).json({ success: true, message: 'Logged out successfully' });
}

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User does not exists!" });
        }

        if (existingUser.verified) {
            return res.status(400).json({ success: false, message: "User already verified" });
        }

        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Email Verification Code",
            html: `<h3>Your verification code is ${codeValue}</h3>`
        });

        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Verification code sent to your email address", codeValue });
        }

        res.status(500).json({ success: false, message: "Something went wrong. Please try again later" });

    } catch (error) {
        console.log(error);
    }
}

exports.verifyVerificationCode = async (req, res) => {
    const { email, providedCode } = req.body;
    try {
        const { error, value } = acceptCodeSchema.validate({ email, providedCode });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({ email }).select("+verificationCode +verificationCodeValidation");

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User does not exists!" });
        }
        if (existingUser.verified) {
            return res.status(400).json({ success: false, message: "User already verified" });
        }

        if (!existingUser.verificationCode || !existingUser.verificationCodeValidation) {
            return res.status(400).json({ success: false, message: "No valid verification code found. Please request for a new one" });
        }

        if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "The verification code has expired. Please request for a new one" });
        }

        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        if (hashedCodeValue === existingUser.verificationCode) {
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Email verified successfully" });
        }
        res.status(400).json({ success: false, message: "Invalid verification code" });
    } catch (error) {
        console.log(error);
    }
}

exports.chanegePassword = async (req, res) => {
    const { userId, verified } = req.user;
    const { oldPassword, newPassword } = req.body;
    try{
       const { error, value } = changePasswordSchema.validate({ oldPassword, newPassword });
       if (error) {
           return res.status(401).json({ success: false, message: error.details[0].message });
       }
       if(!verified){
        return res.status(403).json({success: false, message: "Please verify your email to change password"});
       }
       const existingUser = await User.findOne({_id: userId}).select("+password");
         if(!existingUser){ 
            return res.status(404).json({success: false, message: "User does not exists!"});
            }
       const result =  await dohashValidation(oldPassword, existingUser.password);
       if(!result){
        return res.status(401).json({success: false, message: "Old password is incorrect"});
       }

       const hashedPassword = await doHash(newPassword, 12);
         existingUser.password = hashedPassword;
            await existingUser.save();
            res.status(200).json({success: true, message: "Password changed successfully"});
        
    }catch(error){
        console.log(error);
    }
}

exports.sendForgetPasswordCode = async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User does not exists!" });
        }

        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Forget Password Code",
            html: `<h3>Your Forget Password code is ${codeValue}</h3>`
        });

        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.forgetPasswordCode = hashedCodeValue;
            existingUser.forgetPasswordCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Forget Password code sent to your email address", codeValue });
        }

        res.status(500).json({ success: false, message: "Something went wrong. Please try again later" });

    } catch (error) {
        console.log(error);
    }
}

exports.verifyForgetPasswordCode = async (req, res) => {
    const { email, providedCode, newPassword} = req.body;
    try {
        const { error, value } = acceptFPCodeSchema.validate({ email, providedCode, newPassword });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({ email }).select("+forgetPasswordCode + forgetPasswordCodeValidation");

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User does not exists!" });
        }
       
        if (!existingUser.forgetPasswordCode || !existingUser.forgetPasswordCodeValidation) {
            return res.status(400).json({ success: false, message: "No valid  code found. Please request for a new one" });
        }

        if (Date.now() - existingUser.forgetPasswordCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "The code has expired. Please request for a new one" });
        }

        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        if (hashedCodeValue === existingUser.forgetPasswordCode) {
            const hashedPassword = await doHash(newPassword, 12);
            existingUser.password = hashedPassword; 
            existingUser.forgetPasswordCode = undefined;
            existingUser.forgetPasswordCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Password Forget successfully" });
        }
        res.status(400).json({ success: false, message: "Invalid verification code" });
    } catch (error) {
        console.log(error);
    }
}