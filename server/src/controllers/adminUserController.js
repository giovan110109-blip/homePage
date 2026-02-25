const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const userService = require('../services/userService');

class AdminUserController extends BaseController {
  async list(ctx) {
    try {
      const { page, pageSize, keyword } = ctx.query;
      const result = await userService.getUsers({ page, pageSize, keyword });
      this.paginated(ctx, result.items, result.pagination, '获取用户列表成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async detail(ctx) {
    try {
      const { id } = ctx.params;
      const user = await userService.getById(id, { select: '-passwordHash' });

      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      this.ok(ctx, user, '获取用户详情成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async create(ctx) {
    try {
      const userData = ctx.request.body;

      if (!userData.username || !userData.password) {
        this.throwHttpError('用户名和密码必填', HttpStatus.BAD_REQUEST);
      }

      if (!userService.validatePassword(userData.password)) {
        this.throwHttpError('密码长度不能少于6位', HttpStatus.BAD_REQUEST);
      }

      const user = await userService.createUser(userData);
      this.created(ctx, user, '用户创建成功');
    } catch (error) {
      if (error.message.includes('已存在')) {
        this.throwHttpError(error.message, HttpStatus.BAD_REQUEST);
      }
      this.fail(ctx, error);
    }
  }

  async update(ctx) {
    try {
      const { id } = ctx.params;
      const updateData = ctx.request.body;

      const user = await userService.updateUser(id, updateData);

      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      this.ok(ctx, user, '用户更新成功');
    } catch (error) {
      if (error.message.includes('已存在')) {
        this.throwHttpError(error.message, HttpStatus.BAD_REQUEST);
      }
      this.fail(ctx, error);
    }
  }

  async resetPassword(ctx) {
    try {
      const { id } = ctx.params;
      const { password } = ctx.request.body;

      if (!password) {
        this.throwHttpError('新密码必填', HttpStatus.BAD_REQUEST);
      }

      if (!userService.validatePassword(password)) {
        this.throwHttpError('密码长度不能少于6位', HttpStatus.BAD_REQUEST);
      }

      const user = await userService.resetPassword(id, password);

      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      this.ok(ctx, null, '密码重置成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async delete(ctx) {
    try {
      const { id } = ctx.params;

      const user = await userService.deleteUser(id);

      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      this.ok(ctx, null, '用户删除成功');
    } catch (error) {
      if (error.message.includes('最后一个管理员')) {
        this.throwHttpError(error.message, HttpStatus.BAD_REQUEST);
      }
      this.fail(ctx, error);
    }
  }
}

module.exports = new AdminUserController();
