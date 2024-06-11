"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendErrorRes = void 0;
const sendErrorRes = (res, message, statusCode) => {
    res.status(statusCode).json({ message });
};
exports.sendErrorRes = sendErrorRes;
