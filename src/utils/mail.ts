import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
    // host: "sandbox.smtp.mailtrap.io",
    service: "gmail",
    //port: 2525,
    auth: {
        user: process.env.USER,
        pass: process.env.PASSWORD
        // user: process.env.MAIL_TRAP_USER,
        // pass: process.env.MAIL_TRAP_PASS
    }
});

const sendVerification = async (email: string, link: string) => {
    await transport.sendMail({
        from: "verification@smartcyclemarket.com",
        to: email,
        subject: "Email Verification Link",
        html: `<h1>Please click on <a href="${link}">this link</a> to verify your account.</h1>`
    })
};

const sendPasswordResetLink = async (email: string, link: string) => {
    await transport.sendMail({
        from: "security@smartcyclemarket.com",
        to: email,
        subject: "Password Reset Link",
        html: `<h1>Please click on <a href="${link}">this link</a> to reset your password.</h1>`
    })
};

const sendPasswordUpdateMessage = async (email: string) => {
    await transport.sendMail({
        from: "security@smartcyclemarket.com",
        to: email,
        subject: "Password update message",
        html: `<h1>Password updated. Proceed to log in to your account</h1>`
    })
};

const mail = {
    sendVerification,
    sendPasswordResetLink,
    sendPasswordUpdateMessage,
}

export default mail;