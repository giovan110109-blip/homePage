const BaseService = require('../utils/baseService');
const MessageModel = require('../models/message');

class MessageService extends BaseService {
    constructor() {
        super(MessageModel);
    }

    async incrementReaction(id, type) {
        return MessageModel.findByIdAndUpdate(
            id,
            { $inc: { [`reactions.${type}`]: 1 } },
            { new: true, lean: true }
        );
    }

    async count(filter = {}) {
        return MessageModel.countDocuments(filter);
    }

    async getNextVisitorNumber() {
        const latest = await MessageModel.findOne({ visitorNumber: { $type: 'number' } })
            .sort({ visitorNumber: -1 })
            .select('visitorNumber')
            .lean();

        if (latest?.visitorNumber) return latest.visitorNumber + 1;

        return MessageModel.countDocuments({}).then((count) => count + 1);
    }

    getNormalizedEmailExpression() {
        return {
            $toLower: {
                $trim: {
                    input: { $ifNull: ['$email', ''] }
                }
            }
        };
    }

    async getEmailCountsMap(filter = {}, emails = []) {
        const normalizedEmails = [...new Set(
            emails
                .map((email) => String(email || '').trim().toLowerCase())
                .filter(Boolean)
        )];

        if (!normalizedEmails.length) return {};

        const rows = await MessageModel.aggregate([
            { $match: filter },
            { $addFields: { normalizedEmail: this.getNormalizedEmailExpression() } },
            { $match: { normalizedEmail: { $in: normalizedEmails } } },
            { $group: { _id: '$normalizedEmail', count: { $sum: 1 } } }
        ]);

        return rows.reduce((map, row) => {
            if (row?._id) map[row._id] = row.count;
            return map;
        }, {});
    }

    async getPassportStats(filter = {}) {
        const [withWebsite, oldFriendGroups] = await Promise.all([
            MessageModel.countDocuments({
                ...filter,
                website: { $exists: true, $nin: [null, ''] }
            }),
            MessageModel.aggregate([
                {
                    $match: {
                        ...filter,
                        email: { $exists: true, $nin: [null, ''] }
                    }
                },
                { $addFields: { normalizedEmail: this.getNormalizedEmailExpression() } },
                { $match: { normalizedEmail: { $ne: '' } } },
                { $group: { _id: '$normalizedEmail', count: { $sum: 1 } } },
                { $match: { _id: { $ne: '' }, count: { $gte: 2 } } },
                { $count: 'count' }
            ])
        ]);

        return {
            withWebsite,
            oldFriends: oldFriendGroups[0]?.count || 0
        };
    }
}

module.exports = new MessageService();
