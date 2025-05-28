// 等待 DOM 完全加载后再执行
document.addEventListener('DOMContentLoaded', () => {
    // 获取公告容器
    const announcementContent = document.querySelector('.announcement-content');
    const addAnnouncementBtn = document.getElementById('add-announcement-btn');
    const announcementModal = document.getElementById('announcement-modal');
    const closeAnnouncementBtn = document.getElementById('close-announcement-modal');
    const submitAnnouncementBtn = document.getElementById('submit-announcement');
    const announcementInput = document.getElementById('announcement-input');

    // 初始化公告集合引用
    const announcementsRef = window.firestoreDb.collection('announcements');

    // 添加事件监听器
    if (addAnnouncementBtn) {
        addAnnouncementBtn.addEventListener('click', () => {
            announcementModal.style.display = 'block';
            // 添加提示文本
            if (announcementInput) {
                announcementInput.placeholder = '在这里输入公告内容...';
            }
        });
    }

    if (closeAnnouncementBtn) {
        closeAnnouncementBtn.addEventListener('click', () => {
            announcementModal.style.display = 'none';
            announcementInput.value = ''; // 清空输入
        });
    }

    // 更新验证模态框UI
    function updateTotpModalUI(isEasterEgg = false) {
        const description = document.getElementById('totp-description');
        const input = document.getElementById('totp-input');
        const extraInfo = document.getElementById('totp-extra-info');
        
        if (isEasterEgg) {
            description.textContent = '请输入 Google Authenticator 生成的6位验证码';
            input.maxLength = '6';
            input.pattern = '\\d{6}';
            input.autocomplete = 'one-time-code';
            extraInfo.style.display = 'block';
        } else {
            description.textContent = '请输入密码';
            input.maxLength = '4';
            input.pattern = '\\d{4}';
            input.autocomplete = 'off';
            extraInfo.style.display = 'none';
        }
        
        input.value = ''; // 清空输入
        document.getElementById('totp-error').style.display = 'none'; // 清空错误信息
    }

    // 在点击彩蛋按钮时设置一个标记
    function setEasterEggVerified() {
        localStorage.setItem('easterEggVerified', 'true');
        localStorage.setItem('easterEggVerifiedTime', Date.now().toString());
    }

    // 检查是否已通过彩蛋验证
    function checkEasterEggVerification() {
        const verified = localStorage.getItem('easterEggVerified') === 'true';
        const verifiedTime = parseInt(localStorage.getItem('easterEggVerifiedTime') || '0');
        const now = Date.now();
        // 验证时间在30分钟内有效
        return verified && (now - verifiedTime < 30 * 60 * 1000);
    }

    if (submitAnnouncementBtn) {
        submitAnnouncementBtn.addEventListener('click', async () => {
            const content = announcementInput.value.trim();
            if (!content) {
                alert('请输入公告内容');
                return;
            }

            // 验证HTML标签是否合法
            if (!isValidHtml(content)) {
                alert('HTML标签格式不正确，请检查标签是否正确闭合');
                return;
            }
            
            // 显示密码验证弹窗
            const totpModal = document.getElementById('totp-modal');
            if (totpModal) {
                updateTotpModalUI(false); // 使用日期密码模式
                totpModal.style.display = 'block';
            }
            
            // 设置验证按钮的点击事件
            const totpVerifyBtn = document.getElementById('totp-verify');
            if (totpVerifyBtn) {
                totpVerifyBtn.onclick = async () => {
                    const totpInput = document.getElementById('totp-input');
                    const password = totpInput.value.trim();
                    
                    // 获取今天的日期作为密码
                    const today = new Date();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    const correctPassword = month + day;
                    
                    if (password === correctPassword) {
                        const success = await addAnnouncement(content);
                        if (success) {
                            announcementInput.value = ''; // 清空输入
                            totpInput.value = ''; // 清空密码
                            totpModal.style.display = 'none';
                            announcementModal.style.display = 'none';
                        }
                    } else {
                        const totpError = document.getElementById('totp-error');
                        if (totpError) {
                            totpError.textContent = '密码错误';
                            totpError.style.display = 'block';
                        }
                    }
                };
            }
            
            // 设置取消按钮的点击事件
            const totpCancelBtn = document.getElementById('totp-cancel');
            if (totpCancelBtn) {
                totpCancelBtn.onclick = () => {
                    const totpModal = document.getElementById('totp-modal');
                    const totpInput = document.getElementById('totp-input');
                    if (totpModal) totpModal.style.display = 'none';
                    if (totpInput) totpInput.value = '';
                };
            }
        });
    }

    // 点击模态框外部关闭
    if (announcementModal) {
        window.addEventListener('click', (event) => {
            if (event.target === announcementModal) {
                announcementModal.style.display = 'none';
                announcementInput.value = '';
            }
        });
    }

    // 点击TOTP模态框外部关闭
    const totpModal = document.getElementById('totp-modal');
    if (totpModal) {
        window.addEventListener('click', (event) => {
            if (event.target === totpModal) {
                totpModal.style.display = 'none';
                const totpInput = document.getElementById('totp-input');
                if (totpInput) totpInput.value = '';
            }
        });
    }

    // 验证HTML标签是否合法
    function isValidHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        // 检查是否有未闭合的标签
        const originalHtml = div.innerHTML;
        div.innerHTML = originalHtml;
        return div.innerHTML === originalHtml;
    }

    // 加载公告
    function loadAnnouncements() {
        if (!announcementContent) return;
        
        announcementContent.innerHTML = ''; // 清空现有内容
        announcementsRef.orderBy('date', 'desc').limit(5).get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const announcement = doc.data();
                    const announcementElement = createAnnouncementElement(announcement);
                    announcementContent.appendChild(announcementElement);
                });
            })
            .catch((error) => {
                console.error("Error loading announcements: ", error);
            });
    }

    // 创建公告元素
    function createAnnouncementElement(announcement) {
        const div = document.createElement('div');
        div.className = 'announcement-item';
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'announcement-date';
        dateSpan.textContent = announcement.date;
        
        const content = document.createElement('p');
        
        // 检查是否包含彩蛋文本
        if (announcement.content.includes('本网站由dingyijie提供了彩蛋')) {
            // 创建彩蛋按钮
            const eggText = document.createTextNode('本网站由dingyijie提供了彩蛋');
            const eggBtn = document.createElement('a');
            eggBtn.href = 'javascript:void(0);';
            eggBtn.id = 'egg-btn';
            eggBtn.textContent = '🥚';
            
            content.appendChild(eggText);
            content.appendChild(eggBtn);
            
            // 添加点击事件 - 使用 TOTP 验证
            eggBtn.addEventListener('click', () => {
                const modal = document.getElementById('totp-modal');
                if (modal) {
                    updateTotpModalUI(true); // 使用TOTP验证模式
                    modal.style.display = 'flex';
                    const input = document.getElementById('totp-input');
                    if (input) {
                        input.value = '';
                        input.focus();
                    }
                    
                    // 设置验证按钮的点击事件
                    const totpVerifyBtn = document.getElementById('totp-verify');
                    if (totpVerifyBtn) {
                        totpVerifyBtn.onclick = async () => {
                            const totpCode = input.value.trim();
                            
                            if (totpCode.length !== 6 || !/^\d+$/.test(totpCode)) {
                                const errorDiv = document.getElementById('totp-error');
                                if (errorDiv) {
                                    errorDiv.textContent = '请输入6位数字验证码';
                                    errorDiv.style.display = 'block';
                                }
                                return;
                            }

                            // 获取当前时间戳（30秒为一个周期）
                            const timeStep = Math.floor(Date.now() / 30000);
                            
                            try {
                                // 验证TOTP - 使用GET请求，包含时间戳
                                const response = await fetch(`/.netlify/functions/verify-totp?code=${totpCode}&t=${timeStep}`, {
                                    method: 'GET',
                                    headers: {
                                        'Cache-Control': 'no-cache'  // 防止缓存
                                    }
                                });
                                
                                const data = await response.json();
                                
                                if (response.ok && data.valid === true) {
                                    setEasterEggVerified(); // 设置验证通过标记
                                    window.location.href = 'caidansuccess.html';
                                } else {
                                    const errorDiv = document.getElementById('totp-error');
                                    if (errorDiv) {
                                        errorDiv.textContent = data.message || '验证码错误';
                                        errorDiv.style.display = 'block';
                                    }
                                }
                            } catch (error) {
                                console.error("Error verifying TOTP: ", error);
                                const errorDiv = document.getElementById('totp-error');
                                if (errorDiv) {
                                    errorDiv.textContent = '验证过程出错';
                                    errorDiv.style.display = 'block';
                                }
                            }
                        };
                    }
                }
            });
        } else {
            content.innerHTML = announcement.content; // 使用innerHTML以支持其他HTML标签
        }
        
        // 为所有链接添加target="_blank"
        content.querySelectorAll('a').forEach(link => {
            if (link.id !== 'egg-btn') { // 不处理彩蛋按钮
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
        
        div.appendChild(dateSpan);
        div.appendChild(content);
        
        return div;
    }

    // 添加新公告
    async function addAnnouncement(content) {
        try {
            const date = new Date().toISOString().split('T')[0];
            await announcementsRef.add({
                content: content,
                date: date,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            loadAnnouncements(); // 重新加载公告
            return true;
        } catch (error) {
            console.error("Error adding announcement: ", error);
            return false;
        }
    }

    // 初始化时加载公告
    loadAnnouncements();
}); 