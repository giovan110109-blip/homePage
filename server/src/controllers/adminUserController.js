const User = require('../models/user');
const crypto = require('crypto');

const hashPassword = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

class AdminUserController {
  // 获取所有用户列表
  async list(ctx) {
    try {
      const { page = 1, pageSize = 10, keyword = '' } = ctx.query;
      const skip = (page - 1) * pageSize;

      const query = {};
      if (keyword) {
        query.$or = [
          { username: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } },
          { nickname: { $regex: keyword, $options: 'i' } }
        ];
      }

      const [data, total] = await Promise.all([
        User.find(query)
          .select('-passwordHash')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(pageSize)),
        User.countDocuments(query)
      ]);

      ctx.body = {
        success: true,
        data,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message
      };
    }
  }

  // 获取用户详情
  async detail(ctx) {
    try {
      const { id } = ctx.params;
      const user = await User.findById(id).select('-passwordHash');

      if (!user) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: '用户不存在'
        };
        return;
      }

      ctx.body = {
        success: true,
        data: user
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message
      };
    }
  }

  // 创建新用户
  async create(ctx) {
    try {
      const { username, password, email, nickname, role, avatar, phone, gender } = ctx.request.body;

      // 验证必填字段
      if (!username || !password) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '用户名和密码必填'
        };
        return;
      }

      // 检查用户名是否已存在
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '用户名已存在'
        };
        return;
      }

      // 检查邮箱是否已存在
      if (email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          ctx.status = 400;
          ctx.body = {
            success: false,
            message: '邮箱已存在'
          };
          return;
        }
      }

      // 密码加密
      const passwordHash = hashPassword(password);

      const newUser = new User({
        username,
        passwordHash,
        email: email || undefined,
        nickname: nickname || username,
        avatar: avatar || undefined,
        phone: phone || undefined,
        gender: gender || 'unknown',
        role: role || 'user',
        status: 'active'
      });

      const savedUser = await newUser.save();

      ctx.status = 201;
      ctx.body = {
        success: true,
        message: '用户创建成功',
        data: savedUser.toObject({ hide: 'passwordHash' })
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message
      };
    }
  }

  // 更新用户信息
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { username, email, nickname, role, status, avatar, phone, gender } = ctx.request.body;

      const user = await User.findById(id);
      if (!user) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: '用户不存在'
        };
        return;
      }

      // 检查用户名是否被其他用户占用
      if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          ctx.status = 400;
          ctx.body = {
            success: false,
            message: '用户名已存在'
          };
          return;
        }
      }

      // 检查邮箱是否被其他用户占用
      if (email && email !== user.email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          ctx.status = 400;
          ctx.body = {
            success: false,
            message: '邮箱已存在'
          };
          return;
        }
      }

      // 更新用户信息
      if (username) user.username = username;
      if (email !== undefined) user.email = email || undefined;
      if (nickname) user.nickname = nickname;
      if (role) user.role = role;
      if (status) user.status = status;
      if (avatar !== undefined) user.avatar = avatar || undefined;
      if (phone !== undefined) user.phone = phone || undefined;
      if (gender) user.gender = gender;

      const updatedUser = await user.save();

      ctx.body = {
        success: true,
        message: '用户更新成功',
        data: updatedUser.toObject({ hide: 'passwordHash' })
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message
      };
    }
  }

  // 重置密码
  async resetPassword(ctx) {
    try {
      const { id } = ctx.params;
      const { password } = ctx.request.body;

      if (!password) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '新密码必填'
        };
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: '用户不存在'
        };
        return;
      }

      // 密码加密
      const passwordHash = hashPassword(password);

      user.passwordHash = passwordHash;
      await user.save();

      ctx.body = {
        success: true,
        message: '密码重置成功'
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message
      };
    }
  }

  // 删除用户
  async delete(ctx) {
    try {
      const { id } = ctx.params;

      const user = await User.findById(id);
      if (!user) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: '用户不存在'
        };
        return;
      }

      // 防止删除唯一的管理员
      if (user.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          ctx.status = 400;
          ctx.body = {
            success: false,
            message: '不能删除最后一个管理员'
          };
          return;
        }
      }

      await User.findByIdAndDelete(id);

      ctx.body = {
        success: true,
        message: '用户删除成功'
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new AdminUserController();
