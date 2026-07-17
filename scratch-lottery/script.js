// 游戏数据
let gameData = {
    totalScore: 0,
    totalScratched: 0,
    winCount: 0,
    history: []
};

// 当前游戏状态
let currentGame = {};

// Canvas 相关
let canvas, ctx;
let isDrawing = false;
let lastX = 0, lastY = 0;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadGameData();
    initCanvas();
    generateNewGame();
    
    // 事件监听
    document.getElementById('newGameBtn').addEventListener('click', generateNewGame);
    document.getElementById('resetBtn').addEventListener('click', resetGameData);
    
    // Canvas 事件
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // 触摸事件支持
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    updateUI();
});

// 初始化 Canvas
function initCanvas() {
    canvas = document.getElementById('scratchCanvas');
    ctx = canvas.getContext('2d');
    
    // 设置 Canvas 大小
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.offsetWidth;
    canvas.height = wrapper.offsetHeight;
    
    // 绘制初始覆盖层
    drawScratchLayer();
}

// 绘制刮刮层
function drawScratchLayer() {
    ctx.save();
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加纹理效果
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    for (let i = 0; i < canvas.height; i += 10) {
        ctx.fillRect(0, i, canvas.width, 5);
    }
    
    // 添加文字
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('刮一刮', canvas.width / 2, canvas.height / 2);
    
    ctx.restore();
}

// 生成新游戏
function generateNewGame() {
    // 生成随机中奖金额（权重设置）
    const prizes = [
        { amount: 0, weight: 40 },      // 未中奖 40%
        { amount: 5, weight: 20 },      // 5元 20%
        { amount: 10, weight: 15 },     // 10元 15%
        { amount: 20, weight: 12 },     // 20元 12%
        { amount: 50, weight: 8 },      // 50元 8%
        { amount: 100, weight: 3 },     // 100元 3%
        { amount: 200, weight: 2 }      // 200元 2%
    ];
    
    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedPrize = prizes[0];
    for (let prize of prizes) {
        random -= prize.weight;
        if (random <= 0) {
            selectedPrize = prize;
            break;
        }
    }
    
    // 生成随机中奖号码
    const prizeCode = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    
    // 生成小奖金额
    const smallPrizes = [
        Math.floor(Math.random() * 5) + 1,
        Math.floor(Math.random() * 10) + 5,
        Math.floor(Math.random() * 15) + 10,
        Math.floor(Math.random() * 30) + 20,
        Math.floor(Math.random() * 60) + 40,
        Math.floor(Math.random() * 100) + 100
    ];
    
    currentGame = {
        ticketNumber: String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
        prizeAmount: selectedPrize.amount,
        prizeCode: prizeCode,
        smallPrizes: smallPrizes,
        scratchPercentage: 0,
        startTime: new Date(),
        isWon: false,
        isRevealed: false
    };
    
    // 更新显示
    document.getElementById('ticketNumber').textContent = currentGame.ticketNumber;
    document.getElementById('prizeAmount').textContent = currentGame.prizeAmount > 0 ? `¥${currentGame.prizeAmount}` : '谢谢参与';
    document.getElementById('prizeCode').textContent = currentGame.prizeCode;
    
    // 更新小奖
    for (let i = 0; i < 6; i++) {
        document.getElementById(`sp${i + 1}`).textContent = currentGame.smallPrizes[i];
    }
    
    // 重置 Canvas
    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawScratchLayer();
    }, 100);
}

// 开始绘制（刮刮）
function startDrawing(e) {
    if (currentGame.isRevealed) return;
    
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

// 处理触摸事件
function handleTouch(e) {
    if (currentGame.isRevealed) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// 绘制（刮刮动作）
function draw(e) {
    if (!isDrawing || currentGame.isRevealed) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 清除矩形区域（模拟刮开效果）
    const radius = 30;
    ctx.clearRect(x - radius, y - radius, radius * 2, radius * 2);
    
    // 添加边缘模糊效果
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    lastX = x;
    lastY = y;
    
    // 计算刮开百分比
    updateScratchPercentage();
}

// 停止绘制
function stopDrawing() {
    isDrawing = false;
}

// 计算刮开百分比
function updateScratchPercentage() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let clearedPixels = 0;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 128) {
            clearedPixels++;
        }
    }
    
    const percentage = (clearedPixels / (canvas.width * canvas.height)) * 100;
    currentGame.scratchPercentage = percentage;
    
    // 刮开超过 50% 时自动显示结果
    if (percentage > 50 && !currentGame.isRevealed) {
        revealResult();
    }
}

// 显示结果
function revealResult() {
    currentGame.isRevealed = true;
    
    // 更新游戏统计
    gameData.totalScratched++;
    
    if (currentGame.prizeAmount > 0) {
        gameData.totalScore += currentGame.prizeAmount;
        gameData.winCount++;
        showRewardNotification(`恭喜中奖！¥${currentGame.prizeAmount}`, true);
    } else {
        showRewardNotification('谢谢参与', false);
    }
    
    // 保存历史记录
    saveGameRecord();
    
    // 更新 UI
    updateUI();
}

// 显示奖励通知
function showRewardNotification(text, isWin) {
    const notification = document.getElementById('rewardNotification');
    const rewardText = document.getElementById('rewardText');
    
    rewardText.textContent = text;
    notification.classList.remove('show', 'win');
    
    // 强制重排以触发动画
    void notification.offsetWidth;
    
    if (isWin) {
        notification.classList.add('show', 'win');
    } else {
        notification.classList.add('show');
    }
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 保存游戏记录
function saveGameRecord() {
    const record = {
        ticketNumber: currentGame.ticketNumber,
        prize: currentGame.prizeAmount,
        time: new Date().toLocaleTimeString('zh-CN')
    };
    
    gameData.history.unshift(record);
    if (gameData.history.length > 50) {
        gameData.history.pop();
    }
    
    saveGameData();
    updateHistoryDisplay();
}

// 更新 UI
function updateUI() {
    document.getElementById('totalScore').textContent = gameData.totalScore;
    document.getElementById('totalScratched').textContent = gameData.totalScratched;
    document.getElementById('winCount').textContent = gameData.winCount;
}

// 更新历史记录显示
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    
    if (gameData.history.length === 0) {
        historyList.innerHTML = '<p class="empty-hint">暂无历史记录</p>';
        return;
    }
    
    historyList.innerHTML = gameData.history.map(record => `
        <div class="history-item">
            <div>
                <span class="history-ticket">编号 ${record.ticketNumber}</span>
                <span class="history-time"> - ${record.time}</span>
            </div>
            <div class="history-prize">${record.prize > 0 ? `¥${record.prize}` : '未中奖'}</div>
        </div>
    `).join('');
}

// 重置游戏数据
function resetGameData() {
    if (confirm('确定要重置所有数据吗？此操作无法撤销！')) {
        gameData = {
            totalScore: 0,
            totalScratched: 0,
            winCount: 0,
            history: []
        };
        saveGameData();
        updateUI();
        updateHistoryDisplay();
        showRewardNotification('数据已重置', false);
    }
}

// 本地存储
function saveGameData() {
    localStorage.setItem('scratchLotteryData', JSON.stringify(gameData));
}

function loadGameData() {
    const saved = localStorage.getItem('scratchLotteryData');
    if (saved) {
        gameData = JSON.parse(saved);
        updateHistoryDisplay();
    }
}

// 窗口调整大小时重新初始化 Canvas
window.addEventListener('resize', () => {
    if (!currentGame.isRevealed) {
        initCanvas();
    }
});
