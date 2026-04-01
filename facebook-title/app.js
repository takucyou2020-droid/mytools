// ==================== 配置 ====================
const API_URL = 'https://api.minimaxi.com/v1/text/chatcompletion_v2';
const MODEL = 'MiniMax-M2.7';
const CONFIG_KEY = 'fb_title_api_key';

// ==================== 变量 ====================
let currentOutput = '';
let parsedTitles = []; // 存储解析后的标题

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    loadApiKey();
    registerServiceWorker();
});

// ==================== 优化标题 ====================
async function optimizeTitle() {
    const originalTitle = document.getElementById('originalTitle').value.trim();
    
    if (!originalTitle) {
        showStatus('Please enter a title first!', 'error');
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        showStatus('Please set your API Key first!', 'error');
        showSettings();
        return;
    }
    
    setLoading(true);
    showStatus('Optimizing your titles...', 'loading');
    
    try {
        const prompt = `You are a Facebook Marketplace SEO title optimization expert.

Your task:
Generate 3 optimized titles based on the user's original title.

━━━━━━━━━━━━━━━━━━━
🎯 Optimization Goals
━━━━━━━━━━━━━━━━━━━
1. Boost search visibility (SEO)
2. Match Facebook Marketplace search habits
3. Keep titles factual and professional

━━━━━━━━━━━━━━━━━━━
📦 Input
━━━━━━━━━━━━━━━━━━━
Original Title: "${originalTitle}"

━━━━━━━━━━━━━━━━━━━
🧠 Generation Rules
━━━━━━━━━━━━━━━━━━━
1. Extract key info: brand, product name, model, specifications, size, color
2. Add relevant search keywords naturally
3. Structure: [Brand] + [Product Name] + [Model] + [Key Specs] + [Color]
4. Each title: 8-12 words max
5. Focus ONLY on factual product attributes
6. NO hype words, NO clickbait, NO promotional words

━━━━━━━━━━━━━━━━━━━
📤 Output Format
━━━━━━━━━━━━━━━━━━━

### Top Pick:
[Your best optimized title - highest SEO potential]

### Recommended:
[Second best - strong keywords + clarity]

### Alternative:
[Third option - different keyword focus]

### Keyword Analysis:
• [keyword 1]: [search relevance]
• [keyword 2]: [search relevance]

### Optimization Notes:
1. [Brief explanation of Title 1]
2. [Brief explanation of Title 2]
3. [Brief explanation of Title 3]

━━━━━━━━━━━━━━━━━━━
⚠️ Important Rules
━━━━━━━━━━━━━━━━━━━
- Keep titles 100% factual and honest
- NO words like: Brand New, Like New, Must Go, Mint, Great Deal, Hot, Best
- Focus on specs: model number, size, color, material, quantity
- 80-100 characters max per title
- Professional tone only

Output in English only.`;

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
            currentOutput = data.choices[0].message.content.trim();
            displayResults(currentOutput);
            showStatus('Titles optimized!', 'success');
        } else {
            throw new Error(data.base_resp?.status_msg || 'Optimization failed');
        }
    } catch (error) {
        showStatus('❌ ' + error.message, 'error');
        currentOutput = '';
    } finally {
        setLoading(false);
    }
}

// ==================== 解析并显示结果 ====================
function displayResults(content) {
    const outputArea = document.getElementById('outputArea');
    
    // 解析各部分
    const topPickMatch = content.match(/### Top Pick:?\s*\n([\s\S]*?)(?=###|##|### )/i);
    const recommendedMatch = content.match(/### Recommended:?\s*\n([\s\S]*?)(?=###|##|### )/i);
    const alternativeMatch = content.match(/### Alternative:?\s*\n([\s\S]*?)(?=### Keyword|## Keyword|### )/i);
    const keywordMatch = content.match(/### Keyword Analysis:?\s*\n([\s\S]*?)(?=###|## Optimization)/i);
    const notesMatch = content.match(/### Optimization Notes:?\s*\n([\s\S]*?)$/i);
    
    let topPick = topPickMatch ? topPickMatch[1].trim().replace(/^\d+[\.\)]\s*/, '') : '';
    let recommended = recommendedMatch ? recommendedMatch[1].trim().replace(/^\d+[\.\)]\s*/, '') : '';
    let alternative = alternativeMatch ? alternativeMatch[1].trim().replace(/^\d+[\.\)]\s*/, '') : '';
    let keywords = keywordMatch ? keywordMatch[1].trim() : '';
    let notes = notesMatch ? notesMatch[1].trim() : '';
    
    // 存储标题
    parsedTitles = [];
    if (topPick) parsedTitles.push({ tier: 'top', text: topPick });
    if (recommended) parsedTitles.push({ tier: 'recommended', text: recommended });
    if (alternative) parsedTitles.push({ tier: 'alternative', text: alternative });
    
    // 生成HTML
    let html = '<div class="results-container">';
    
    // 标题卡片
    html += '<div class="section-title">📝 Optimized Titles</div>';
    html += '<div class="titles-list">';
    
    const tierIcons = { 'top': '⭐', 'recommended': '✓', 'alternative': '○' };
    const tierLabels = { 'top': 'Top Pick', 'recommended': 'Recommended', 'alternative': 'Alternative' };
    const tierColors = { 'top': '#166FE5', 'recommended': '#28a745', 'alternative': '#6c757d' };
    
    parsedTitles.forEach((item, index) => {
        const icon = tierIcons[item.tier];
        const label = tierLabels[item.tier];
        const color = tierColors[item.tier];
        
        html += `
        <div class="title-item ${item.tier}">
            <div class="title-header">
                <span class="tier-badge" style="background: ${color}">${icon} ${label}</span>
            </div>
            <div class="title-content">${item.text}</div>
            <div class="title-buttons">
                <button class="btn-copy" onclick="copyTitle(${index})">📋 Copy</button>
                <button class="btn-use" onclick="useTitle(${index})">✅ Use</button>
            </div>
        </div>`;
    });
    
    html += '</div>';
    
    // 关键词分析
    if (keywords) {
        html += '<div class="section-title">🔍 Keyword Analysis</div>';
        html += '<div class="analysis-box">';
        const keywordLines = keywords.split('\n').filter(line => line.trim().startsWith('•') || line.includes(':'));
        if (keywordLines.length > 0) {
            html += '<ul class="keyword-list">';
            keywordLines.forEach(line => {
                if (line.trim()) {
                    html += `<li>${line.trim()}</li>`;
                }
            });
            html += '</ul>';
        } else {
            html += `<p>${keywords}</p>`;
        }
        html += '</div>';
    }
    
    // 优化说明
    if (notes) {
        html += '<div class="section-title">📋 Optimization Notes</div>';
        html += '<div class="notes-box">';
        const noteLines = notes.split('\n').filter(line => line.trim());
        noteLines.forEach(line => {
            line = line.trim();
            if (line) {
                line = line.replace(/^\d+[\.\)]\s*/, '');
                html += `<p>${line}</p>`;
            }
        });
        html += '</div>';
    }
    
    html += '</div>';
    
    outputArea.innerHTML = html;
}

// ==================== 清空所有 ====================
function clearAll() {
    document.getElementById('originalTitle').value = '';
    document.getElementById('outputArea').innerHTML = '';
    parsedTitles = [];
    currentOutput = '';
    showStatus('Cleared!', 'success');
}

// ==================== 复制单个标题 ====================
function copyTitle(index) {
    if (parsedTitles[index]) {
        navigator.clipboard.writeText(parsedTitles[index].text).then(() => {
            showStatus('✅ Title copied!', 'success');
        }).catch(() => {
            showStatus('❌ Copy failed', 'error');
        });
    }
}

// ==================== 使用标题 ====================
function useTitle(index) {
    if (parsedTitles[index]) {
        navigator.clipboard.writeText(parsedTitles[index].text).then(() => {
            showStatus('✅ Title copied! Ready to use.', 'success');
        }).catch(() => {
            showStatus('❌ Copy failed', 'error');
        });
    }
}

// ==================== 测试 API ====================
async function testApi() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    
    if (!apiKey) {
        showStatus('Please enter API Key!', 'error');
        return;
    }
    
    showStatus('Testing connection...', 'loading');
    
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
            showStatus('✅ API Key is valid!', 'success');
        } else {
            throw new Error('API Key is invalid');
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
        showStatus('✅ API Key saved!', 'success');
        setTimeout(closeSettings, 1000);
    } else {
        showStatus('Please enter API Key!', 'error');
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
    const btn = document.getElementById('optimizeBtn');
    btn.disabled = loading;
    btn.textContent = loading ? '⏳ Optimizing...' : '🚀 Optimize Titles';
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

// ==================== Service Worker ====================
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
}
