const { ReactionModel, reactionTypes } = require('../models/reaction');

function initialCounts() {
    return reactionTypes.reduce((acc, key) => {
        acc[key] = 0;
        return acc;
    }, {});
}

class ReactionService {
    constructor() {
        this.allowed = reactionTypes;
    }

    emptyCounts() {
        return initialCounts();
    }

    ensureType(type) {
        if (!this.allowed.includes(type)) {
            const err = new Error('invalid reaction type');
            err.status = 400;
            throw err;
        }
    }

    // 表态 +1（不存在则创建并初始化）
    async react(targetType, targetId, type) {
        this.ensureType(type);
        // 先检查是否存在且 counts 是否合法
        let existing = await ReactionModel.findOne({ targetType, targetId }).lean();
        if (existing && (!existing.counts || typeof existing.counts !== 'object' || Array.isArray(existing.counts))) {
            // 数据损坏，删除重建
            await ReactionModel.deleteOne({ targetType, targetId });
            existing = null;
        }
        
        const initialCounts = this.emptyCounts();
        initialCounts[type] = 1;
        
        if (!existing) {
            // 创建新记录
            const doc = await ReactionModel.create({ targetType, targetId, counts: initialCounts });
            return doc.counts;
        }
        
        // 存在且合法，执行 $inc
        const doc = await ReactionModel.findOneAndUpdate(
            { targetType, targetId },
            { $inc: { [`counts.${type}`]: 1 } },
            { new: true, lean: true }
        );
        return doc.counts;
    }

    // 取消表态 -1（最小为 0；若无记录或计数为 0 返回 null）
    async unreact(targetType, targetId, type) {
        this.ensureType(type);
        // 先检查是否存在且 counts 是否合法
        let existing = await ReactionModel.findOne({ targetType, targetId }).lean();
        if (existing && (!existing.counts || typeof existing.counts !== 'object' || Array.isArray(existing.counts))) {
            // 数据损坏，删除
            await ReactionModel.deleteOne({ targetType, targetId });
            return null;
        }
        
        if (!existing || !existing.counts || existing.counts[type] <= 0) {
            return null;
        }
        
        // 执行 $inc -1
        const doc = await ReactionModel.findOneAndUpdate(
            { targetType, targetId },
            { $inc: { [`counts.${type}`]: -1 } },
            { new: true, lean: true }
        );
        return doc ? doc.counts : null;
    }

    async getCountsMap(targetType, targetIds = []) {
        if (!targetIds.length) return {};
        const docs = await ReactionModel.find({ targetType, targetId: { $in: targetIds } }).lean();
        const map = {};
        for (const d of docs) {
            map[d.targetId] = d.counts;
        }
        return map;
    }
}

module.exports = new ReactionService();
module.exports.reactionTypes = reactionTypes;
