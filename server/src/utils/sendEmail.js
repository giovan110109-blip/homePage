const nodemailer = require("nodemailer");
const { getEmailTemplate } = require("./getEmailTemplate");

const EMAIL_HOST = process.env.EMAIL_HOST || "QQ";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT) || 465;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const subjectList = {
  1: "✨ 欢迎您加入 Giovan 管理系统",
  2: "🛡️ 您的 Giovan 密码重置通知",
  3: "📩 Giovan 验证码提醒，请查收",
  4: "📢 Giovan 重要公告通知",
  5: "🌷 感谢您的宝贵留言",
  6: "🗨️ 您的留言有新评论，快来查看吧",
  7: "💬 您的评论收到了新回复，快来互动吧",
  8: "🔔 Giovan 系统消息通知",
  9: "🤝 您的友链申请已通过，欢迎加入 Giovan 友情链接！",
  10: "📝 您有新的留言待查看（Giovan）",
  11: "🔗 您有新的友链申请待审核（Giovan）",
  12: "❌ 很抱歉，您的友链申请未通过审核（Giovan）",
};

const getSubject = (type) => {
  return subjectList[type];
};

const sendEmail = async (data) => {
  const { email, type } = data;

  // 创建邮件发送对象
  const transporter = nodemailer.createTransport({
    service: EMAIL_HOST, // 使用内置的QQ服务配置
    port: EMAIL_PORT, // SMTP 端口
    secureConnection: true, // 使用 SSL
    auth: {
      user: EMAIL_USER, // QQ邮箱账号
      pass: EMAIL_PASS, // QQ邮箱授权码,需要在QQ邮箱设置中获取,不是QQ密码
    },
  });

  // 邮件主题
  const subject = getSubject(type);
  // 邮件内容
  const html = `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${subject}</title>
    <style type="text/css">
        body { margin: 0; padding: 0; min-width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
        table { border-collapse: collapse; }
        td { padding: 0; }
        img { border: 0; max-width: 100%; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .mobile-pad { padding: 0 16px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #fcfcfc; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #333;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#fcfcfc">
        <tr>
            <td align="center" valign="top" style="padding: 32px 0;">
                <table class="container" width="580" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="border-radius: 20px; border: 1px solid #f0f0f0; overflow: hidden;">
                    <tr>
                        <td align="left" valign="center" style="padding: 28px 24px; border-bottom: 1px solid #f8f8f8;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="left" valign="middle">
                                        <img src="https://serve.giovan.cn/uploads/photos/logo-dark_1770788704758.png" alt="Giovan Logo" style="width: 100px; height: 30px; display: block; margin-bottom: 4px;" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="left" valign="top" class="mobile-pad" style="padding: 24px;">
                            ${getEmailTemplate(data)}
                        </td>
                    </tr>
                    <tr>
                        <td align="left" valign="top" style="padding: 24px; background-color: #fafafa; border-top: 1px solid #f8f8f8;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="font-size: 12px; color: #999; line-height: 1.5;">
                                        <p style="margin: 0 0 6px 0;">Giovan © 2025</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <table width="580" border="0" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                    <tr>
                        <td align="center" style="font-size: 11px; color: #ccc; line-height: 1.4;">
                            <p style="margin: 0;">发送于 Giovan · 如果你觉得打扰，抱歉啦🙏</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;

  // 发送邮件
  try {
    await transporter.sendMail({
      from: `"Giovan " <${EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
  } catch (error) {
    console.error("❌ 邮件发送失败:", error);
    throw new Error("邮件发送失败，请检查邮箱授权码配置是否正确");
  }
};

module.exports = {
  sendEmail,
};
