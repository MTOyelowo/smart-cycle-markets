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
exports.updateChatSeenStatus = exports.updateSeenStatus = exports.getLastChats = exports.getConversation = exports.getOrCreateConversation = void 0;
const mongoose_1 = require("mongoose");
const conversation_1 = __importDefault(require("../models/conversation"));
const user_1 = __importDefault(require("../models/user"));
const helper_1 = require("../utils/helper");
const getOrCreateConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { peerId } = req.params;
    if (!(0, mongoose_1.isValidObjectId)(peerId)) {
        return (0, helper_1.sendErrorRes)(res, "Invalid peer id!", 422);
    }
    const user = yield user_1.default.findById(peerId);
    if (!user) {
        return (0, helper_1.sendErrorRes)(res, "User not found!", 404);
    }
    const participants = [req.user.id, peerId];
    const participantsId = participants.sort().join("_");
    const conversation = yield conversation_1.default.findOneAndUpdate({ participantsId }, {
        $setOnInsert: {
            participantsId,
            participants
        }
    }, { upsert: true, new: true });
    res.json({ conversationId: conversation._id });
});
exports.getOrCreateConversation = getOrCreateConversation;
const getConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { conversationId } = req.params;
    if (!(0, mongoose_1.isValidObjectId)(conversationId)) {
        return (0, helper_1.sendErrorRes)(res, "Invalid conversation id!", 422);
    }
    const conversation = yield conversation_1.default.findById(conversationId)
        .populate({
        path: "chats.sentBy",
        select: "name avatar.url"
    })
        .populate({
        path: "participants",
        match: { _id: { $ne: req.user.id, } },
        select: "name avatar.url"
    })
        .select("sentBy chats._id chats.content chats.timestamp participants");
    if (!conversation)
        return (0, helper_1.sendErrorRes)(res, "Details not found!", 404);
    const peerProfile = conversation.participants[0];
    const finalConversation = {
        id: conversation._id,
        chats: conversation.chats.map(chat => {
            var _a;
            return ({
                id: chat._id.toString(),
                text: chat.content,
                time: chat.timestamp.toISOString(),
                user: {
                    id: chat.sentBy._id.toString(),
                    name: chat.sentBy.name,
                    avatar: (_a = chat.sentBy.avatar) === null || _a === void 0 ? void 0 : _a.url,
                }
            });
        }),
        peerProfile: {
            id: peerProfile._id.toString(),
            name: peerProfile.name,
            avatar: (_a = peerProfile.avatar) === null || _a === void 0 ? void 0 : _a.url
        }
    };
    res.json({ conversation: finalConversation });
});
exports.getConversation = getConversation;
const getLastChats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chats = yield conversation_1.default.aggregate([
        {
            $match: {
                participants: req.user.id,
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "participants",
                foreignField: "_id",
                as: "participantsInfo"
            }
        },
        {
            $project: {
                _id: 0,
                id: "$_id",
                participants: {
                    $filter: {
                        input: "$participantsInfo",
                        as: "participant",
                        cond: {
                            $ne: ["$$participant._id", req.user.id]
                        }
                    }
                },
                lastChat: {
                    $slice: ["$chats", -1]
                },
                unreadChatCounts: {
                    $size: {
                        $filter: {
                            input: "$chats",
                            as: "chat",
                            cond: {
                                $and: [
                                    { $eq: ["$$chat.viewed", false] },
                                    { $ne: ["$$chat.sentBy", req.user.id] }
                                ]
                            }
                        }
                    }
                }
            }
        },
        {
            $unwind: "$participants"
        },
        {
            $unwind: "$lastChat"
        },
        {
            $project: {
                id: "$id",
                lastMessage: "$lastChat.content",
                timestamp: "$lastChat.timestamp",
                unreadChatCounts: "$unreadChatCounts",
                peerProfile: {
                    id: "$participants._id",
                    name: "$participants.name",
                    avatar: "$participants.avatar.url",
                }
            }
        }
    ]);
    res.json({ chats });
});
exports.getLastChats = getLastChats;
const updateSeenStatus = (peerId, conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield conversation_1.default.findByIdAndUpdate(conversationId, {
        $set: {
            "chats.$[elem].viewed": true,
        },
    }, {
        arrayFilters: [{ "elem.sentBy": peerId }],
    });
});
exports.updateSeenStatus = updateSeenStatus;
const updateChatSeenStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { peerId, conversationId } = req.params;
    if (!(0, mongoose_1.isValidObjectId)(peerId) || !(0, mongoose_1.isValidObjectId)(conversationId))
        return (0, helper_1.sendErrorRes)(res, "Invalid conversation or peer Id", 422);
    yield (0, exports.updateSeenStatus)(peerId, conversationId);
    res.json({ message: "Updated successfully." });
});
exports.updateChatSeenStatus = updateChatSeenStatus;
