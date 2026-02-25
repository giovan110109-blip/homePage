const FriendLink = require('../models/friendLink');

class FriendLinkService {
    async create(data) {
        const friendLink = new FriendLink(data);
        return await friendLink.save();
    }

    async list({ page = 1, pageSize = 50, status, isActive, category } = {}) {
        const filter = {};
        if (status) filter.status = status;
        if (typeof isActive === 'boolean') filter.isActive = isActive;
        if (category) filter.category = category;

        const skip = (page - 1) * pageSize;
        const [list, total] = await Promise.all([
            FriendLink.find(filter)
                .sort({ sort: -1, createdAt: -1 })
                .skip(skip)
                .limit(Number(pageSize))
                .lean(),
            FriendLink.countDocuments(filter)
        ]);

        return {
            list,
            total,
            page: Number(page),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(total / pageSize)
        };
    }

    async getApprovedLinks() {
        return await FriendLink.find({ 
            status: 'approved', 
            isActive: true 
        })
        .sort({ sort: -1, createdAt: -1 })
        .select('-ip -userAgent -browser -os -deviceType -referer -location')
        .lean();
    }

    async findById(id) {
        return await FriendLink.findById(id).lean();
    }

    async update(id, data) {
        return await FriendLink.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );
    }

    async review(id, { status, reason, reviewedBy }) {
        const updateData = {
            status,
            reviewedAt: new Date(),
            reviewedBy
        };
        if (reason) updateData.reason = reason;

        return await FriendLink.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );
    }

    async delete(id) {
        return await FriendLink.findByIdAndDelete(id);
    }

    async incrementClick(id) {
        return await FriendLink.findByIdAndUpdate(
            id,
            {
                $inc: { clicks: 1 },
                $set: { lastClickedAt: new Date() }
            },
            { new: true }
        );
    }

    async updateSort(updates) {
        const operations = updates.map(({ id, sort }) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { sort } }
            }
        }));

        return await FriendLink.bulkWrite(operations);
    }

    async checkEmailExists(email) {
        const count = await FriendLink.countDocuments({ email });
        return count > 0;
    }
}

module.exports = new FriendLinkService();
