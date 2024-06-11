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
exports.isValidPasswordResetToken = void 0;
const helper_1 = require("../src/utils/helper");
const passwordResetToken_1 = __importDefault(require("../src/models/passwordResetToken"));
const isValidPasswordResetToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, token } = req.body;
    const resetPasswordToken = yield passwordResetToken_1.default.findOne({ owner: id });
    if (!resetPasswordToken)
        return (0, helper_1.sendErrorRes)(res, "Unauthorized request", 401);
    const isMatched = yield resetPasswordToken.compareToken(token);
    if (!isMatched)
        return (0, helper_1.sendErrorRes)(res, "Unauthorized request. Invalid token", 403);
    next();
});
exports.isValidPasswordResetToken = isValidPasswordResetToken;
