const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const npsClient = require('../utils/npsClient');

class NpsController extends BaseController {
  async getServerTime(ctx) {
    try {
      const result = await npsClient.post('/auth/gettime');
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async getAuthKey(ctx) {
    try {
      const result = await npsClient.post('/auth/getauthkey');
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async getStats(ctx) {
    try {
      const result = await npsClient.post('/index/stats');
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async getTunnelList(ctx) {
    try {
      const { client_id, type, search, sort, order, offset, limit } = ctx.request.body || {};
      const params = {};
      if (client_id !== undefined) params.client_id = client_id;
      if (type) params.type = type;
      if (search) params.search = search;
      if (sort) params.sort = sort;
      if (order) params.order = order;
      if (offset !== undefined) params.offset = offset;
      if (limit !== undefined) params.limit = limit;
      
      const result = await npsClient.post('/index/gettunnel', params);
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async getOneTunnel(ctx) {
    try {
      const { id } = ctx.request.body || {};
      if (!id) {
        this.throwHttpError('缺少隧道ID', HttpStatus.BAD_REQUEST);
      }
      const result = await npsClient.post('/index/getonetunnel', { id });
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async addTunnel(ctx) {
    try {
      const data = ctx.request.body || {};
      const result = await npsClient.post('/index/add', data);
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async editTunnel(ctx) {
    try {
      const data = ctx.request.body || {};
      if (!data.id) {
        this.throwHttpError('缺少隧道ID', HttpStatus.BAD_REQUEST);
      }
      const result = await npsClient.post('/index/edit', data);
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async startTunnel(ctx) {
    try {
      const { id } = ctx.request.body || {};
      if (!id) {
        this.throwHttpError('缺少隧道ID', HttpStatus.BAD_REQUEST);
      }
      const result = await npsClient.post('/index/start', { id });
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async stopTunnel(ctx) {
    try {
      const { id } = ctx.request.body || {};
      if (!id) {
        this.throwHttpError('缺少隧道ID', HttpStatus.BAD_REQUEST);
      }
      const result = await npsClient.post('/index/stop', { id });
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async deleteTunnel(ctx) {
    try {
      const { id } = ctx.request.body || {};
      if (!id) {
        this.throwHttpError('缺少隧道ID', HttpStatus.BAD_REQUEST);
      }
      const result = await npsClient.post('/index/del', { id });
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async getHostList(ctx) {
    try {
      const { search, offset, limit, client_id } = ctx.request.body || {};
      const params = {};
      if (search) params.search = search;
      if (offset !== undefined) params.offset = offset;
      if (limit !== undefined) params.limit = limit;
      if (client_id !== undefined) params.client_id = client_id;
      
      const result = await npsClient.post('/index/hostlist', params);
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async addHost(ctx) {
    try {
      const data = ctx.request.body || {};
      const result = await npsClient.post('/index/addhost', data);
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async editHost(ctx) {
    try {
      const data = ctx.request.body || {};
      if (!data.id) {
        this.throwHttpError('缺少域名解析ID', HttpStatus.BAD_REQUEST);
      }
      const result = await npsClient.post('/index/edithost', data);
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async deleteHost(ctx) {
    try {
      const { id } = ctx.request.body || {};
      if (!id) {
        this.throwHttpError('缺少域名解析ID', HttpStatus.BAD_REQUEST);
      }
      const result = await npsClient.post('/index/delhost', { id });
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async getClientList(ctx) {
    try {
      const { search, order, offset, limit } = ctx.request.body || {};
      const params = {};
      if (search) params.search = search;
      if (order) params.order = order;
      if (offset !== undefined) params.offset = offset;
      if (limit !== undefined) params.limit = limit;
      
      const result = await npsClient.post('/client/list', params);
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async getOneClient(ctx) {
    try {
      const { id } = ctx.request.body || {};
      if (!id) {
        this.throwHttpError('缺少客户端ID', HttpStatus.BAD_REQUEST);
      }
      const result = await npsClient.post('/client/getoneclient', { id });
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async addClient(ctx) {
    try {
      const data = ctx.request.body || {};
      const result = await npsClient.post('/client/add', data);
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async editClient(ctx) {
    try {
      const data = ctx.request.body || {};
      if (!data.id) {
        this.throwHttpError('缺少客户端ID', HttpStatus.BAD_REQUEST);
      }
      const result = await npsClient.post('/client/edit', data);
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async deleteClient(ctx) {
    try {
      const { id } = ctx.request.body || {};
      if (!id) {
        this.throwHttpError('缺少客户端ID', HttpStatus.BAD_REQUEST);
      }
      const result = await npsClient.post('/client/del', { id });
      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new NpsController();
