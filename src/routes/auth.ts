import { Router } from 'express';
import { createNewUser, generateForgotPasswordLink, generateVerificationLink, grantAccessToken, grantValidPasswordResetLink, sendProfile, sendPublicProfile, signIn, signOut, updateAvatar, updatePassword, updateProfile, verifyEmail } from 'controllers/auth';
import validate from 'middleware/validator';
import { newUserSchema, resetPasswordSchema, verifyTokenSchema } from 'utils/validationSchema';
import { isAuth } from 'middleware/isAuth';
import { isValidPasswordResetToken } from 'middleware/isValidPasswordResetToken';
import fileParser from 'middleware/fileParser';

const authRouter = Router();

authRouter.post('/sign-up', validate(newUserSchema), createNewUser);
authRouter.post('/verify', validate(verifyTokenSchema), verifyEmail);
authRouter.post('/sign-in', signIn);
authRouter.post('/refresh-token', grantAccessToken);
authRouter.post('/sign-out', isAuth, signOut);
authRouter.post('/forgot-password', generateForgotPasswordLink);
authRouter.post('/verify-password-reset-token', validate(verifyTokenSchema), isValidPasswordResetToken, grantValidPasswordResetLink);
authRouter.post('/reset-password', validate(resetPasswordSchema), isValidPasswordResetToken, updatePassword);
authRouter.get('/verify-token', isAuth, generateVerificationLink);
authRouter.get('/profile', isAuth, sendProfile);
authRouter.get('/profile/:id', isAuth, sendPublicProfile);
authRouter.patch('/update-profile', isAuth, updateProfile);
authRouter.patch('/update-avatar', isAuth, fileParser, updateAvatar);

export default authRouter;