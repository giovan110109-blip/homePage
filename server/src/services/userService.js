const BaseService = require('../utils/baseService');
const User = require('../models/user');
const crypto = require('crypto');

const hashPassword = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

class UserService extends BaseService {
  constructor() {
    super(User);
  }

  async getUsers({ page = 1, pageSize = 10, keyword = '' }) {
    const query = {};
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { nickname: { $regex: keyword, $options: 'i' } }
      ];
    }

    return await this.paginate(query, {
      page,
      pageSize,
      sort: { createdAt: -1 },
      select: '-passwordHash'
    });
  }

  async createUser(data) {
    const { username, password, email, nickname, role, avatar, phone, gender } = data;

    const existingUser = await this.findOneByFields({ username });
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    if (email) {
      const existingEmail = await this.findOneByFields({ email });
      if (existingEmail) {
        throw new Error('邮箱已存在');
      }
    }

    const user = await this.create({
      username,
      passwordHash: hashPassword(password),
      email: email || undefined,
      nickname: nickname || username,
      avatar: avatar || undefined,
      phone: phone || undefined,
      gender: gender || 'unknown',
      role: role || 'user',
      status: 'active'
    });

    const { passwordHash: _, ...result } = user.toObject();
    return result;
  }

  async updateUser(id, updateData) {
    const user = await this.getById(id);
    if (!user) return null;

    const { username, email } = updateData;

    if (username && username !== user.username) {
      const existingUser = await this.findOneByFields({ username });
      if (existingUser) {
        throw new Error('用户名已存在');
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await this.findOneByFields({ email });
      if (existingEmail) {
        throw new Error('邮箱已存在');
      }
    }

    const updated = await this.updateById(id, updateData);
    if (!updated) return null;

    const { passwordHash: _, ...result } = updated;
    return result;
  }

  async resetPassword(id, newPassword) {
    const user = await this.getById(id);
    if (!user) return null;

    return await this.updateById(id, { passwordHash: hashPassword(newPassword) });
  }

  async deleteUser(id) {
    const user = await this.getById(id);
    if (!user) return null;

    if (user.role === 'admin') {
      const adminCount = await this.model.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new Error('不能删除最后一个管理员');
      }
    }

    return await this.deleteById(id);
  }

  async getProfile(userId, username) {
    const user = userId
      ? await this.getById(userId, { select: '-passwordHash -wechatSessionKey' })
      : await this.findOneByFields({ username }, { select: '-passwordHash -wechatSessionKey' });
    return user;
  }

  async updateProfile(userId, username, updateData) {
    const user = userId
      ? await this.getById(userId)
      : await this.findOneByFields({ username });
    
    if (!user) return null;

    const { oldPassword, newPassword, ...otherData } = updateData;
    const finalUpdateData = { ...otherData };

    if (oldPassword && newPassword) {
      const isMatch = hashPassword(oldPassword) === user.passwordHash;
      if (!isMatch) {
        throw new Error('原密码错误');
      }
      if (newPassword.length < 6) {
        throw new Error('新密码长度不能少于6位');
      }
      finalUpdateData.passwordHash = hashPassword(newPassword);
    }

    if (userId) {
      await this.updateById(userId, finalUpdateData);
      return await this.getById(userId, { select: '-passwordHash -wechatSessionKey' });
    } else {
      await this.model.findOneAndUpdate({ username }, finalUpdateData);
      return await this.findOneByFields({ username }, { select: '-passwordHash -wechatSessionKey' });
    }
  }

  validatePassword(password) {
    return password && password.length >= 6;
  }
}

module.exports = new UserService();
