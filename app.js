/**
 * 個人平衡計分卡 ｜ 核心應用程式邏輯 (app.js)
 * 每日 To-do List × 專業技術 AI × Google 表單自動同步
 */

// ==========================================
// 1. 狀態管理 (Global State)
// ==========================================
const STORAGE_KEYS = {
    DAILY: 'balanced_scorecard_daily',
    WEEKLY: 'balanced_scorecard_weekly',
    SETTINGS: 'balanced_scorecard_settings',
    THEME: 'balanced_scorecard_theme'
};

let dailyStore = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY)) || {};
let weeklyStore = JSON.parse(localStorage.getItem(STORAGE_KEYS.WEEKLY)) || {};
let settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {
    mode: 'gform',
    formUrl: '',
    entryDate: '',
    entryItems: '',
    entryNotes: '',
    entryScore: '',
    gasUrl: ''
};

// 當前選定日期 YYYY-MM-DD
let activeDate = getLocalDateString(new Date());

// ==========================================
// 2. 日期與格式工具函式 (Date Helpers)
// ==========================================
function getLocalDateString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateToShortMD(dateStr) {
    // 例如將 2026-10-25 轉為 "10/25日"
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}日`;
    }
    return dateStr;
}

function getWeekKey(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDay();
    // 取得該週星期一的日期
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return `W-${getLocalDateString(monday)}`;
}

function updateDateBadge(dateStr) {
    const badge = document.getElementById('date-display-badge');
    const logDateDisplay = document.getElementById('log-selected-date-str');
    if (logDateDisplay) {
        logDateDisplay.textContent = `${dateStr} (${formatDateToShortMD(dateStr)})`;
    }

    const todayStr = getLocalDateString(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrow);

    if (dateStr === todayStr) {
        badge.textContent = '今天';
        badge.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
    } else if (dateStr === yesterdayStr) {
        badge.textContent = '昨天';
        badge.style.background = 'linear-gradient(135deg, #64748b, #475569)';
    } else if (dateStr === tomorrowStr) {
        badge.textContent = '明天';
        badge.style.background = 'linear-gradient(135deg, #8b5cf6, #ec4899)';
    } else {
        const parts = dateStr.split('-');
        badge.textContent = `${parts[1]}/${parts[2]}`;
        badge.style.background = 'linear-gradient(135deg, #3b82f6, #06b6d4)';
    }
}

// ==========================================
// 3. 畫面初始化與事件監聽 (Init & Events)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initDateControls();
    initRatingStars();
    initViewSwitching();
    initModals();
    initAiTags();
    initSyncAndForm();
    initWeeklyReview();

    // 載入當前日期的資料
    loadDailyData(activeDate);
    updateFormatPreview();
});

// 深淺色主題
function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'theme-dark';
    document.body.className = savedTheme;
    updateThemeIcon(savedTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('theme-dark');
        const nextTheme = isDark ? 'theme-light' : 'theme-dark';
        document.body.className = nextTheme;
        localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
        updateThemeIcon(nextTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.textContent = theme === 'theme-dark' ? '🌙' : '☀️';
    }
}

// 日期切換事件
function initDateControls() {
    const dateInput = document.getElementById('current-date-input');
    const prevBtn = document.getElementById('prev-day-btn');
    const nextBtn = document.getElementById('next-day-btn');
    const todayBtn = document.getElementById('today-btn');

    dateInput.value = activeDate;
    updateDateBadge(activeDate);

    dateInput.addEventListener('change', (e) => {
        if (e.target.value) {
            saveCurrentDailyData(); // 切換前儲存
            activeDate = e.target.value;
            updateDateBadge(activeDate);
            loadDailyData(activeDate);
            updateFormatPreview();
        }
    });

    prevBtn.addEventListener('click', () => {
        saveCurrentDailyData();
        const d = new Date(activeDate);
        d.setDate(d.getDate() - 1);
        activeDate = getLocalDateString(d);
        dateInput.value = activeDate;
        updateDateBadge(activeDate);
        loadDailyData(activeDate);
        updateFormatPreview();
    });

    nextBtn.addEventListener('click', () => {
        saveCurrentDailyData();
        const d = new Date(activeDate);
        d.setDate(d.getDate() + 1);
        activeDate = getLocalDateString(d);
        dateInput.value = activeDate;
        updateDateBadge(activeDate);
        loadDailyData(activeDate);
        updateFormatPreview();
    });

    todayBtn.addEventListener('click', () => {
        saveCurrentDailyData();
        activeDate = getLocalDateString(new Date());
        dateInput.value = activeDate;
        updateDateBadge(activeDate);
        loadDailyData(activeDate);
        updateFormatPreview();
    });
}

// 評分星星按鈕 (1~10 分)
function initRatingStars() {
    const container = document.getElementById('rating-stars-container');
    container.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'star-btn';
        btn.textContent = i;
        btn.dataset.rating = i;
        btn.setAttribute('aria-label', `評分 ${i} 分`);
        btn.addEventListener('click', () => {
            setRating(i);
            saveCurrentDailyData();
            updateScorecardStats();
            updateFormatPreview();
        });
        container.appendChild(btn);
    }
}

function setRating(val) {
    const ratingInput = document.getElementById('daily-score');
    const ratingNumber = document.getElementById('rating-number');
    ratingInput.value = val;
    ratingNumber.textContent = val > 0 ? val : '--';

    const buttons = document.querySelectorAll('.star-btn');
    buttons.forEach(btn => {
        const rating = parseInt(btn.dataset.rating, 10);
        if (rating <= val && val > 0) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 視圖切換 (每日 vs 每週)
function initViewSwitching() {
    const tabs = document.querySelectorAll('.tab-btn');
    const dailyView = document.getElementById('daily-view');
    const weeklyView = document.getElementById('weekly-view');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const view = tab.dataset.view;

            if (view === 'daily') {
                dailyView.classList.add('active');
                weeklyView.classList.remove('active');
            } else {
                dailyView.classList.remove('active');
                weeklyView.classList.add('active');
                loadWeeklyData();
            }
        });
    });
}

// 彈窗設定與執行原則
function initModals() {
    const principlesModal = document.getElementById('principles-modal');
    const settingsModal = document.getElementById('settings-modal');

    // 打開執行原則
    document.getElementById('open-principles-btn').addEventListener('click', () => {
        principlesModal.classList.add('active');
    });
    document.getElementById('close-principles-btn').addEventListener('click', () => {
        principlesModal.classList.remove('active');
    });
    document.getElementById('confirm-principles-btn').addEventListener('click', () => {
        principlesModal.classList.remove('active');
    });

    // 打開設定
    document.getElementById('open-settings-btn').addEventListener('click', () => {
        loadSettingsToModal();
        settingsModal.classList.add('active');
    });
    document.getElementById('close-settings-btn').addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    // 點擊遮罩關閉
    [principlesModal, settingsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// AI 快速輪替標籤點擊帶入
function initAiTags() {
    const topicInput = document.getElementById('ai-topic');
    const chips = document.querySelectorAll('.tag-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const topic = chip.dataset.topic;
            topicInput.value = topic;
            topicInput.focus();
            showToast(`已帶入 AI 主題：「${topic}」`);
            saveCurrentDailyData();
        });
    });

    // 填寫提示範本
    const quickBtn = document.getElementById('quick-fill-template-btn');
    quickBtn.addEventListener('click', () => {
        if (!document.getElementById('top3-1').value) {
            document.getElementById('top3-1').value = '晨跑 5 公里與體能恢復訓練';
            document.getElementById('top3-2').value = '實作 RAG 向量搜尋結合 OpenAI API';
            document.getElementById('top3-3').value = 'Engoo 英文口說 25 分鐘 + 鋼琴練習';
        }
        if (!document.getElementById('ai-topic').value) {
            document.getElementById('ai-topic').value = 'RAG、Embedding 與向量搜尋實戰整合';
            document.getElementById('ai-time').value = '45';
            document.getElementById('ai-output').value = '撰寫 Python 腳本建立 ChromaDB 向量檢索，成功結合 OpenAI gpt-4o 回答特定文件內容。';
            document.getElementById('ai-problems').value = 'Chunking 切割過大時容易遺失局部關鍵詞，需測試 chunk_overlap。';
            document.getElementById('ai-next').value = '嘗試整合 LangChain 或 LlamaIndex 建立 Agent 工具呼叫流程。';
        }
        if (!document.getElementById('journal-1').value) {
            document.getElementById('journal-1').value = '早晨天氣涼爽，跑步體感非常順暢，配速穩定';
            document.getElementById('journal-2').value = '解決了向量維度不相容的 bug，動手實作非常有收穫';
            document.getElementById('journal-3').value = '晚上彈琴 20 分鐘讓身心徹底放鬆，感謝充實的一天';
        }
        if (!document.getElementById('best-thing').value) {
            document.getElementById('best-thing').value = '專注寫完程式範例，沒有被社群媒體分心';
            document.getElementById('improve-thing').value = '午休時間可以稍作靜心，減少下午的疲憊感';
        }
        if (!parseInt(document.getElementById('daily-score').value, 10)) {
            setRating(9);
        }
        saveCurrentDailyData();
        updateScorecardStats();
        updateFormatPreview();
        showToast('已帶入優質紀錄範本！');
    });
}

// ==========================================
// 4. 資料存取與畫面更新 (Data Binding)
// ==========================================
function loadDailyData(dateStr) {
    const data = dailyStore[dateStr] || {
        checks: {},
        top3: ['', '', ''],
        ai: { topic: '', time: '', output: '', problems: '', next: '' },
        journal: ['', '', ''],
        score: 0,
        best_thing: '',
        improve_thing: ''
    };

    // 勾選框綁定
    const allChecks = document.querySelectorAll('.checklist-column input[type="checkbox"]');
    allChecks.forEach(chk => {
        chk.checked = !!data.checks[chk.id];
    });

    // Top 3
    document.getElementById('top3-1').value = data.top3?.[0] || '';
    document.getElementById('top3-2').value = data.top3?.[1] || '';
    document.getElementById('top3-3').value = data.top3?.[2] || '';

    // AI
    document.getElementById('ai-topic').value = data.ai?.topic || '';
    document.getElementById('ai-time').value = data.ai?.time || '';
    document.getElementById('ai-output').value = data.ai?.output || '';
    document.getElementById('ai-problems').value = data.ai?.problems || '';
    document.getElementById('ai-next').value = data.ai?.next || '';

    // Journal
    document.getElementById('journal-1').value = data.journal?.[0] || '';
    document.getElementById('journal-2').value = data.journal?.[1] || '';
    document.getElementById('journal-3').value = data.journal?.[2] || '';

    // Score & 反思
    setRating(data.score || 0);
    document.getElementById('best-thing').value = data.best_thing || '';
    document.getElementById('improve-thing').value = data.improve_thing || '';

    updateScorecardStats();
}

function saveCurrentDailyData() {
    const checks = {};
    const allChecks = document.querySelectorAll('.checklist-column input[type="checkbox"]');
    allChecks.forEach(chk => {
        if (chk.checked) {
            checks[chk.id] = true;
        }
    });

    const data = {
        checks,
        top3: [
            document.getElementById('top3-1').value.trim(),
            document.getElementById('top3-2').value.trim(),
            document.getElementById('top3-3').value.trim()
        ],
        ai: {
            topic: document.getElementById('ai-topic').value.trim(),
            time: document.getElementById('ai-time').value.trim(),
            output: document.getElementById('ai-output').value.trim(),
            problems: document.getElementById('ai-problems').value.trim(),
            next: document.getElementById('ai-next').value.trim()
        },
        journal: [
            document.getElementById('journal-1').value.trim(),
            document.getElementById('journal-2').value.trim(),
            document.getElementById('journal-3').value.trim()
        ],
        score: parseInt(document.getElementById('daily-score').value, 10) || 0,
        best_thing: document.getElementById('best-thing').value.trim(),
        improve_thing: document.getElementById('improve-thing').value.trim(),
        updatedAt: new Date().toISOString()
    };

    dailyStore[activeDate] = data;
    localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(dailyStore));

    const statusText = document.getElementById('sync-status-text');
    if (statusText) {
        statusText.textContent = `已即時儲存至本機 (${formatDateToShortMD(activeDate)})`;
    }
}

// 實時監聽所有輸入以自動儲存
function initAutoSave() {
    const form = document.getElementById('daily-record-form');
    form.addEventListener('input', () => {
        saveCurrentDailyData();
        updateScorecardStats();
        updateFormatPreview();
    });

    const allCheckboxes = document.querySelectorAll('.checklist-column input[type="checkbox"]');
    allCheckboxes.forEach(chk => {
        chk.addEventListener('change', () => {
            saveCurrentDailyData();
            updateScorecardStats();
            updateFormatPreview();
        });
    });
}
initAutoSave();

// ==========================================
// 5. 計分卡統計與進度運算 (Calculations)
// ==========================================
function updateScorecardStats() {
    // 1. 健康與體能 (Health)
    // 跑步 (chk-run)、睡眠 (chk-sleep)、步數 (chk-steps)、飲食（四項子項中任一項即達標）
    const isRun = document.getElementById('chk-run').checked;
    const isSleep = document.getElementById('chk-sleep').checked;
    const isSteps = document.getElementById('chk-steps').checked;
    const dietSubs = document.querySelectorAll('.diet-sub:checked');
    const isDiet = dietSubs.length > 0;

    let healthCount = (isRun ? 1 : 0) + (isSleep ? 1 : 0) + (isSteps ? 1 : 0) + (isDiet ? 1 : 0);
    const healthTotal = 4;
    updatePillarBadge('health', healthCount, healthTotal);

    // 2. AI 與專業 (Tech)
    const techItems = ['chk-tech-learn', 'chk-tech-unit', 'chk-tech-hands', 'chk-tech-record'];
    let techCount = techItems.filter(id => document.getElementById(id).checked).length;
    const techTotal = 4;
    updatePillarBadge('tech', techCount, techTotal);

    // 3. 語言與知識 (Lang)
    const langItems = ['chk-lang-en', 'chk-lang-read'];
    let langCount = langItems.filter(id => document.getElementById(id).checked).length;
    const langTotal = 2;
    updatePillarBadge('lang', langCount, langTotal);

    // 4. 興趣與樂趣 (Hobby)
    const hobbyItems = ['chk-hobby-piano', 'chk-hobby-rest'];
    let hobbyCount = hobbyItems.filter(id => document.getElementById(id).checked).length;
    const hobbyTotal = 2;
    updatePillarBadge('hobby', hobbyCount, hobbyTotal);

    // 5. 心靈與情緒 (Mind)
    const mindItems = ['chk-mind-pray', 'chk-mind-journal', 'chk-mind-stress', 'chk-mind-connect'];
    let mindCount = mindItems.filter(id => document.getElementById(id).checked).length;
    const mindTotal = 4;
    updatePillarBadge('mind', mindCount, mindTotal);

    // 6. 整體自評 (Score)
    const scoreVal = parseInt(document.getElementById('daily-score').value, 10) || 0;
    const scoreText = scoreVal > 0 ? `${scoreVal}/10 分` : '未評分';
    document.getElementById('stat-score').textContent = scoreText;
    document.getElementById('bar-score').style.width = `${scoreVal * 10}%`;

    // 總達成率計算 (總項共 16 項打卡指標)
    const totalAchieved = healthCount + techCount + langCount + hobbyCount + mindCount;
    const totalPossible = healthTotal + techTotal + langTotal + hobbyTotal + mindTotal; // 16
    const percent = Math.round((totalAchieved / totalPossible) * 100);

    const percentEl = document.getElementById('total-progress-percent');
    if (percentEl) {
        percentEl.textContent = `${percent}%`;
    }
    const circle = document.getElementById('progress-circle');
    if (circle) {
        const deg = (percent / 100) * 360;
        circle.style.setProperty('--progress-deg', `${deg}deg`);
    }
}

function updatePillarBadge(cat, count, total) {
    const badge = document.getElementById(`badge-${cat}`);
    const stat = document.getElementById(`stat-${cat}`);
    const bar = document.getElementById(`bar-${cat}`);

    if (badge) {
        badge.textContent = `${count}/${total}`;
        badge.classList.toggle('completed', count === total);
    }
    if (stat) {
        stat.textContent = `${count}/${total} 達標`;
    }
    if (bar) {
        const pct = Math.round((count / total) * 100);
        bar.style.width = `${pct}%`;
    }
}

// ==========================================
// 6. 核心格式產出 (Google Form 與剪貼簿格式)
// ==========================================
function getCompletedItemsText() {
    // 依據使用者指定的格式：「10/25日 完成項目: 項目1, 項目2...」
    const shortDate = formatDateToShortMD(activeDate);
    const checkedBoxes = document.querySelectorAll('.checklist-column input[type="checkbox"]:checked');
    
    const items = [];
    checkedBoxes.forEach(chk => {
        const label = chk.dataset.label;
        if (label) {
            items.push(label);
        }
    });

    if (items.length === 0) {
        return `${shortDate} 完成項目: （尚無勾選項目）`;
    }
    return `${shortDate} 完成項目: ${items.join('、')}`;
}

function getFullSummaryText() {
    const shortDate = formatDateToShortMD(activeDate);
    const data = dailyStore[activeDate] || {};
    const checkedBoxes = document.querySelectorAll('.checklist-column input[type="checkbox"]:checked');
    
    let text = `【${shortDate} 個人平衡計分卡｜每日成果紀錄】\n`;
    text += `📅 日期：${activeDate}\n`;
    text += `⭐ 自我評分：${data.score || 0} / 10 分\n\n`;

    text += `✅ 完成項目 (${checkedBoxes.length}項)：\n`;
    if (checkedBoxes.length > 0) {
        checkedBoxes.forEach(chk => {
            text += `  • ${chk.dataset.label}\n`;
        });
    } else {
        text += `  （無勾選項目）\n`;
    }
    text += `\n`;

    const top3 = (data.top3 || []).filter(t => t.trim().length > 0);
    if (top3.length > 0) {
        text += `🎯 今日最重要的三件事：\n`;
        top3.forEach((item, idx) => {
            text += `  ${idx + 1}. ${item}\n`;
        });
        text += `\n`;
    }

    if (data.ai?.topic || data.ai?.output) {
        text += `💻 今日 AI 學習成果：\n`;
        if (data.ai.topic) text += `  • 學習主題：${data.ai.topic}\n`;
        if (data.ai.time) text += `  • 學習時間：${data.ai.time} 分鐘\n`;
        if (data.ai.output) text += `  • 實作／筆記成果：${data.ai.output}\n`;
        if (data.ai.problems) text += `  • 遇到的問題：${data.ai.problems}\n`;
        if (data.ai.next) text += `  • 下一步：${data.ai.next}\n`;
        text += `\n`;
    }

    const journal = (data.journal || []).filter(j => j.trim().length > 0);
    if (journal.length > 0) {
        text += `🙏 感恩與成功日記：\n`;
        journal.forEach((item, idx) => {
            text += `  ${idx + 1}. ${item}\n`;
        });
        text += `\n`;
    }

    if (data.best_thing || data.improve_thing) {
        text += `📝 今日自我反思：\n`;
        if (data.best_thing) text += `  • 做得最好的一件事：${data.best_thing}\n`;
        if (data.improve_thing) text += `  • 明天可以改善的事：${data.improve_thing}\n`;
    }

    return text.trim();
}

function updateFormatPreview() {
    const previewEl = document.getElementById('output-format-preview');
    if (previewEl) {
        previewEl.textContent = getCompletedItemsText();
    }
}

// ==========================================
// 7. 同步與儲存控制 (Sync with Google Form / Sheets)
// ==========================================
function initSyncAndForm() {
    // 儲存到本機
    document.getElementById('save-local-btn').addEventListener('click', () => {
        saveCurrentDailyData();
        showToast('✅ 成功儲存今日紀錄至瀏覽器本機！');
    });

    // 複製摘要文字
    document.getElementById('copy-summary-btn').addEventListener('click', () => {
        const fullText = getFullSummaryText();
        navigator.clipboard.writeText(fullText).then(() => {
            showToast('📋 已複製格式化日報文字到剪貼簿！');
        }).catch(() => {
            fallbackCopy(fullText);
        });
    });

    // 儲存並同步至 Google 表單
    document.getElementById('sync-google-btn').addEventListener('click', () => {
        syncToGoogleForm();
    });

    // 設定面板功能
    initSettingsModalLogic();
}

// 核心：將資料發送至 Google Form / GAS
async function syncToGoogleForm() {
    saveCurrentDailyData();

    if (settings.mode === 'gas') {
        if (!settings.gasUrl) {
            showToast('⚠️ 尚未設定 Google Apps Script URL，請先點擊右上角「Google 表單設定」', true);
            openSettingsModal('gas');
            return;
        }
        await sendToGas();
    } else {
        // 方案 A: Google 表單 (formResponse)
        if (!settings.formUrl || !settings.entryItems) {
            showToast('⚠️ 尚未填入 Google 表單網址或 Entry ID，請先完成設定', true);
            openSettingsModal('gform');
            return;
        }
        await sendToGoogleForm();
    }
}

// 發送至 Google 表單
async function sendToGoogleForm() {
    const syncBtn = document.getElementById('sync-google-btn');
    const originalText = syncBtn.innerHTML;
    syncBtn.innerHTML = `<span>⏳</span> 同步中...`;
    syncBtn.disabled = true;

    try {
        let formAction = settings.formUrl.trim();
        // 如果使用者填入的是 viewform，自動轉換為 formResponse
        if (formAction.includes('/viewform')) {
            formAction = formAction.replace('/viewform', '/formResponse');
        }

        const formData = new URLSearchParams();
        
        // 1. 日期
        if (settings.entryDate) {
            formData.append(settings.entryDate, activeDate);
        }

        // 2. 完成項目（包含使用者指定的例如 "10/25日 完成項目: ..."）
        const completedText = getCompletedItemsText();
        formData.append(settings.entryItems, completedText);

        // 3. 學習成果與反思 (選填)
        if (settings.entryNotes) {
            const data = dailyStore[activeDate] || {};
            const notes = `【今日三件事】${(data.top3 || []).filter(Boolean).join('； ')}\n【AI學習】${data.ai?.topic || ''} (${data.ai?.time || 0}分): ${data.ai?.output || ''}\n【成功日記】${(data.journal || []).filter(Boolean).join('； ')}`;
            formData.append(settings.entryNotes, notes);
        }

        // 4. 自我評分 (選填)
        if (settings.entryScore) {
            const score = document.getElementById('daily-score').value || '0';
            formData.append(settings.entryScore, score);
        }

        // 使用 no-cors 發送
        await fetch(formAction, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        showToast(`🎉 成功同步！「${formatDateToShortMD(activeDate)} 完成項目」已送出至 Google 表單！`);
        document.getElementById('sync-status-text').textContent = `已成功同步至 Google 表單 (${formatDateToShortMD(activeDate)})`;
    } catch (err) {
        console.error('Google Form Sync Error:', err);
        showToast('⚠️ 送出失敗，請檢查表單網址與 entry ID 是否正確', true);
    } finally {
        syncBtn.innerHTML = originalText;
        syncBtn.disabled = false;
    }
}

// 發送至 Google Apps Script Web App
async function sendToGas() {
    const syncBtn = document.getElementById('sync-google-btn');
    const originalText = syncBtn.innerHTML;
    syncBtn.innerHTML = `<span>⏳</span> 送出至 Google Sheets...`;
    syncBtn.disabled = true;

    try {
        const data = dailyStore[activeDate] || {};
        const payload = {
            date: `${formatDateToShortMD(activeDate)} (${activeDate})`,
            items: getCompletedItemsText(),
            score: data.score || 0,
            ai_log: `[${data.ai?.topic || '無'}] ${data.ai?.time || 0}分鐘 | 成果: ${data.ai?.output || ''} | 問題: ${data.ai?.problems || ''} | 下一步: ${data.ai?.next || ''}`,
            top3: (data.top3 || []).join(' | '),
            gratitude: (data.journal || []).join(' | '),
            best_thing: data.best_thing || '',
            improve_thing: data.improve_thing || ''
        };

        await fetch(settings.gasUrl.trim(), {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        showToast(`🎉 成功寫入 Google 試算表！「${formatDateToShortMD(activeDate)}」完成！`);
        document.getElementById('sync-status-text').textContent = `已成功寫入 Google Sheets (${formatDateToShortMD(activeDate)})`;
    } catch (err) {
        console.error('GAS Error:', err);
        showToast('⚠️ Google 試算表同步失敗，請檢查 Apps Script 網址', true);
    } finally {
        syncBtn.innerHTML = originalText;
        syncBtn.disabled = false;
    }
}

// ==========================================
// 8. 設定面板互動邏輯 (Settings Modal Logic)
// ==========================================
function initSettingsModalLogic() {
    // 方案切換 tab
    const modeTabs = document.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const mode = tab.dataset.mode;
            document.getElementById('mode-gform-section').classList.toggle('active', mode === 'gform');
            document.getElementById('mode-gas-section').classList.toggle('active', mode === 'gas');
        });
    });

    // 自動解析預填連結
    document.getElementById('btn-parse-prefill').addEventListener('click', () => {
        const urlInput = document.getElementById('gform-prefill-url').value.trim();
        if (!urlInput) {
            showToast('請先貼上 Google 表單預先填入的連結！', true);
            return;
        }

        try {
            const urlObj = new URL(urlInput);
            // 擷取 formResponse URL
            let actionUrl = urlInput.split('/viewform')[0] + '/formResponse';
            document.getElementById('gform-action-url').value = actionUrl;

            // 搜尋所有 entry.xxxxx
            const entries = [];
            urlObj.searchParams.forEach((val, key) => {
                if (key.startsWith('entry.')) {
                    entries.push(key);
                }
            });

            if (entries.length > 0) {
                // 自動指派給欄位
                if (entries[0]) document.getElementById('gform-entry-date').value = entries[0];
                if (entries[1]) document.getElementById('gform-entry-items').value = entries[1];
                if (entries[2]) document.getElementById('gform-entry-notes').value = entries[2];
                if (entries[3]) document.getElementById('gform-entry-score').value = entries[3];
                showToast(`⚡ 成功解析出 ${entries.length} 個 Entry ID 並填入！`);
            } else {
                showToast('已解析表單網址，但未偵測到 entry 參數，請確認是否為「預先填入」連結', true);
            }
        } catch (e) {
            showToast('網址格式錯誤，請確認貼入有效的 Google 表單網址', true);
        }
    });

    // 複製 GAS 程式碼
    document.getElementById('copy-gas-code-btn').addEventListener('click', () => {
        const code = document.getElementById('gas-code-block').textContent;
        navigator.clipboard.writeText(code).then(() => {
            showToast('📋 已複製 Google Apps Script 程式碼！');
        });
    });

    // 儲存設定
    document.getElementById('save-settings-btn').addEventListener('click', () => {
        const activeTab = document.querySelector('.mode-tab.active');
        settings.mode = activeTab ? activeTab.dataset.mode : 'gform';
        settings.formUrl = document.getElementById('gform-action-url').value.trim();
        settings.entryDate = document.getElementById('gform-entry-date').value.trim();
        settings.entryItems = document.getElementById('gform-entry-items').value.trim();
        settings.entryNotes = document.getElementById('gform-entry-notes').value.trim();
        settings.entryScore = document.getElementById('gform-entry-score').value.trim();
        settings.gasUrl = document.getElementById('gas-endpoint-url').value.trim();

        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        document.getElementById('settings-modal').classList.remove('active');
        showToast('💾 同步設定已儲存！');
    });

    // 測試連線
    document.getElementById('test-gform-connection-btn').addEventListener('click', async () => {
        const activeTab = document.querySelector('.mode-tab.active');
        const mode = activeTab ? activeTab.dataset.mode : 'gform';
        if (mode === 'gform') {
            const formUrl = document.getElementById('gform-action-url').value.trim();
            const entryItems = document.getElementById('gform-entry-items').value.trim();
            if (!formUrl || !entryItems) {
                showToast('請先填寫提交網址與完成項目 Entry ID', true);
                return;
            }
            try {
                const formData = new URLSearchParams();
                formData.append(entryItems, `【連線測試】${formatDateToShortMD(activeDate)} 個人平衡計分卡連線成功！`);
                await fetch(formUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: formData.toString()
                });
                showToast('🚀 測試資料已成功送出至 Google 表單！請檢查 Google 試算表！');
            } catch (err) {
                showToast('測試發送失敗：' + err.message, true);
            }
        } else {
            const gasUrl = document.getElementById('gas-endpoint-url').value.trim();
            if (!gasUrl) {
                showToast('請先填寫 Google Apps Script URL', true);
                return;
            }
            try {
                await fetch(gasUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({
                        date: '測試日期',
                        items: '連線測試成功',
                        score: 10,
                        ai_log: '測試紀錄',
                        top3: '測試',
                        gratitude: '感恩'
                    })
                });
                showToast('🚀 測試資料已送至 Apps Script！請檢查試算表是否新增一列！');
            } catch (err) {
                showToast('測試發送失敗：' + err.message, true);
            }
        }
    });
}

function loadSettingsToModal() {
    document.getElementById('gform-action-url').value = settings.formUrl || '';
    document.getElementById('gform-entry-date').value = settings.entryDate || '';
    document.getElementById('gform-entry-items').value = settings.entryItems || '';
    document.getElementById('gform-entry-notes').value = settings.entryNotes || '';
    document.getElementById('gform-entry-score').value = settings.entryScore || '';
    document.getElementById('gas-endpoint-url').value = settings.gasUrl || '';

    const mode = settings.mode || 'gform';
    const tabs = document.querySelectorAll('.mode-tab');
    tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    document.getElementById('mode-gform-section').classList.toggle('active', mode === 'gform');
    document.getElementById('mode-gas-section').classList.toggle('active', mode === 'gas');
}

function openSettingsModal(targetMode) {
    const modal = document.getElementById('settings-modal');
    loadSettingsToModal();
    if (targetMode) {
        const tabs = document.querySelectorAll('.mode-tab');
        tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === targetMode));
        document.getElementById('mode-gform-section').classList.toggle('active', targetMode === 'gform');
        document.getElementById('mode-gas-section').classList.toggle('active', targetMode === 'gas');
    }
    modal.classList.add('active');
}

// ==========================================
// 9. 七、每週回顧專區 (Weekly Review Logic)
// ==========================================
function initWeeklyReview() {
    const weeklyForm = document.getElementById('weekly-review-form');
    weeklyForm.addEventListener('input', () => {
        saveWeeklyData();
    });

    const wkChecks = document.querySelectorAll('.wk-check');
    wkChecks.forEach(chk => {
        chk.addEventListener('change', () => {
            saveWeeklyData();
        });
    });

    // 複製每週報告
    document.getElementById('copy-weekly-btn').addEventListener('click', () => {
        const report = generateWeeklyReport();
        navigator.clipboard.writeText(report).then(() => {
            showToast('📋 已複製每週回顧報告至剪貼簿！');
        }).catch(() => fallbackCopy(report));
    });

    // 同步每週回顧到 Google 表單
    document.getElementById('sync-weekly-google-btn').addEventListener('click', () => {
        syncWeeklyToGoogle();
    });
}

function loadWeeklyData() {
    const wkKey = getWeekKey(activeDate);
    const data = weeklyStore[wkKey] || {
        checks: {},
        goals: ['', '', ''],
        summary: '',
        proud: '',
        challenge: '',
        adjust: ''
    };

    const wkChecks = document.querySelectorAll('.wk-check');
    wkChecks.forEach(chk => {
        chk.checked = !!data.checks[chk.id];
    });

    document.getElementById('wk-goal-1').value = data.goals?.[0] || '';
    document.getElementById('wk-goal-2').value = data.goals?.[1] || '';
    document.getElementById('wk-goal-3').value = data.goals?.[2] || '';

    document.getElementById('wk-summary').value = data.summary || '';
    document.getElementById('wk-proud').value = data.proud || '';
    document.getElementById('wk-challenge').value = data.challenge || '';
    document.getElementById('wk-adjust').value = data.adjust || '';
}

function saveWeeklyData() {
    const wkKey = getWeekKey(activeDate);
    const checks = {};
    document.querySelectorAll('.wk-check:checked').forEach(chk => {
        checks[chk.id] = true;
    });

    weeklyStore[wkKey] = {
        checks,
        goals: [
            document.getElementById('wk-goal-1').value.trim(),
            document.getElementById('wk-goal-2').value.trim(),
            document.getElementById('wk-goal-3').value.trim()
        ],
        summary: document.getElementById('wk-summary').value.trim(),
        proud: document.getElementById('wk-proud').value.trim(),
        challenge: document.getElementById('wk-challenge').value.trim(),
        adjust: document.getElementById('wk-adjust').value.trim(),
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.WEEKLY, JSON.stringify(weeklyStore));
}

function generateWeeklyReport() {
    const wkKey = getWeekKey(activeDate);
    const data = weeklyStore[wkKey] || {};
    const checked = document.querySelectorAll('.wk-check:checked');

    let text = `【${wkKey} 每週平衡計分卡回顧覆盤】\n`;
    text += `✅ 本週檢視達標項目 (${checked.length}項):\n`;
    checked.forEach(chk => {
        text += `  • ${chk.dataset.label}\n`;
    });
    text += `\n`;

    const goals = (data.goals || []).filter(Boolean);
    if (goals.length > 0) {
        text += `🎯 下週最重要的三個目標:\n`;
        goals.forEach((g, idx) => text += `  ${idx + 1}. ${g}\n`);
        text += `\n`;
    }

    text += `📝 本週覆盤反思:\n`;
    if (data.summary) text += `• 本週總結：${data.summary}\n`;
    if (data.proud) text += `• 最有成就感的事：${data.proud}\n`;
    if (data.challenge) text += `• 最大的挑戰：${data.challenge}\n`;
    if (data.adjust) text += `• 下週要調整的地方：${data.adjust}\n`;

    return text.trim();
}

async function syncWeeklyToGoogle() {
    saveWeeklyData();
    const wkReport = generateWeeklyReport();
    if (settings.mode === 'gas' && settings.gasUrl) {
        await fetch(settings.gasUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                date: `[每週回顧] ${getWeekKey(activeDate)}`,
                items: wkReport,
                score: '週覆盤',
                ai_log: '',
                top3: '',
                gratitude: ''
            })
        });
        showToast('🎉 每週回顧已寫入 Google 試算表！');
    } else if (settings.formUrl && settings.entryItems) {
        const formData = new URLSearchParams();
        formData.append(settings.entryItems, wkReport);
        if (settings.entryDate) formData.append(settings.entryDate, `每週覆盤 (${getWeekKey(activeDate)})`);
        await fetch(settings.formUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: formData.toString()
        });
        showToast('🎉 每週回顧已同步至 Google 表單！');
    } else {
        navigator.clipboard.writeText(wkReport).then(() => {
            showToast('已複製回顧報告！尚未綁定 Google 表單，請先前往設定。');
            openSettingsModal();
        });
    }
}

// ==========================================
// 10. 輔助小工具 (Toast & Fallback Copy)
// ==========================================
let toastTimer = null;
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast show ${isError ? 'toast-error' : ''}`;

    toastTimer = setTimeout(() => {
        toast.className = 'toast';
    }, 3500);
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('📋 已複製文字到剪貼簿！');
    } catch (e) {
        showToast('複製失敗，請手動複製', true);
    }
    document.body.removeChild(textArea);
}
