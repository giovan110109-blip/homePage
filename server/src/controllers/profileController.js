const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const User = require('../models/user');
const crypto = require('crypto');

const hashPassword = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

class ProfileController extends BaseController {
  // 获取当前用户信息
  async getProfile(ctx) {
    try {
      const currentUser = ctx.state.user;
      const user = currentUser._id 
        ? await User.findById(currentUser._id).select('-passwordHash -wechatSessionKey').lean()
        : await User.findOne({ username: currentUser.username }).select('-passwordHash -wechatSessionKey').lean();
      
      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      ctx.body = {
        success: true,
        data: user
      };
    } catch (error) {
      this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 更新当前用户信息
  async updateProfile(ctx) {
    try {
      const currentUser = ctx.state.user;
      const {
        nickname,
        realName,
        avatar,
        email,
        phone,
        gender,
        birthday,
        location,
        oldPassword,
        newPassword
      } = ctx.request.body;

      const user = currentUser._id
        ? await User.findById(currentUser._id).lean()
        : await User.findOne({ username: currentUser.username }).lean();
      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      const updateData = {};

      // 如果要修改密码
      if (oldPassword && newPassword) {
        // 验证原密码
        const isMatch = hashPassword(oldPassword) === user.passwordHash;
        if (!isMatch) {
          this.throwHttpError('原密码错误', HttpStatus.BAD_REQUEST);
        }

        // 验证新密码长度
        if (newPassword.length < 6) {
          this.throwHttpError('新密码长度不能少于6位', HttpStatus.BAD_REQUEST);
        }

        updateData.passwordHash = hashPassword(newPassword);
      }

      // 更新其他信息
      if (nickname !== undefined) updateData.nickname = nickname;
      if (realName !== undefined) updateData.realName = realName;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (gender !== undefined) updateData.gender = gender;
      if (birthday !== undefined) updateData.birthday = birthday;
      if (location !== undefined) updateData.location = location;

      if (Object.keys(updateData).length > 0) {
        if (currentUser._id) {
          await User.findByIdAndUpdate(currentUser._id, updateData);
        } else {
          await User.findOneAndUpdate({ username: currentUser.username }, updateData);
        }
      }

      // 返回更新后的用户信息（不包含密码）
      const updatedUser = currentUser._id
        ? await User.findById(currentUser._id).select('-passwordHash -wechatSessionKey').lean()
        : await User.findOne({ username: currentUser.username }).select('-passwordHash -wechatSessionKey').lean();

      ctx.body = {
        success: true,
        data: updatedUser,
        message: '更新成功'
      };
    } catch (error) {
      this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new ProfileController();
