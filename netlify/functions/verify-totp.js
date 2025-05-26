const speakeasy = require('speakeasy');

const SECRET = 'JBSWY3DPEHPK3PXP'; // 必须和qrcode.html一致

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
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    } else {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: '验证码错误' })
      };
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: '服务器异常' })
    };
  }
};