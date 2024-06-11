import { Router } from "express";
import { getConversation, getLastChats, getOrCreateConversation, updateChatSeenStatus } from "controllers/conversation";
import { isAuth } from "src/middleware/isAuth";


const conversationRouter = Router();

conversationRouter.get("/with/:peerId", isAuth, getOrCreateConversation);
conversationRouter.get("/chats/:conversationId", isAuth, getConversation);
conversationRouter.get("/last-chats", isAuth, getLastChats);
conversationRouter.patch("/seen/:conversationId/:peerId", isAuth, updateChatSeenStatus)

export default conversationRouter;