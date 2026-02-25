const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const userService = require('../services/userService');

class ProfileController extends BaseController {
  async getProfile(ctx) {
    try {
      const currentUser = ctx.state.user;
      const user = await userService.getProfile(currentUser._id, currentUser.username);
      
      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      this.ok(ctx, user, '获取用户信息成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async updateProfile(ctx) {
    try {
      const currentUser = ctx.state.user;
      const updateData = ctx.request.body;

      const user = await userService.updateProfile(
        currentUser._id,
        currentUser.username,
        updateData
      );

      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      this.ok(ctx, user, '更新成功');
    } catch (error) {
      if (error.message.includes('原密码错误') || error.message.includes('密码长度')) {
        this.throwHttpError(error.message, HttpStatus.BAD_REQUEST);
      }
      this.fail(ctx, error);
    }
  }
}

module.exports = new ProfileController();
