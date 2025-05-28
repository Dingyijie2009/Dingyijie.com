// 在页面加载时检查是否通过TOTP验证
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 检查验证状态
        const response = await fetch('/.netlify/functions/verify-totp/status', {
            method: 'GET'
        });
        
        if (!response.ok) {
            // 如果未通过验证，重定向到主页
            window.location.replace('https://dingyijie.com');
            return;
        }

        // 如果验证通过，显示庆祝动画
        const celebrationContainer = document.querySelector('.celebration-container');
        if (celebrationContainer) {
            celebrationContainer.style.display = 'block';
            
            // 添加烟花动画
            for (let i = 0; i < 10; i++) {
                const firework = document.createElement('div');
                firework.className = 'firework';
                firework.style.left = Math.random() * 100 + 'vw';
                firework.style.animationDelay = Math.random() * 2 + 's';
                celebrationContainer.appendChild(firework);
            }
        }
    } catch (error) {
        console.error('验证状态检查失败:', error);
        // 发生错误时也重定向到主页
        window.location.replace('https://dingyijie.com');
    }
}); 