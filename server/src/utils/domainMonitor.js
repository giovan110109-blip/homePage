// 站点/证书检测工具
const http = require('http');
const https = require('https');
const tls = require('tls');

// 请求超时时间（毫秒）
const DEFAULT_TIMEOUT = 10000;
// 证书即将过期阈值（天）
const CERT_EXPIRING_DAYS = 30;

// 规范化 URL，支持输入域名（自动补 https://）
// 步骤：1) 判空 2) trim 3) 检查是否已有协议 4) 默认加 https
const ensureUrl = (input) => {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

// 发起 HEAD 请求，用于获取响应状态与测量延迟
// 步骤：1) 解析 URL 2) 选择 http/https 库 3) 记录开始时间
//      4) 发起 HEAD 5) 计算延迟并返回状态码
const requestHead = (url) => new Promise((resolve, reject) => {
  const urlObj = new URL(url);
  const lib = urlObj.protocol === 'https:' ? https : http;

  const start = Date.now();
  // 组装请求参数（https 额外加 SNI 以适配多域名证书）
  const req = lib.request(
    {
      method: 'HEAD',
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      timeout: DEFAULT_TIMEOUT,
      ...(urlObj.protocol === 'https:'
        ? { servername: urlObj.hostname, rejectUnauthorized: false }
        : {}),
    },
    (res) => {
      // 收到响应后计算延迟
      const latency = Date.now() - start;
      resolve({
        statusCode: res.statusCode || null,
        statusMessage: res.statusMessage || '',
        latency,
        headers: res.headers,
        protocol: urlObj.protocol,
        host: urlObj.hostname,
      });
      res.resume();
    }
  );

  // 超时直接终止请求
  req.on('timeout', () => {
    req.destroy(new Error('Request timeout'));
  });

  // 网络错误直接 reject
  req.on('error', (err) => reject(err));
  req.end();
});

// 将常见错误转换为可读信息
// 步骤：优先匹配错误码，再匹配错误文本关键词
const formatErrorMessage = (error) => {
  const code = error?.code;
  const message = String(error?.message || '').toLowerCase();

  if (code === 'ENOTFOUND') return '域名解析失败';
  if (code === 'ECONNREFUSED') return '连接被拒绝';
  if (code === 'ETIMEDOUT') return '请求超时';
  if (code === 'ECONNRESET') return '连接被重置';
  if (code === 'EAI_AGAIN') return 'DNS 查询超时';
  if (message.includes('tls') && message.includes('disconnected')) return 'TLS 握手失败';
  if (message.includes('handshake')) return 'TLS 握手失败';
  if (message.includes('certificate')) return '证书校验失败';

  return '连接失败';
};

// 获取 TLS 证书信息
// 步骤：1) 直连 443 端口 2) 读取证书 3) 解析有效期
//      4) 计算剩余天数 5) 标记状态（有效/即将过期/过期）
const checkCertificate = (host) => new Promise((resolve) => {
  if (!host) {
    resolve({ status: 'none', error: 'Invalid host' });
    return;
  }

  // 直接建立 TLS 连接获取证书
  const socket = tls.connect(
    {
      host,
      port: 443,
      servername: host,
      rejectUnauthorized: false,
      timeout: DEFAULT_TIMEOUT,
    },
    () => {
      try {
        // 从 TLS 连接拿到服务端证书
        const cert = socket.getPeerCertificate();
        if (!cert || !cert.valid_to) {
          resolve({ status: 'none' });
          socket.end();
          return;
        }

        // 解析证书有效期
        const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
        const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
        const now = new Date();
        const daysRemaining = validTo ? Math.ceil((validTo.getTime() - now.getTime()) / 86400000) : null;
        const isValidNow = !!(validFrom && validTo && now >= validFrom && now <= validTo);

        // 根据时间判断证书状态
        let status = 'valid';
        if (!isValidNow) status = 'expired';
        else if (daysRemaining !== null && daysRemaining <= CERT_EXPIRING_DAYS) status = 'expiring';

        resolve({
          status,
          validFrom: validFrom ? validFrom.toISOString() : null,
          validTo: validTo ? validTo.toISOString() : null,
          daysRemaining,
          issuer: cert.issuer?.O || cert.issuer?.CN || null,
          subject: cert.subject?.CN || null,
          serialNumber: cert.serialNumber || null,
          fingerprint: cert.fingerprint || null,
        });
      } catch (error) {
        resolve({ status: 'error', error: error?.message || 'Certificate parse error' });
      } finally {
        socket.end();
      }
    }
  );

  // TLS 连接错误
  socket.on('error', (err) => {
    resolve({ status: 'error', error: err.message || 'TLS connection failed' });
  });

  // TLS 连接超时
  socket.on('timeout', () => {
    socket.destroy();
    resolve({ status: 'error', error: 'TLS timeout' });
  });
});

// 综合检测：延迟 + HTTP 状态码 + 证书信息
// 步骤：1) 规范化 URL 2) 并行请求 HEAD + 证书
//      3) 成功返回数据 4) 失败返回错误信息
const checkDomain = async (inputUrl) => {
  // 先统一 URL 形态
  const normalizedUrl = ensureUrl(inputUrl);
  if (!normalizedUrl) {
    return {
      status: 'offline',
      message: '无效的 URL',
      latency: null,
      statusCode: null,
      ssl: { status: 'none' },
    };
  }

  // 解析域名
  const urlObj = new URL(normalizedUrl);
  const host = urlObj.hostname;

  try {
    // 并行获取 HTTP 状态与证书信息
    const [head, ssl] = await Promise.all([
      requestHead(normalizedUrl),
      checkCertificate(host),
    ]);

    // 成功响应
    return {
      status: 'online',
      message: head.statusMessage || '连接成功',
      latency: head.latency,
      statusCode: head.statusCode,
      checkedAt: new Date().toISOString(),
      host,
      ssl,
    };
  } catch (error) {
    // 失败时保底返回证书信息（有些站点 HTTP 不通但证书仍可取）
    return {
      status: 'offline',
      message: formatErrorMessage(error),
      latency: null,
      statusCode: null,
      checkedAt: new Date().toISOString(),
      host,
      ssl: await checkCertificate(host),
    };
  }
};

module.exports = { checkDomain };