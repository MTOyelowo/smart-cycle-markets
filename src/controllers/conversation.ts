import { RequestHandler } from "express";
import { ObjectId, isValidObjectId } from "mongoose";
import ConversationModel from "../models/conversation";
import UserModel from "../models/user";
import { sendErrorRes } from "../utils/helper";


interface UserProfile {
    id: string;
    name: string
    avatar?: string;
}

interface Chat {
    text: string;
    time: string;
    id: string;
    user: UserProfile;
}

export interface Conversation {
    id: string;
    chats: Chat[];
    peerProfile: { avatar?: string; name: string; id: string };
}

type PopulatedChat = {
    _id: ObjectId,
    content: string,
    timestamp: Date,
    sentBy: {
        _id: ObjectId,
        name: string,
        avatar?: { url: string },
    }
};

type PopulatedParticipant = {
    _id: ObjectId,
    name: string,
    avatar?: { url: string },
}

export const getOrCreateConversation: RequestHandler = async (req, res) => {
    const { peerId } = req.params

    if (!isValidObjectId(peerId)) {
        return sendErrorRes(res, "Invalid peer id!", 422);
    }

    const user = await UserModel.findById(peerId)

    if (!user) {
        return sendErrorRes(res, "User not found!", 404);
    }

    const participants = [req.user.id, peerId]
    const participantsId = participants.sort().join("_")

    const conversation = await ConversationModel.findOneAndUpdate({ participantsId }, {

        //insert only if upsert finds nothing as participants
        $setOnInsert: {
            participantsId,
            participants
        }
    }, { upsert: true, new: true });

    res.json({ conversationId: conversation._id })
}

export const getConversation: RequestHandler = async (req, res) => {
    const { conversationId } = req.params;

    if (!isValidObjectId(conversationId)) {
        return sendErrorRes(res, "Invalid conversation id!", 422);
    }

    const conversation = await ConversationModel.findById(conversationId)
        .populate<{ chats: PopulatedChat[] }>({
            path: "chats.sentBy",
            select: "name avatar.url"
        })
        .populate<{ participants: PopulatedParticipant[] }>({
            path: "participants",
            match: { _id: { $ne: req.user.id, } }, //Filter out loggedin user.
            select: "name avatar.url"
        })
        .select("sentBy chats._id chats.content chats.timestamp participants");

    if (!conversation) return sendErrorRes(res, "Details not found!", 404)

    const peerProfile = conversation.participants[0]

    const finalConversation: Conversation = {
        id: conversation._id,
        chats: conversation.chats.map(chat => ({
            id: chat._id.toString(),
            text: chat.content,
            time: chat.timestamp.toISOString(),
            user: {
                id: chat.sentBy._id.toString(),
                name: chat.sentBy.name,
                avatar: chat.sentBy.avatar?.url,
            }
        })),
        peerProfile: {
            id: peerProfile._id.toString(),
            name: peerProfile.name,
            avatar: peerProfile.avatar?.url
        }
    }

    res.json({ conversation: finalConversation })
}

export const getLastChats: RequestHandler = async (req, res) => {
    const chats = await ConversationModel.aggregate([
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
    ])

    res.json({ chats })
}

export const updateSeenStatus = async (
    peerId: string,
    conversationId: string
) => {
    await ConversationModel.findByIdAndUpdate(
        conversationId,
        {
            $set: {
                "chats.$[elem].viewed": true,
            },
        },
        {
            arrayFilters: [{ "elem.sentBy": peerId }],
        }
    );
};

export const updateChatSeenStatus: RequestHandler = async (req, res) => {
    const { peerId, conversationId } = req.params;

    if (!isValidObjectId(peerId) || !isValidObjectId(conversationId)) return sendErrorRes(res, "Invalid conversation or peer Id", 422)

    await updateSeenStatus(peerId, conversationId);

    res.json({ message: "Updated successfully." });
}

