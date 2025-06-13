// 使用全局的 Realtime Database 实例
const messagesRef = window.realtimeDb.ref('messages');
const violationsRef = window.realtimeDb.ref('violations'); // 添加违规记录引用

// DOM 元素
const messageModal = document.getElementById('message-modal');
const modalContent = document.querySelector('.modal-content');
const closeModalBtn = document.getElementById('close-modal');
const submitMessageBtn = document.getElementById('submit-message');
const messageInput = document.getElementById('message-input');
const messageLeavesContainer = document.getElementById('message-leaves');
const treeContent = document.querySelector('.tree-content');
const treeContentWrapper = document.querySelector('.tree-content-wrapper');

// 检查是否是iOS设备
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
let originalHeight;
let originalScrollPos;

// 添加用户行为监控
const userBehavior = {
    messageCount: 0,
    lastMessageTime: 0,
    warningCount: 0,
    blocked: false
};

// 内容检测规则
const contentRules = {
    maxMessagesPerMinute: 3,
    maxWarnings: 3,
    blockDuration: 30 * 60 * 1000, // 30分钟
    suspiciousPatterns: [
        /(.)\1{4,}/, // 重复字符超过4次
        /[^\u4e00-\u9fa5a-zA-Z0-9\s.,!?，。！？]/g, // 特殊字符
        /.{100,}/, // 超长消息
        /(.)\1{2,}(.)\2{2,}/, // 重复模式
    ]
};

// 添加违规记录
async function recordViolation(message, reason, ip) {
    try {
        await violationsRef.push({
            message: message,
            reason: reason,
            ip: ip,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            warningCount: userBehavior.warningCount,
            blocked: userBehavior.blocked
        });
    } catch (error) {
        console.error('Error recording violation:', error);
    }
}

// 检查消息内容
function checkMessageContent(message) {
    // 检查是否被屏蔽
    if (userBehavior.blocked) {
        const blockTimeLeft = contentRules.blockDuration - (Date.now() - userBehavior.lastMessageTime);
        if (blockTimeLeft > 0) {
            throw new Error(`NMD，您的数据已监控至Dingyijie.com，请${Math.ceil(blockTimeLeft / 60000)}分钟后再试`);
        } else {
            userBehavior.blocked = false;
            userBehavior.warningCount = 0;
        }
    }

    // 检查发送频率
    const now = Date.now();
    if (now - userBehavior.lastMessageTime < 60000) { // 1分钟内
        userBehavior.messageCount++;
        if (userBehavior.messageCount > contentRules.maxMessagesPerMinute) {
            userBehavior.warningCount++;
            if (userBehavior.warningCount >= contentRules.maxWarnings) {
                userBehavior.blocked = true;
                userBehavior.lastMessageTime = now;
                // 记录违规
                recordViolation(message, '发送频率过高', getClientIP());
                throw new Error('NMD，您的数据已监控至Dingyijie.com，您已被暂时屏蔽30分钟');
            }
            // 记录警告
            recordViolation(message, '发送过于频繁', getClientIP());
            throw new Error(`NMD，您的数据已监控至Dingyijie.com，发送过于频繁（警告${userBehavior.warningCount}/${contentRules.maxWarnings}）`);
        }
    } else {
        userBehavior.messageCount = 1;
    }

    // 检查内容规则
    for (const pattern of contentRules.suspiciousPatterns) {
        if (pattern.test(message)) {
            userBehavior.warningCount++;
            if (userBehavior.warningCount >= contentRules.maxWarnings) {
                userBehavior.blocked = true;
                userBehavior.lastMessageTime = now;
                // 记录违规
                recordViolation(message, '内容违规', getClientIP());
                throw new Error('NMD，您的数据已监控至Dingyijie.com，您已被暂时屏蔽30分钟');
            }
            // 记录警告
            recordViolation(message, '内容不符合规范', getClientIP());
            throw new Error(`NMD，您的数据已监控至Dingyijie.com，内容不符合规范（警告${userBehavior.warningCount}/${contentRules.maxWarnings}）`);
        }
    }

    userBehavior.lastMessageTime = now;
    return true;
}

// 显示模态框
function showModal() {
    originalScrollPos = window.pageYOffset;
    originalHeight = window.innerHeight;
    
    messageModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${originalScrollPos}px`;
    
    messageInput.focus();
}

// 隐藏模态框
function hideModal() {
    messageModal.style.display = 'none';
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    window.scrollTo(0, originalScrollPos);
    messageInput.value = '';
    messageInput.blur();
}

// 点击树区域打开留言框
treeContent.addEventListener('click', (e) => {
    // 如果点击的是叶子或者其内部元素，不触发打开模态框
    if (!e.target.closest('.message-leaf')) {
        showModal();
    }
});

// 处理模态框内容的点击事件
modalContent.addEventListener('click', (e) => {
    e.stopPropagation();
});

// 处理输入框的事件
messageInput.addEventListener('click', (e) => e.stopPropagation());
messageInput.addEventListener('touchstart', (e) => e.stopPropagation());
messageInput.addEventListener('touchend', (e) => e.stopPropagation());

// 点击模态框背景关闭
messageModal.addEventListener('click', (e) => {
    if (e.target === messageModal) {
        hideModal();
    }
});

// 点击关闭按钮关闭模态框
closeModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideModal();
});

// 修改提交留言的处理函数
submitMessageBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const message = messageInput.value.trim();
    if (!message) {
        alert('请输入留言内容');
        return;
    }
    
    if (!messagesRef) {
        alert('系统初始化中，请稍后再试');
        return;
    }

    try {
        // 检查消息内容
        checkMessageContent(message);

        // 记录用户IP和消息内容到数据库
        await messagesRef.push({
            content: message,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            ip: await getClientIP(), // 需要实现getClientIP函数
            warningCount: userBehavior.warningCount
        });

        hideModal();
    } catch (error) {
        console.error('Error adding message:', error);
        alert(error.message || '发送失败，请重试');
    }
});

// 获取客户端IP地址
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error getting IP:', error);
        return 'unknown';
    }
}

// 加载和显示消息
function createMessageLeaf(message, key, index, total) {
    const leaf = document.createElement('div');
    leaf.className = 'message-leaf';
    leaf.setAttribute('data-key', key);
    leaf.setAttribute('data-content', message.content);
    
    // 添加装饰叶子
    const leafDecor = document.createElement('span');
    leafDecor.className = 'leaf-decor';
    leafDecor.textContent = '🍃';
    leaf.appendChild(leafDecor);
    
    // 根据文字长度设置叶子大小类
    const contentLength = message.content.length;
    if (contentLength <= 5) {
        leaf.classList.add('leaf-tiny');
    } else if (contentLength <= 15) {
        leaf.classList.add('leaf-small');
    } else if (contentLength <= 30) {
        leaf.classList.add('leaf-medium');
    } else {
        leaf.classList.add('leaf-large');
    }
    
    // 使用消息索引计算位置，确保位置固定
    const section = index % 4; // 将树分为4个区域
    const baseAngle = (section * 90) + ((index % 3) * 20); // 每个区域内分成3份，间隔改为20度
    const radius = 120 + (index % 3) * 40; // 减小基础半径和间距
    
    // 将极坐标转换为笛卡尔坐标，调整分布范围
    const radian = (baseAngle * Math.PI) / 180;
    const x = 50 + (radius * Math.cos(radian) / 4); // 调整除数，控制水平分布
    const y = 50 + (radius * Math.sin(radian) / 5); // 调整除数，控制垂直分布
    
    // 添加小范围随机偏移
    const randomOffsetX = (Math.random() - 0.5) * 10;
    const randomOffsetY = (Math.random() - 0.5) * 8;
    
    leaf.style.left = `${x + randomOffsetX}%`;
    leaf.style.top = `${y + randomOffsetY}%`;
    
    // 使用CSS自定义属性存储初始旋转角度
    const rotation = baseAngle % 20 - 10; // 减小旋转角度范围到-10到10度之间
    leaf.style.setProperty('--initial-rotation', `${rotation}deg`);
    
    // 动画延迟基于索引，使叶子依次出现
    leaf.style.animationDelay = `${index * 0.1}s`;
    
    return leaf;
}

// 实时监听消息更新
function initializeMessageListener() {
    if (!messagesRef) {
        console.error('Messages reference not initialized');
        return;
    }

    messagesRef
        .orderByChild('timestamp')
        .limitToLast(12) // 限制显示最新的12条消息
        .on('value', (snapshot) => {
            messageLeavesContainer.innerHTML = '';
            
            if (!snapshot.exists()) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-message';
                emptyMessage.textContent = '暂无留言，来添加第一条吧！';
                messageLeavesContainer.appendChild(emptyMessage);
                return;
            }

            // 将数据转换为数组并按时间戳排序
            const messages = [];
            snapshot.forEach((childSnapshot) => {
                messages.push({
                    key: childSnapshot.key,
                    data: childSnapshot.val()
                });
            });
            
            // 按时间戳排序，确保顺序一致
            messages.sort((a, b) => b.data.timestamp - a.data.timestamp);

            // 显示消息
            messages.forEach((message, index) => {
                if (message.data && message.data.content) {
                    const leaf = createMessageLeaf(message.data, message.key, index, messages.length);
                    messageLeavesContainer.appendChild(leaf);
                }
            });
        }, (error) => {
            console.error('Error loading messages:', error);
            messageLeavesContainer.innerHTML = '<div class="error-message">加载失败，请刷新页面重试</div>';
        });
}

// 在页面加载完成后初始化监听器
document.addEventListener('DOMContentLoaded', () => {
    initializeMessageListener();
});

// 处理iOS键盘事件
if (isIOS) {
    let originalHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight;
        
        if (messageModal.style.display === 'flex') {
            if (currentHeight < originalHeight) {
                // 键盘弹出
                messageModal.style.height = `${originalHeight}px`;
                modalContent.style.position = 'absolute';
                modalContent.style.bottom = '20px';
                modalContent.style.left = '50%';
                modalContent.style.transform = 'translateX(-50%)';
                window.scrollTo(0, 0);
            } else {
                // 键盘收起
                modalContent.style.position = 'relative';
                modalContent.style.bottom = 'auto';
                modalContent.style.left = 'auto';
                modalContent.style.transform = 'none';
                // 恢复原始滚动位置
                window.scrollTo(0, originalScrollPos);
            }
        }
    });

    // 防止iOS橡皮筋效果和滚动
    messageModal.addEventListener('touchmove', (e) => {
        if (e.target !== messageInput) {
            e.preventDefault();
        }
    }, { passive: false });

    // 处理输入框焦点
    messageInput.addEventListener('focus', () => {
        setTimeout(() => {
            messageInput.scrollIntoView(false);
        }, 300);
    });

    // 处理输入框失去焦点
    messageInput.addEventListener('blur', () => {
        setTimeout(() => {
            window.scrollTo(0, originalScrollPos);
        }, 100);
    });
}

// 防止触摸事件穿透
modalContent.addEventListener('touchstart', (e) => e.stopPropagation());
modalContent.addEventListener('touchend', (e) => e.stopPropagation());
messageInput.addEventListener('touchstart', (e) => e.stopPropagation());
messageInput.addEventListener('touchend', (e) => e.stopPropagation()); 