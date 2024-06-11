"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPublicProfile = exports.updateAvatar = exports.updateProfile = exports.updatePassword = exports.grantValidPasswordResetLink = exports.generateForgotPasswordLink = exports.signOut = exports.grantAccessToken = exports.sendProfile = exports.signIn = exports.generateVerificationLink = exports.verifyEmail = exports.createNewUser = void 0;
const crypto_1 = __importDefault(require("crypto"));
const user_1 = __importDefault(require("../src/models/user"));
const authVerificationToken_1 = __importDefault(require("../src/models/authVerificationToken"));
const helper_1 = require("../src/utils/helper");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mail_1 = __importDefault(require("../src/utils/mail"));
const passwordResetToken_1 = __importDefault(require("../src/models/passwordResetToken"));
const mongoose_1 = require("mongoose");
const cloudinary_1 = __importDefault(require("../src/cloudinary"));
const VERIFICATION_LINK = process.env.VERIFICATION_LINK;
const PASSWORD_RESET_LINK = process.env.PASSWORD_RESET_LINK;
const JWT_SECRET = process.env.JWT_SECRET;
const createNewUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    if (!name)
        return (0, helper_1.sendErrorRes)(res, "Name is a required field", 422);
    if (!email)
        return (0, helper_1.sendErrorRes)(res, "Email is a required field", 422);
    if (!password)
        return (0, helper_1.sendErrorRes)(res, "Password is a required field", 422);
    const existingUser = yield user_1.default.findOne({ email });
    if (existingUser)
        return (0, helper_1.sendErrorRes)(res, "User with email already exists!", 401);
    const user = yield user_1.default.create({ name, email, password });
    user.comparePassword(password);
    const token = crypto_1.default.randomBytes(36).toString('hex');
    yield authVerificationToken_1.default.create({ owner: user._id, token });
    const link = `${VERIFICATION_LINK}?id=${user._id}&token=${token}`;
    yield mail_1.default.sendVerification(user.email, link);
    res.send({ message: "Account creation successful. Please check your mail for a verification link" });
});
exports.createNewUser = createNewUser;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, token } = req.body;
    const authToken = yield authVerificationToken_1.default.findOne({ owner: id });
    if (!authToken)
        return (0, helper_1.sendErrorRes)(res, "Unauthorized request", 403);
    const isMatched = yield authToken.compareToken(token);
    if (!isMatched)
        return (0, helper_1.sendErrorRes)(res, "Unauthorized request. Invalid token", 403);
    yield user_1.default.findByIdAndUpdate(id, { verified: true });
    yield authVerificationToken_1.default.findByIdAndDelete(authToken._id);
    res.json({ message: "Thank you for signing up! Your email is now verified" });
});
exports.verifyEmail = verifyEmail;
const generateVerificationLink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    yield authVerificationToken_1.default.findOneAndDelete({ owner: id });
    const token = crypto_1.default.randomBytes(36).toString('hex');
    const link = `${VERIFICATION_LINK}?id=${id}&token=${token}`;
    yield authVerificationToken_1.default.create({ owner: id, token });
    yield mail_1.default.sendVerification(req.user.email, link);
    res.json({ message: "Please check your mail inbox for verification link" });
});
exports.generateVerificationLink = generateVerificationLink;
const signIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password } = req.body;
    const user = yield user_1.default.findOne({ email });
    if (!user)
        return (0, helper_1.sendErrorRes)(res, "Invalid email or password", 403);
    const isMatched = yield user.comparePassword(password);
    if (!isMatched)
        return (0, helper_1.sendErrorRes)(res, "Invalid email or password", 403);
    const payload = { id: user._id };
    const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: "15m"
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
    if (!user.tokens)
        user.tokens = [refreshToken];
    else
        user.tokens.push(refreshToken);
    yield user.save();
    res.json({
        profile: {
            id: user._id,
            email: user.email,
            name: user.name,
            verified: user.verified,
            avatar: (_a = user.avatar) === null || _a === void 0 ? void 0 : _a.url
        },
        tokens: { refresh: refreshToken, access: accessToken }
    });
});
exports.signIn = signIn;
const sendProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({
        profile: req.user
    });
});
exports.sendProfile = sendProfile;
const grantAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { refreshToken } = req.body;
    if (!refreshToken)
        return (0, helper_1.sendErrorRes)(res, "Unauthorized request!", 403);
    const payload = jsonwebtoken_1.default.verify(refreshToken, JWT_SECRET);
    if (!payload.id)
        return (0, helper_1.sendErrorRes)(res, "Unauthorized request", 401);
    const user = yield user_1.default.findOne({
        _id: payload.id,
        tokens: refreshToken
    });
    if (!user) {
        yield user_1.default.findByIdAndUpdate(payload.id, { tokens: [] });
        return (0, helper_1.sendErrorRes)(res, "Unauthorized request", 401);
    }
    const newAccessToken = jsonwebtoken_1.default.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: "15m",
    });
    const newRefreshToken = jsonwebtoken_1.default.sign({ id: user._id }, JWT_SECRET);
    user.tokens = user.tokens.filter((token) => token !== refreshToken);
    user.tokens.push(newRefreshToken);
    yield user.save();
    res.json({
        profile: {
            id: user._id,
            email: user.email,
            name: user.name,
            verified: user.verified,
            avatar: (_b = user.avatar) === null || _b === void 0 ? void 0 : _b.url
        },
        tokens: { access: newAccessToken, refresh: newRefreshToken }
    });
});
exports.grantAccessToken = grantAccessToken;
const signOut = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    const user = yield user_1.default.findOne({ _id: req.user.id, tokens: refreshToken });
    if (!user)
        return (0, helper_1.sendErrorRes)(res, "Unauthorized request! User not found", 403);
    const newTokens = user.tokens.filter(token => token !== refreshToken);
    user.tokens = newTokens;
    yield user.save();
    res.send();
});
exports.signOut = signOut;
const generateForgotPasswordLink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const user = yield user_1.default.findOne({ email });
    if (!user)
        return (0, helper_1.sendErrorRes)(res, "Link will be sent to the mail provided if the account exists", 200);
    yield passwordResetToken_1.default.findOneAndDelete({ owner: user._id });
    const token = crypto_1.default.randomBytes(36).toString("hex");
    yield passwordResetToken_1.default.create({ owner: user._id, token });
    const passwordResetLink = `${PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`;
    mail_1.default.sendPasswordResetLink(user.email, passwordResetLink);
    res.json({
        message: "Reset link has been sent to your email"
    });
});
exports.generateForgotPasswordLink = generateForgotPasswordLink;
const grantValidPasswordResetLink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ valid: true });
});
exports.grantValidPasswordResetLink = grantValidPasswordResetLink;
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, password } = req.body;
    const user = yield user_1.default.findById(id);
    if (!user)
        return (0, helper_1.sendErrorRes)(res, "Unauthorized access", 403);
    const isMatched = yield user.comparePassword(password);
    if (isMatched)
        return (0, helper_1.sendErrorRes)(res, "New password should be something different", 422);
    user.password = password;
    yield user.save();
    yield passwordResetToken_1.default.findOneAndDelete({ owner: user._id });
    yield mail_1.default.sendPasswordUpdateMessage(user.email);
    res.json({ message: "Password reset successful!" });
});
exports.updatePassword = updatePassword;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    if (typeof name !== "string" || name.trim().length < 3) {
        return (0, helper_1.sendErrorRes)(res, "Name is invalid!", 422);
    }
    yield user_1.default.findByIdAndUpdate(req.user.id, { name });
    res.json({ profile: Object.assign(Object.assign({}, req.user), { name }) });
});
exports.updateProfile = updateProfile;
const updateAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    const { avatar } = req.files;
    if (Array.isArray(avatar)) {
        return (0, helper_1.sendErrorRes)(res, "Multiple files are not allowed", 422);
    }
    if (!((_c = avatar.mimetype) === null || _c === void 0 ? void 0 : _c.startsWith("image"))) {
        return (0, helper_1.sendErrorRes)(res, "Invalid image file", 422);
    }
    const user = yield user_1.default.findById(req.user.id);
    if (!user) {
        return (0, helper_1.sendErrorRes)(res, "User not found", 404);
    }
    if ((_d = user.avatar) === null || _d === void 0 ? void 0 : _d.id) {
        yield cloudinary_1.default.destroy(user.avatar.id);
    }
    const { secure_url: url, public_id: id } = yield cloudinary_1.default.upload(avatar.filepath, {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face"
    });
    user.avatar = { url, id };
    yield user.save();
    res.json({
        profile: Object.assign(Object.assign({}, req.user), { avatar: user.avatar.url })
    });
});
exports.updateAvatar = updateAvatar;
const sendPublicProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const profileId = req.params.id;
    if (!(0, mongoose_1.isValidObjectId)(profileId)) {
        return (0, helper_1.sendErrorRes)(res, "Invalid profile id!", 422);
    }
    const user = yield user_1.default.findById(profileId);
    if (!user) {
        return (0, helper_1.sendErrorRes)(res, "User not found!", 404);
    }
    res.json({ profile: { id: user._id, name: user.name, avatar: (_e = user.avatar) === null || _e === void 0 ? void 0 : _e.url } });
});
exports.sendPublicProfile = sendPublicProfile;
