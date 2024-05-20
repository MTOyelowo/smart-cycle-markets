import { RequestHandler } from "express";
import crypto from "crypto";
import UserModel from "models/user";
import AuthVerificationTokenModel from "models/authVerificationToken";
import { sendErrorRes } from "utils/helper";
import jwt from "jsonwebtoken";
import mail from "utils/mail";
import PasswordResetTokenModel from "src/models/passwordResetToken";

import { isValidObjectId } from "mongoose";
import cloudUploader from "src/cloudinary";

const VERIFICATION_LINK = process.env.VERIFICATION_LINK;
const PASSWORD_RESET_LINK = process.env.PASSWORD_RESET_LINK;
const JWT_SECRET = process.env.JWT_SECRET!;

export const createNewUser: RequestHandler = async (req, res) => {
    // Read incoming data
    const { name, email, password } = req.body

    // Validate data and send error.
    if (!name) return sendErrorRes(res, "Name is a required field", 422);
    if (!email) return sendErrorRes(res, "Email is a required field", 422);
    if (!password) return sendErrorRes(res, "Password is a required field", 422);

    //Check unique user in db before saving
    const existingUser = await UserModel.findOne({ email })
    if (existingUser) return sendErrorRes(res, "User with email already exists!", 401);
    const user = await UserModel.create({ name, email, password })
    user.comparePassword(password)

    // Generate, store, and send verification token/link
    const token = crypto.randomBytes(36).toString('hex');
    await AuthVerificationTokenModel.create({ owner: user._id, token })

    const link = `${VERIFICATION_LINK}?id=${user._id}&token=${token}`

    // var transport = nodemailer.createTransport({
    //     host: "sandbox.smtp.mailtrap.io",
    //     port: 2525,
    //     auth: {
    //         user: "92918adbeadd50",
    //         pass: "a330a86fb8e2c5"
    //     }
    // });

    // await transport.sendMail({
    //     from: "verification@smartcyclemarket.com",
    //     to: user.email,
    //     html: `<h1>Please click on <a href="${link}">this link</a> to verify your account.</h1>`
    // })

    await mail.sendVerification(user.email, link)

    res.send({ message: "Account creation successful. Please check your mail for a verification link" });

}

export const verifyEmail: RequestHandler = async (req, res) => {
    //Read incoming verification data
    const { id, token } = req.body;

    //Find the token from db using owner id (Send error is not found)
    const authToken = await AuthVerificationTokenModel.findOne({ owner: id })
    if (!authToken) return sendErrorRes(res, "Unauthorized request", 403);

    //Check is token is valid (Send error is not valid)
    const isMatched = await authToken.compareToken(token);
    if (!isMatched) return sendErrorRes(res, "Unauthorized request. Invalid token", 403);

    //Update user is verified
    await UserModel.findByIdAndUpdate(id, { verified: true })

    //Remove token from database
    await AuthVerificationTokenModel.findByIdAndDelete(authToken._id)

    //Send success message
    res.json({ message: "Thank you for signing up! Your email is now verified" })
}

export const generateVerificationLink: RequestHandler = async (req, res) => {
    //Check if user is Authenticated
    const { id } = req.user

    //Remove previous token if any

    await AuthVerificationTokenModel.findOneAndDelete({ owner: id })

    //Create and store new token then send back a response
    const token = crypto.randomBytes(36).toString('hex');
    const link = `${VERIFICATION_LINK}?id=${id}&token=${token}`

    await AuthVerificationTokenModel.create({ owner: id, token })
    await mail.sendVerification(req.user.email, link)

    res.json({ message: "Please check your mail inbox for verification link" })
}

export const signIn: RequestHandler = async (req, res) => {
    //Read incoming data (email and password)
    const { email, password } = req.body;

    //Find the user with provided email and send error if user not found
    const user = await UserModel.findOne({ email });
    if (!user) return sendErrorRes(res, "Invalid email or password", 403);

    //Check if password is valid or not and send error if not
    const isMatched = await user.comparePassword(password);
    if (!isMatched) return sendErrorRes(res, "Invalid email or password", 403);

    //Generate access and refresh tokens

    const payload = { id: user._id };
    const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: "15m"
    });
    const refreshToken = jwt.sign(payload, JWT_SECRET);

    //Store refresh token in db
    if (!user.tokens) user.tokens = [refreshToken];
    else user.tokens.push(refreshToken);

    await user.save();

    //Send both access and refresh token to user
    res.json({
        profile: {
            id: user._id,
            email: user.email,
            name: user.name,
            verified: user.verified
        },
        tokens: { refresh: refreshToken, access: accessToken }
    });
};

export const sendProfile: RequestHandler = async (req, res) => {
    res.json({
        profile: req.user
    })
}

export const grantAccessToken: RequestHandler = async (req, res) => {
    //Read and verify refresh token
    const { refreshToken } = req.body;
    if (!refreshToken) return sendErrorRes(res, "Unauthorized request!", 403);

    const payload = jwt.verify(refreshToken, JWT_SECRET) as { id: string }

    //Find user with payload.id and refresh token. If the refresh token is valid and no user found, token is compromised so remove all the previous tokens and send error response
    if (!payload.id) return sendErrorRes(res, "Unauthorized request", 401);

    const user = await UserModel.findOne({
        _id: payload.id,
        tokens: refreshToken
    })

    if (!user) {
        // Potential compromise, remove all previous tokens
        await UserModel.findByIdAndUpdate(payload.id, { tokens: [] });
        return sendErrorRes(res, "Unauthorized request", 401);
    }

    //If token is valid and user found, create new refresh token and access token
    const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: "15m",
    });
    const newRefreshToken = jwt.sign({ id: user._id }, JWT_SECRET);

    //Remove previous token, update user and send new tokens
    user.tokens = user.tokens.filter((token) => token !== refreshToken)
    user.tokens.push(newRefreshToken);
    await user.save();

    res.json({
        tokens: { access: newAccessToken, refresh: newRefreshToken }
    });


}

export const signOut: RequestHandler = async (req, res) => {
    //Remove refresh token
    const { refreshToken } = req.body;
    const user = await UserModel.findOne({ _id: req.user.id, tokens: refreshToken });
    if (!user) return sendErrorRes(res, "Unauthorized request! User not found", 403);

    const newTokens = user.tokens.filter(token => token !== refreshToken)
    user.tokens = newTokens
    await user.save()

    res.send();

}

export const generateForgotPasswordLink: RequestHandler = async (req, res) => {
    //Read user email. Find user with given email and send message if not found
    const { email } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) return sendErrorRes(res, "Link will be sent to the mail provided if the account exists", 200);

    //Remove reset password token, if any and generate new reset password token
    await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });

    const token = crypto.randomBytes(36).toString("hex");
    await PasswordResetTokenModel.create({ owner: user._id, token })

    //Generate reset password link and send to user mail
    const passwordResetLink = `${PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`
    mail.sendPasswordResetLink(user.email, passwordResetLink)

    //Send response
    res.json({
        message: "Reset link has been sent to your email"
    });


}

export const grantValidPasswordResetLink: RequestHandler = async (req, res) => {
    res.json({ valid: true })
}

export const updatePassword: RequestHandler = async (req, res) => {
    //Read and validate user id, reset passeord token and password. Find User from db
    const { id, password } = req.body;
    const user = await UserModel.findById(id);
    if (!user) return sendErrorRes(res, "Unauthorized access", 403);

    //Check if user is using same password as previous password. Send error if needed
    const isMatched = await user.comparePassword(password);
    if (isMatched) return sendErrorRes(res, "New password should be something different", 422)

    //Update new password and remove password reset token. Send mail
    user.password = password;
    await user.save();

    await PasswordResetTokenModel.findOneAndDelete({ owner: user._id })

    await mail.sendPasswordUpdateMessage(user.email)

    res.json({ message: "Password reset successful!" })
}

export const updateProfile: RequestHandler = async (req, res) => {
    const { name } = req.body;

    if (typeof name !== "string" || name.trim().length < 3) {
        return sendErrorRes(res, "Name is invalid!", 422)
    }

    await UserModel.findByIdAndUpdate(req.user.id, { name })

    res.json({ profile: { ...req.user, name } })
}

export const updateAvatar: RequestHandler = async (req, res) => {
    //Read incoming file/files and check for singularity and type validiity

    const { avatar } = req.files
    if (Array.isArray(avatar)) {
        return sendErrorRes(res, "Multiple files are not allowed", 422)
    }

    if (!avatar.mimetype?.startsWith("image")) {
        return sendErrorRes(res, "Invalid image file", 422)
    }
    //Find user and check the for avatar and remove it there is
    const user = await UserModel.findById(req.user.id)

    if (!user) {
        return sendErrorRes(res, "User not found", 404)
    }

    if (user.avatar?.id) {
        //Remove avatar file
        await cloudUploader.destroy(user.avatar.id)
    }

    const { secure_url: url, public_id: id } = await cloudUploader.upload(avatar.filepath,
        {
            width: 300,
            height: 300,
            crop: "thumb",
            gravity: "face"
        }

    )
    user.avatar = { url, id }
    await user.save()


    res.json({
        profile: {
            ...req.user, avatar: user.avatar.url
        }
    })
}

export const sendPublicProfile: RequestHandler = async (req, res) => {
    const profileId = req.params.id
    if (!isValidObjectId(profileId)) {
        return sendErrorRes(res, "Invalid profile id!", 422)
    }

    const user = await UserModel.findById(profileId);
    if (!user) {
        return sendErrorRes(res, "User not found!", 404)
    }
    res.json({ profile: { id: user._id, name: user.name, avatar: user.avatar?.url } })

}