const BaseService = require('../utils/baseService');
const SampleModel = require('../models/sample');

class SampleService extends BaseService {
    constructor() {
        super(SampleModel);
    }

    // 示例：按状态与名称模糊查询，并分页
    async listWithFilter({ page = 1, pageSize = 10, status, name }) {
        const filter = {};
        if (status) filter.status = status;
        if (name) filter.name = new RegExp(name, 'i');

        return this.paginate(filter, {
            page,
            pageSize,
            sort: { createdAt: -1 }
        });
    }

    // 示例：为文档追加 tag（去重）
    async addTag(id, tag) {
        if (!tag) return null;
        return this.updateById(id, {
            $addToSet: { tags: tag }
        }, { new: true });
    }

    // 示例：批量创建
    async bulkCreate(docs = []) {
        if (!Array.isArray(docs) || !docs.length) return [];
        return SampleModel.insertMany(docs, { ordered: false });
    }

    // 示例：软禁用文档
    async disable(id) {
        return this.updateById(id, { status: 'disabled' });
    }

    // 示例：统计按状态分组数量
    async countByStatus() {
        return SampleModel.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
    }
}

module.exports = new SampleService();
