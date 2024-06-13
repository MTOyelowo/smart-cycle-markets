import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
require("dotenv").config()

const ses = new SESClient({});

function createSendEmailCommand(toAddress: string, fromAddress: string, message: string, subject: string) {
    return new SendEmailCommand({
        Destination: {
            ToAddresses: [toAddress],
        },
        Source: fromAddress,
        Message: {
            Subject: {
                Charset: "UTF-8",
                Data: subject
            },
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data: message
                }
            }
        }
    })
}

export async function sendPasswordResetLink(email: string, link: string) {
    const command = createSendEmailCommand(email, "mtoyelowo@gmail.com", link, "Password Reset Link")

    try {
        return await ses.send(command)
    } catch (e) {
        return e;
    }
}