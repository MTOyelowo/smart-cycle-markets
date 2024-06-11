import { RequestHandler } from "express";
import { sendErrorRes } from "src/utils/helper";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import UserModel from "models/user";
import PasswordResetTokenModel from "src/models/passwordResetToken";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    verified: boolean;
    avatar?: string;
}

declare global {
    namespace Express {
        interface Request {
            user: UserProfile;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET!
export const isAuth: RequestHandler = async (req, res, next) => {
    try {
        //Read authorization header, see if we have the token and send error if no token
        const authToken = req.headers.authorization;
        if (!authToken) return sendErrorRes(res, "Unauthorised request", 403);

        //Verify the token and get user id from token
        const token = authToken.split("Bearer ")[1]
        const payload = jwt.verify(token, JWT_SECRET) as { id: string }

        //Check for user with id. Send error if no user
        const user = await UserModel.findById(payload.id)
        if (!user) return sendErrorRes(res, "Unauthorized request", 403)

        //Attach user profile inside req object
        req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            verified: user.verified,
            avatar: user.avatar?.url
        }
        next()

    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return sendErrorRes(res, "Session expired", 401)
        }

        if (error instanceof JsonWebTokenError) {
            return sendErrorRes(res, "Unauthorized access", 401)
        }

        next(error);
    }

    //Handle error for expired tokens
}

export const isValidPasswordResetToken: RequestHandler = async (req, res, next) => {

    //Read token and id
    const { id, token } = req.body;

    //Find token inside of the database and send error if no token
    const resetPasswordToken = await PasswordResetTokenModel.findOne({ owner: id });
    if (!resetPasswordToken) return sendErrorRes(res, "Unauthorized request", 401);

    //Compare token with encrypted value and send error if not matched
    const isMatched = await resetPasswordToken.compareToken(token);
    if (!isMatched) return sendErrorRes(res, "Unauthorized request. Invalid token", 403);

    next()
}