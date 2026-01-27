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
}

module.exports = new MessageService();
