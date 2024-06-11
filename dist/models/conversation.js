"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    participants: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    ],
    participantsId: {
        type: String,
        unique: true,
        required: true,
    },
    chats: [{
            sentBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            content: {
                type: String,
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
            viewed: {
                type: Boolean,
                default: false
            },
        }]
}, { timestamps: true });
const ConversationModel = (0, mongoose_1.model)("Conversation", schema);
exports.default = ConversationModel;
