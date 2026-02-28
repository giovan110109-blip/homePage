const { ReactionModel, reactionTypes } = require('../models/reaction');
const ReactionLog = require('../models/reactionLog');

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

    async react(targetType, targetId, type) {
        this.ensureType(type);
        let existing = await ReactionModel.findOne({ targetType, targetId }).lean();
        if (existing && (!existing.counts || typeof existing.counts !== 'object' || Array.isArray(existing.counts))) {
            await ReactionModel.deleteOne({ targetType, targetId });
            existing = null;
        }
        
        const initialCounts = this.emptyCounts();
        initialCounts[type] = 1;
        
        if (!existing) {
            const doc = await ReactionModel.create({ targetType, targetId, counts: initialCounts });
            return doc.counts;
        }
        
        const doc = await ReactionModel.findOneAndUpdate(
            { targetType, targetId },
            { $inc: { [`counts.${type}`]: 1 } },
            { new: true, lean: true }
        );
        return doc.counts;
    }

    async unreact(targetType, targetId, type) {
        this.ensureType(type);
        let existing = await ReactionModel.findOne({ targetType, targetId }).lean();
        if (existing && (!existing.counts || typeof existing.counts !== 'object' || Array.isArray(existing.counts))) {
            await ReactionModel.deleteOne({ targetType, targetId });
            return null;
        }
        
        if (!existing || !existing.counts || existing.counts[type] <= 0) {
            return null;
        }
        
        const doc = await ReactionModel.findOneAndUpdate(
            { targetType, targetId },
            { $inc: { [`counts.${type}`]: -1 } },
            { new: true, lean: true }
        );
        return doc ? doc.counts : null;
    }

    async handleReact(targetType, targetId, type, ip, action = 'add') {
        this.ensureType(type);
        targetId = String(targetId);

        if (action === 'remove') {
            const removed = await ReactionLog.findOneAndDelete({
                targetType,
                targetId,
                type,
                ip
            });
            if (!removed) return null;
            return await this.unreact(targetType, targetId, type);
        }

        const existed = await ReactionLog.findOne({
            targetType,
            targetId,
            type,
            ip
        }).lean();
        if (existed) return null;

        await ReactionLog.create({ targetType, targetId, type, ip });
        return await this.react(targetType, targetId, type);
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
