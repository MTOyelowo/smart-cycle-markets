import "dotenv/config";
import 'express-async-errors';
import './db';
import express from 'express';
import http from "http";
import authRouter from './routes/auth';
import productRouter from "./routes/products";
import { sendErrorRes } from "./utils/helper";
import { Server } from "socket.io";
import { TokenExpiredError, verify } from "jsonwebtoken";
import morgan from "morgan";
import conversationRouter from "./routes/conversation";
import ConversationModel from "./models/conversation";
import { updateSeenStatus } from "./controllers/conversation";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: '/socket-message'
})
const PORT = process.env.PORT || 3030;

app.use(morgan("dev"));
app.use(express.static("src/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use('/auth', authRouter);
app.use('/product', productRouter);
app.use('/conversation', conversationRouter);

//Socket IO middleware
io.use((socket, next) => {
    const socketReq = socket.handshake.auth as { token: string } | undefined;
    if (!socketReq?.token) {
        return next(new Error('Unauthorized request!'));
    }

    try {
        socket.data.jwtDecode = verify(socketReq.token, process.env.JWT_SECRET!);

    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return next(new Error('jwt expired'));
        }

        return next(new Error('Invalid token!'));

    }

    next();
});

//Types for incoming message

type UserProfile = {
    id: string;
    name: string;
    avatar?: string;
};

type IncomingMessage = {
    message: {
        id: string;
        time: string;
        text: string;
        user: UserProfile;
    };
    to: string;
    conversationId: string;
};


type MessageResponse = {
    message: {
        id: string;
        time: string;
        text: string;
        user: UserProfile;
    };
    from: UserProfile;
    conversationId: string;
};

type SeenData = {
    messageId: string;
    peerId: string;
    conversationId: string;
};

io.on('connection', (socket) => {

    const socketData = socket.data as { jwtDecode: { id: string } }
    const userId = socketData.jwtDecode.id

    socket.join(userId);

    socket.on('chat:new', async (data: IncomingMessage) => {
        const { conversationId, message, to } = data;

        await ConversationModel.findByIdAndUpdate(conversationId, {
            $push: {
                chats: {
                    sentBy: message.user.id,
                    content: message.text,
                    timestamp: message.time
                }
            }
        });

        const messageResponse: MessageResponse = {
            from: message.user,
            conversationId,
            message: message,
        }

        socket.to(to).emit('chat:message', messageResponse);
    });

    socket.on('chat:seen', async ({ conversationId, messageId, peerId }: SeenData) => {
        await updateSeenStatus(peerId, conversationId);
        socket.to(peerId).emit('chat:seen', { conversationId, messageId });
    })

    socket.on('chat:typing', (typingData: { to: string, active: boolean }) => {
        socket.to(typingData.to).emit('chat:typing', { typing: typingData.active })
    })

})

// Other setup

app.use(function (err, req, res, next) {
    res.status(500).json({ message: err.message })
} as express.ErrorRequestHandler)

app.use("*", (req, res) => {
    sendErrorRes(res, "Not Found", 404);
})

//using server.listen because to allow socket io connection too. Else just use app.listen.
server.listen(PORT, () => {
    console.log(`The app is running on ${PORT}`)
});


//Uploading file to local directory

// app.post("/upload-file", async (req, res) => {
//     const form = formidable({
//         uploadDir: path.join(__dirname, "public"),
//         filename(name, ext, part, form) {
//             return Date.now() + "_" + part.originalFilename;
//         },
//     });
//     await form.parse(req);
//     res.send("ok");
// });

export default app;