// 基础数据服务封装（面向 Mongoose Model）
class BaseService {
    constructor(model) {
        this.model = model;
    }

    async paginate(filter = {}, options = {}) {
        const page = Number(options.page || 1);
        const pageSize = Number(options.pageSize || options.limit || 10);
        const sort = options.sort || { createdAt: -1 };
        const select = options.select;
        const populate = options.populate;
        const lean = options.lean !== false; // 默认为 true
        const skip = (page - 1) * pageSize;

        const query = this.model.find(filter).sort(sort).skip(skip).limit(pageSize);
        if (select) query.select(select);
        if (populate) query.populate(populate);
        if (lean) query.lean();

        const [items, total] = await Promise.all([
            query.exec(),
            this.model.countDocuments(filter)
        ]);

        return {
            items,
            pagination: {
                page,
                pageSize,
                total,
                pageCount: pageSize ? Math.ceil(total / pageSize) : 0
            }
        };
    }

    async findOneByFields(fields, options = {}) {
        const query = this.model.findOne(fields);
        if (options.select) query.select(options.select);
        if (options.populate) query.populate(options.populate);
        if (options.lean !== false) query.lean();
        return query.exec();
    }

    async findManyByFields(fields, options = {}) {
        const query = this.model.find(fields);
        if (options.sort) query.sort(options.sort);
        if (options.select) query.select(options.select);
        if (options.populate) query.populate(options.populate);
        if (options.lean !== false) query.lean();
        return query.exec();
    }

    async getById(id, options = {}) {
        const query = this.model.findById(id);
        if (options.select) query.select(options.select);
        if (options.populate) query.populate(options.populate);
        if (options.lean !== false) query.lean();
        return query.exec();
    }

    async create(doc) {
        return this.model.create(doc);
    }

    async updateById(id, doc, options = {}) {
        const opts = { new: true, runValidators: true, ...options };
        return this.model.findByIdAndUpdate(id, doc, opts).lean();
    }

    async deleteById(id) {
        return this.model.findByIdAndDelete(id).lean();
    }
}

module.exports = BaseService;
