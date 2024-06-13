import nodemailer from "nodemailer";


export async function sendMail(email: string, subject: string, link: string,) {

    const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.USER,
            pass: process.env.PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.USER,
        to: email,
        subject: subject,
        text: "Hello",
        html: `<p>${link}</p>`
    };

    try {
        await transport.sendMail(mailOptions)
    } catch (error) {
        console.log(error);
    }
}
