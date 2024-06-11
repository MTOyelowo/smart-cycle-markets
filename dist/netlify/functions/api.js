"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const serverless_http_1 = __importDefault(require("serverless-http"));
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("../../src/index"));
const app = (0, express_1.default)();
app.use("/.netlify/functions/api", index_1.default);
module.exports.handler = (0, serverless_http_1.default)(app);
