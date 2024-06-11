// import { RequestHandler } from "express";
// import { sendErrorRes } from "src/utils/helper";
// import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
// import PasswordResetTokenModel from "models/passwordResetToken";

// interface UserProfile {
//     id: string;
//     name: string;
//     email: string;
//     verified: boolean;
// }

// declare global {
//     namespace Express {
//         interface Request {
//             user: UserProfile
//         }
//     }
// }

// export const isValidPasswordResetToken: RequestHandler = async (req, res, next) => {

//     //Read token and id
//     const { id, token } = req.body;

//     //Find token inside of the database and send error if no token
//     const resetPasswordToken = await PasswordResetTokenModel.findOne({ owner: id });
//     if (!resetPasswordToken) return sendErrorRes(res, "Unauthorized request", 401);

//     //Compare token with encrypted value and send error if not matched
//     const isMatched = await resetPasswordToken.compareToken(token);
//     if (!isMatched) return sendErrorRes(res, "Unauthorized request. Invalid token", 403);

//     next()
// }