// ==================== 配置 ====================
const API_URL = 'https://api.minimaxi.com/v1/text/chatcompletion_v2';
const MODEL = 'MiniMax-M2.7';
const CONFIG_KEY = 'minimax_api_key';

// ==================== 变量 ====================
let currentOutput = '';

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    loadApiKey();
    registerServiceWorker();
});

// ==================== API 调用 ====================
async function generatePrompt() {
    const userInput = document.getElementById('userInput').value.trim();
    
    if (!userInput) {
        showStatus('请输入需求描述！', 'error');
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        showStatus('请先设置API Key！', 'error');
        showSettings();
        return;
    }
    
    setLoading(true);
    showStatus('正在生成提示词...', 'loading');
    
    try {
        const prompt = `你是一个提示词工程专家。请把以下需求转换为高质量提示词。
要求：
1. 指定角色
2. 明确任务
3. 提供结构
4. 输出清晰专业可直接使用

直接输出提示词，不要解释。

用户需求：${userInput}`;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            currentOutput = data.choices[0].message.content;
            document.getElementById('outputArea').textContent = currentOutput;
            showStatus('✅ 生成成功！', 'success');
            enableButtons();
        } else {
            throw new Error(data.base_resp?.status_msg || '生成失败');
        }
    } catch (error) {
        showStatus('❌ ' + error.message, 'error');
        currentOutput = '';
    } finally {
        setLoading(false);
    }
}

async function optimizePrompt() {
    if (!currentOutput) {
        showStatus('没有可优化的提示词！', 'error');
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        showStatus('请先设置API Key！', 'error');
        return;
    }
    
    setLoading(true);
    showStatus('正在优化提示词...', 'loading');
    
    try {
        const prompt = `你是一个提示词优化专家。请优化以下提示词，使其更加清晰，专业、可执行。
直接输出优化后的提示词，不要解释。

原始提示词：
${currentOutput}`;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            currentOutput = data.choices[0].message.content;
            document.getElementById('outputArea').textContent = currentOutput;
            showStatus('✅ 优化成功！', 'success');
        } else {
            throw new Error(data.base_resp?.status_msg || '优化失败');
        }
    } catch (error) {
        showStatus('❌ ' + error.message, 'error');
    } finally {
        setLoading(false);
    }
}

async function testApi() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    
    if (!apiKey) {
        showStatus('请输入API Key！', 'error');
        return;
    }
    
    showStatus('正在测试API连接...', 'loading');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: 'Hi' }]
            })
        });
        
        if (response.ok) {
            showStatus('✅ API Key有效！', 'success');
        } else {
            throw new Error('API Key无效');
        }
    } catch (error) {
        showStatus('❌ ' + error.message, 'error');
    }
}

// ==================== 工具函数 ====================
function getApiKey() {
    return localStorage.getItem(CONFIG_KEY) || '';
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (apiKey) {
        localStorage.setItem(CONFIG_KEY, apiKey);
        showStatus('✅ API Key已保存！', 'success');
        setTimeout(closeSettings, 1000);
    } else {
        showStatus('请输入API Key！', 'error');
    }
}

function loadApiKey() {
    const savedKey = getApiKey();
    document.getElementById('apiKeyInput').value = savedKey;
}

function showSettings() {
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('show');
}

function setLoading(loading) {
    const btn = document.getElementById('generateBtn');
    btn.disabled = loading;
    btn.textContent = loading ? '⏳ 生成中...' : '✨ 生成';
}

function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = 'status ' + type;
    
    if (type !== 'loading') {
        setTimeout(() => {
            status.className = 'status';
        }, 3000);
    }
}

function enableButtons() {
    document.getElementById('optimizeBtn').disabled = false;
    document.getElementById('copyBtn').disabled = false;
}

function copyResult() {
    if (currentOutput) {
        navigator.clipboard.writeText(currentOutput).then(() => {
            showStatus('✅ 已复制到剪贴板！', 'success');
        }).catch(() => {
            showStatus('❌ 复制失败', 'error');
        });
    }
}

function clearAll() {
    document.getElementById('userInput').value = '';
    document.getElementById('outputArea').textContent = '';
    document.getElementById('optimizeBtn').disabled = true;
    document.getElementById('copyBtn').disabled = true;
    currentOutput = '';
    showStatus('已清空', 'success');
}

// ==================== Service Worker ====================
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
}
