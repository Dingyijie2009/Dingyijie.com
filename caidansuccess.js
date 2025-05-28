// 检查是否已通过彩蛋验证
function checkEasterEggVerification() {
    const verified = sessionStorage.getItem('easterEggVerified') === 'true';
    const verifiedTime = parseInt(sessionStorage.getItem('easterEggVerifiedTime') || '0');
    const now = Date.now();
    // 验证时间在2分钟内有效
    return verified && (now - verifiedTime < 2 * 60 * 1000);
}

// 在页面加载时检查验证状态
document.addEventListener('DOMContentLoaded', () => {
    if (!checkEasterEggVerification()) {
        // 如果未通过验证或验证已过期，重定向到主页
        window.location.replace('/');
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
}); 