export function getEmailTemplate(data) {
  const { type, name, content } = data;
  let template = "";
  switch (type) {
    case 5:
      template = `
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td style="padding-bottom: 20px;padding-top: 20px;">
                    <p style="margin: 0; font-size: 18px; color: #222; line-height: 1.5;">Hi ${name}～😊</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #666; line-height: 1.6;">
                        感谢您给 Giovan 留下宝贵留言，我们超重视的～
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #666; line-height: 1.6;">
                        您的留言内容是：${content}
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding: 20px 0; border-bottom: 1px solid #f8f8f8;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #444; line-height: 1.7;">
                        留言处理说明：
                    </p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 1.8;">
                        <li style="margin-bottom: 8px;">我们已收到您的留言，正在加急处理中⚡</li>
                        <li style="margin-bottom: 8px;">处理完成后会第一时间回复您📩</li>
                        <li>您的建议是我们进步的动力，再次感谢❤️</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 24px 0;">
                    <a href="https://www.giovan.cn/#/note" target="_blank" style="display: inline-block; padding: 12px 36px; background-color: #5865f2; color: #fff; font-size: 14px; font-weight: 400; text-decoration: none; border-radius: 30px; border: 0;">
                        查看我的留言
                    </a>
                </td>
            </tr>
        </table>
        `;
      break;
    case 9:
      template = `
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td style="padding-bottom: 20px;padding-top: 20px;">
                    <p style="margin: 0; font-size: 18px; color: #222; line-height: 1.5;">Hi ${name}，您好！🎉</p>
                    <p style="margin: 8px 0 0 0; font-size: 16px; color: #1a73e8; line-height: 1.6; font-weight: bold;">
                        恭喜您，您的友链申请已通过审核！
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #666; line-height: 1.6;">
                        您的站点已成功加入 Giovan 友情链接，欢迎与我们共同成长、交流！
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #666; line-height: 1.6;">
                        申请信息：${content}
                    </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 24px 0;">
                    <a href="https://www.giovan.cn/#/friends" target="_blank" style="display: inline-block; padding: 12px 36px; background-color: #1a73e8; color: #fff; font-size: 14px; font-weight: 400; text-decoration: none; border-radius: 30px; border: 0;">
                        查看友情链接列表
                    </a>
                </td>
            </tr>
            <tr>
                <td style="padding-top: 16px;">
                    <p style="font-size: 13px; color: #888;">如有任何建议或合作想法，欢迎随时联系 Giovan ！</p>
                </td>
            </tr>
        </table>
      `;
      break;
    case 10:
      template = `
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td style="padding-bottom: 20px;padding-top: 20px;">
                    <p style="margin: 0; font-size: 18px; color: #222; line-height: 1.5;">Hi 站长，您好！</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #666; line-height: 1.6;">
                        您有新的留言，请及时查看和处理。
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #666; line-height: 1.6;">
                        留言人：${name}
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #666; line-height: 1.6;">
                        留言内容：${content}
                    </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 24px 0;">
                    <a href="https://www.giovan.cn/#/admin/note" target="_blank" style="display: inline-block; padding: 12px 36px; background-color: #5865f2; color: #fff; font-size: 14px; font-weight: 400; text-decoration: none; border-radius: 30px; border: 0;">
                        前往后台处理留言
                    </a>
                </td>
            </tr>
        </table>
        `;
      break;
    case 11:
      template = `
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td style="padding-bottom: 20px;padding-top: 20px;">
                    <p style="margin: 0; font-size: 18px; color: #222; line-height: 1.5;">Hi 站长，您好！</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #666; line-height: 1.6;">
                        有人提交了新的友链申请，请及时审核。
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #666; line-height: 1.6;">
                        申请人：${name}
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #666; line-height: 1.6;">
                        申请地址：${content}
                    </p>
                </td>
            </tr>
        </table>
      `;
      break;
    case 12:
      template = `
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td style="padding-bottom: 20px;padding-top: 20px;">
                    <p style="margin: 0; font-size: 18px; color: #222; line-height: 1.5;">Hi ${name}，您好！</p>
                    <p style="margin: 8px 0 0 0; font-size: 16px; color: #e53935; line-height: 1.6; font-weight: bold;">
                        很抱歉，${name}您的友链申请未通过审核。
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #666; line-height: 1.6;">
                        审核未通过原因：${content || "内容不符或不满足本站友链要求"}。
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding-top: 16px;">
                    <p style="font-size: 13px; color: #888;">如有疑问或需补充资料，欢迎随时联系 Giovan ，我们期待您的再次申请！</p>
                </td>
            </tr>
        </table>
      `;
      break;
  }

  return template;
}
