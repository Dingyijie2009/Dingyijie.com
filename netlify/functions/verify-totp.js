const speakeasy = require('speakeasy');

const SECRET = 'JBSWY3DPEHPK3PXP'; // 必须和 qrcode.html 一致

exports.handler = async function(event, context) {
  try {
    const { code } = JSON.parse(event.body || '{}');
    const verified = speakeasy.totp.verify({
      secret: SECRET,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (verified) {
      // 验证成功，重定向到目标页面
      return {
        statusCode: 302, // 302 表示重定向
        headers: { Location: '/caidansuccess.html' }, // 跳转的目标页面
      };
    } else {
      // 验证失败
      return {
        statusCode: 401, // 401 表示未授权
        body: JSON.stringify({ success: false, message: '验证码错误' })
      };
    }
  } catch (e) {
    // 异常处理
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: '服务器异常' })
    };
  }
};