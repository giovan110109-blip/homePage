const mongoose = require('mongoose');

const reactionTypes = [
    'like', 'love', 'laugh', 'wow', 'sad', 'angry',
    'fire', 'star', 'thinking', 'clap', 'pray', 'party',
    'cool', 'sweat', 'kiss', 'tease', 'sweet', 'sick'
];

const countsShape = reactionTypes.reduce((acc, key) => {
    acc[key] = { type: Number, default: 0 };
    return acc;
}, {});

const ReactionSchema = new mongoose.Schema({
    targetType: { type: String, required: true, index: true }, // 目标类型，如 'message'
    targetId: { type: String, required: true, index: true },   // 目标实体 ID（字符串存储）
    counts: countsShape                                        // 表态计数
}, { timestamps: true });

ReactionSchema.index({ targetType: 1, targetId: 1 }, { unique: true });

module.exports = {
    ReactionModel: mongoose.model('Reaction', ReactionSchema),
    reactionTypes
};
