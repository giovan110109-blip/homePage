const FriendLink = require('../models/friendLink');

class FriendLinkService {
    /**
     * 创建友情链接申请
     */
    async create(data) {
        const friendLink = new FriendLink(data);
        return await friendLink.save();
    }

    /**
     * 分页查询友情链接
     */
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

    /**
     * 获取所有已通过且激活的友情链接（前台展示）
     */
    async getApprovedLinks() {
        return await FriendLink.find({ 
            status: 'approved', 
            isActive: true 
        })
        .sort({ sort: -1, createdAt: -1 })
        .select('-ip -userAgent -browser -os -deviceType -referer -location')
        .lean();
    }

    /**
     * 根据ID查询
     */
    async findById(id) {
        return await FriendLink.findById(id).lean();
    }

    /**
     * 更新友情链接
     */
    async update(id, data) {
        return await FriendLink.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );
    }

    /**
     * 审核友情链接
     */
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

    /**
     * 删除友情链接
     */
    async delete(id) {
        return await FriendLink.findByIdAndDelete(id);
    }

    /**
     * 增加点击次数
     */
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

    /**
     * 批量更新排序
     */
    async updateSort(updates) {
        const operations = updates.map(({ id, sort }) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { sort } }
            }
        }));

        return await FriendLink.bulkWrite(operations);
    }

    /**
     * 检查邮箱是否已申请过
     */
    async checkEmailExists(email) {
        const count = await FriendLink.countDocuments({ email });
        return count > 0;
    }
}

module.exports = new FriendLinkService();
