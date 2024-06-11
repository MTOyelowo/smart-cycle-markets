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
require("dotenv/config");
require("express-async-errors");
require("./db");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const helper_1 = require("./utils/helper");
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = require("jsonwebtoken");
const morgan_1 = __importDefault(require("morgan"));
const conversation_1 = __importDefault(require("./routes/conversation"));
const conversation_2 = __importDefault(require("./models/conversation"));
const conversation_3 = require("./controllers/conversation");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    path: "/socket-message"
});
const PORT = process.env.PORT || 3030;
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.static("src/public"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use('/auth', auth_1.default);
app.use('/product', products_1.default);
app.use('/conversation', conversation_1.default);
io.use((socket, next) => {
    const socketReq = socket.handshake.auth;
    if (!(socketReq === null || socketReq === void 0 ? void 0 : socketReq.token)) {
        return next(new Error("Unauthorized request!"));
    }
    try {
        socket.data.jwtDecode = (0, jsonwebtoken_1.verify)(socketReq.token, process.env.JWT_SECRET);
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            return next(new Error("jwt expired"));
        }
        return next(new Error("Invalid token!"));
    }
    next();
});
io.on("connection", (socket) => {
    const socketData = socket.data;
    const userId = socketData.jwtDecode.id;
    socket.join(userId);
    socket.on("chat:new", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { conversationId, message, to } = data;
        yield conversation_2.default.findByIdAndUpdate(conversationId, {
            $push: {
                chats: {
                    sentBy: message.user.id,
                    content: message.text,
                    timestamp: message.time
                }
            }
        });
        const messageResponse = {
            from: message.user,
            conversationId,
            message: message,
        };
        socket.to(to).emit("chat:message", messageResponse);
    }));
    socket.on("chat:seen", (_a) => __awaiter(void 0, [_a], void 0, function* ({ conversationId, messageId, peerId }) {
        yield (0, conversation_3.updateSeenStatus)(peerId, conversationId);
        socket.to(peerId).emit("chat:seen", { conversationId, messageId });
    }));
    socket.on("chat:typing", (typingData) => {
        socket.to(typingData.to).emit("chat:typing", { typing: typingData.active });
    });
});
app.use(function (err, req, res, next) {
    res.status(500).json({ message: err.message });
});
app.use("*", (req, res) => {
    (0, helper_1.sendErrorRes)(res, "Not Found", 404);
});
server.listen(PORT, () => {
    console.log(`The app is running on ${PORT}`);
});
exports.default = app;
