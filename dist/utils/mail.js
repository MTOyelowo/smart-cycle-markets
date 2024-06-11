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
const nodemailer_1 = __importDefault(require("nodemailer"));
const transport = nodemailer_1.default.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.MAIL_TRAP_USER,
        pass: process.env.MAIL_TRAP_PASS
    }
});
const sendVerification = (email, link) => __awaiter(void 0, void 0, void 0, function* () {
    yield transport.sendMail({
        from: "verification@smartcyclemarket.com",
        to: email,
        html: `<h1>Please click on <a href="${link}">this link</a> to verify your account.</h1>`
    });
});
const sendPasswordResetLink = (email, link) => __awaiter(void 0, void 0, void 0, function* () {
    yield transport.sendMail({
        from: "security@smartcyclemarket.com",
        to: email,
        html: `<h1>Please click on <a href="${link}">this link</a> to reset your password.</h1>`
    });
});
const sendPasswordUpdateMessage = (email) => __awaiter(void 0, void 0, void 0, function* () {
    yield transport.sendMail({
        from: "security@smartcyclemarket.com",
        to: email,
        html: `<h1>Password updated. Proceed to log in to your account</h1>`
    });
});
const mail = {
    sendVerification,
    sendPasswordResetLink,
    sendPasswordUpdateMessage,
};
exports.default = mail;
