document.addEventListener('DOMContentLoaded', function() {
  // 绑定彩蛋按钮
  const eggBtn = document.getElementById('egg-btn');
  // 弹窗相关元素
  const modal = document.getElementById('totp-modal');
  const input = document.getElementById('totp-input');
  const verifyBtn = document.getElementById('totp-verify');
  const cancelBtn = document.getElementById('totp-cancel');
  const errorDiv = document.getElementById('totp-error');

  if (eggBtn) {
    eggBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      input.value = '';
      errorDiv.style.display = 'none';
      input.focus();
    });
  }
  if (cancelBtn) {
    cancelBtn.onclick = () => { modal.style.display = 'none'; };
  }
  if (verifyBtn) {
    verifyBtn.onclick = async () => {
      errorDiv.style.display = 'none';
      const code = input.value.trim();
      if (!/^\d{6}$/.test(code)) {
        errorDiv.textContent = '请输入6位数字验证码';
        errorDiv.style.display = 'block';
        return;
      }
      try {
        const res = await fetch('/.netlify/functions/verify-totp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            window.location.href = 'caidansuccess.html';
          } else {
            errorDiv.textContent = data.message || '验证码错误';
            errorDiv.style.display = 'block';
          }
        } else {
          errorDiv.textContent = '服务器响应异常';
          errorDiv.style.display = 'block';
        }
      } catch (e) {
        errorDiv.textContent = '网络错误或服务器异常';
        errorDiv.style.display = 'block';
      }
    };
  }

  // 支持回车提交
  if (input) {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') verifyBtn.click();
    });
  }
});