import { RequestHandler } from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import UserModel from "models/user";
import AuthVerificationTokenModel from "models/authVerificationToken";
import { sendErrorRes } from "utils/helper";

const createNewUser: RequestHandler = async (req, res) => {

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

    // Generate, store, and send verification token
    const token = crypto.randomBytes(36).toString('hex');
    await AuthVerificationTokenModel.create({ owner: user._id, token })

    const link = `http://localhost:8000/verify?id=${user._id}&token=${token}`

    var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "92918adbeadd50",
            pass: "a330a86fb8e2c5"
        }
    });

    await transport.sendMail({
        from: "verification@smartcyclemarket.com",
        to: user.email,
        html: `<h1>Please click on <a href="${link}">this link</a> to verify your account.</h1>`
    })

    res.send({ message: "Account creation successful. Please check your mail for a verification link" });

}

export default createNewUser