// import { RequestHandler } from "express";
// import { sendErrorRes } from "src/utils/helper";
// import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
// import UserModel from "models/user";

// interface UserProfile {
//     id: string;
//     name: string;
//     email: string;
//     verified: boolean;
//     avatar?: string;
// }

// declare global {
//     namespace Express {
//         interface Request {
//             user: UserProfile;
//         }
//     }
// }

// const JWT_SECRET = process.env.JWT_SECRET!
// export const isAuth: RequestHandler = async (req, res, next) => {
//     try {
//         //Read authorization header, see if we have the token and send error if no token
//         const authToken = req.headers.authorization;
//         if (!authToken) return sendErrorRes(res, "Unauthorised request", 403);

//         //Verify the token and get user id from token
//         const token = authToken.split("Bearer ")[1]
//         const payload = jwt.verify(token, JWT_SECRET) as { id: string }

//         //Check for user with id. Send error if no user
//         const user = await UserModel.findById(payload.id)
//         if (!user) return sendErrorRes(res, "Unauthorized request", 403)

//         //Attach user profile inside req object
//         req.user = {
//             id: user._id,
//             name: user.name,
//             email: user.email,
//             verified: user.verified,
//             avatar: user.avatar?.url
//         }
//         next()

//     } catch (error) {
//         if (error instanceof TokenExpiredError) {
//             return sendErrorRes(res, "Session expired", 401)
//         }

//         if (error instanceof JsonWebTokenError) {
//             return sendErrorRes(res, "Unauthorized access", 401)
//         }

//         next(error);
//     }

//     //Handle error for expired tokens
// }