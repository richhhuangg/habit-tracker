# 個人平衡計分卡 ｜ 每日 To-do List & AI 成長儀表板

> **🎯 每日核心目標：**  
> 健康長跑 × 專業技術成長 × 英文能力 × 興趣培養 × 心靈平衡 × 人際關係

本專案是一個極致現代美學、高質感的個人平衡計分卡 Web 應用程式。專為重視長跑體能、深度學習 AI 技術、維持規律作息與心靈平衡的高自律者打造。支援本機離線持久化儲存（LocalStorage），並能一鍵將每日完成項目與心得反思**自動同步儲存至 Google 表單（Google Forms）與 Google 試算表（Google Sheets）**！

---

## ✨ 核心特色與架構

### 1. 六大維度打卡清單 (Balanced Pillars)
- **🏃 一、健康與體能：** 跑步訓練／休息日恢復、🥗 健康飲食（深綠色蔬菜 2 份、蛋白質 120g、不喝含糖飲料、少加工、吃藍苺/奇異果/堅果/麥片/綠茶抹茶/深海魚/apple醋/魚油/葉黃素）、😴 睡眠 7 小時以上、🚶 每日步數 8,000 步。
- **💻 二、專業技術與 AI 學習：** 🤖 AI 技術學習 30 分鐘、📚 完成學習單元、🛠️ 動手實作 10～20 分鐘、📝 記錄學習成果／範例。內建 **6 大 AI 輪替主題快捷標籤**（Azure AI-103、Python/OpenAI API、RAG 與向量搜尋、AI Agent、Guardrails、實作專案）點擊即填入。
- **🇺🇸 三、語言與知識：** 英文學習 30 分鐘（聽力／口說／Engoo）、📖 閱讀 20 分鐘。
- **🎹 四、興趣與生活樂趣：** 鋼琴練習 20 分鐘、安排一段不追求績效的休閒時間。
- **🧘 五、心靈與情緒：** 靜心／禱告 10 分鐘、✍️ 成功日記（3 件好事）、檢視情緒與壓力、人際社交小行動。

### 2. 📅 每日完成紀錄 (Daily Log & Reflection)
- **🎯 今日最重要的三件事 (Top 3 Priorities)：** 抓住核心聚焦。
- **💻 今日 AI 學習成果日誌：** 包含學習主題、學習時間（分鐘）、實作／筆記成果、遇到的問題、下一步。
- **🙏 今日感恩與成功日記：** 記錄今天 3 件值得感恩或做得不錯的事。
- **⭐ 今日自我評分與反思：** 1~10 分互動星級評分、今日做得最好的一件事、明天可以改善的一件事。

### 3. 🔄 七、每週回顧專區 (Weekly Executive Review)
- 四大板塊週檢視（專業與職涯、健康與體能、個人成長、人際與生活）。
- 🎯 下週最重要的三個目標。
- 📝 本週深層總結覆盤（本週總結、最有成就感的事、最大的挑戰、下週要調整的地方）。
- 一鍵複製每週回顧報告，或一鍵同步送至 Google 表單。

### 4. 🌟 五大執行原則隨行卡
- 01. 持續比完美重要
- 02. 成果比時數重要
- 03. 健康優先
- 04. 平衡比堆積任務重要
- 05. 每週調整，不必每天滿分

---

## ☁️ Google 表單與試算表同步教學

### 📌 輸出格式規範
送出至 Google 表單的完成項目格式為：
```text
10/25日 完成項目: 跑步訓練／休息日恢復, 深綠色蔬菜 2 份以上, 睡眠 7 小時以上, AI 技術學習 30 分鐘, 動手實作／寫程式 10～20 分鐘, 英文學習 30 分鐘, 鋼琴練習 20 分鐘, 靜心／禱告 10 分鐘
```

### 方案 A：使用 Google 表單（Google Forms）自動提交（推薦，最簡單）
1. 前往 [Google Forms](https://forms.google.com/) 建立一份新表單，例如新增以下題目：
   - 題目 1：「日期」（簡答）
   - 題目 2：「完成項目」（簡答或段落，儲存如 `10/25日 完成項目: ...`）
   - 題目 3：「今日學習與心得」（段落，選填）
   - 題目 4：「自我評分」（簡答，選填）
2. 點擊表單右上角「**⋮**」（更多）> 選擇「**取得預先填入的連結**」。
3. 在各欄位隨便填入測試字樣，點擊下方的「**取得連結**」並複製網址。
4. 打開本網頁右上角的「**Google 表單設定**」，將整串網址貼入「**✨ 一鍵貼上預先填入連結**」輸入框，點擊「⚡ 自動解析填入以下欄位」。
5. 點擊「**儲存設定**」即可！
6. 回到主頁面，每次完成打卡後點擊「**🚀 儲存並同步至 Google 表單**」，就會直接背景送出至 Google 表單，Google 試算表就會自動記錄一筆新資料！

---

### 方案 B：使用 Google Apps Script（直接寫入 Google 試算表每一列）
1. 建立一個 Google 試算表（Google Sheets）。
2. 點擊「擴充功能」>「Apps Script」。
3. 貼上設定面板內提供的 `doPost(e)` 程式碼：
   ```javascript
   function doPost(e) {
     try {
       var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
       var data = JSON.parse(e.postData.contents);
       sheet.appendRow([
         data.date,          // 日期 (例如: 10/25日)
         data.items,         // 完成項目清單
         data.score,         // 整體評分
         data.ai_log,        // AI 學習成果
         data.top3,          // 今日三件要事
         data.gratitude,     // 感恩日記
         data.best_thing,    // 最好的一件事
         data.improve_thing, // 改善的一件事
         new Date()          // 提交時間戳記
       ]);
       return ContentService.createTextOutput(JSON.stringify({result: "success"}))
         .setMimeType(ContentService.MimeType.JSON);
     } catch(err) {
       return ContentService.createTextOutput(JSON.stringify({result: "error", error: err}))
         .setMimeType(ContentService.MimeType.JSON);
     }
   }
   ```
4. 點擊「部署」>「新增部署作業」> 類型選擇「網頁應用程式」：
   - 執行身分：我
   - 誰可以存取：**任何人 (Anyone)**
5. 複製生成的 Web App 網址，貼入本網頁設定面板中的「方案 B」輸入框並儲存。

---

## 🚀 本地啟動方式

直接雙擊 `index.html` 以瀏覽器開啟，或在終端機執行：
```bash
python -m http.server 8080
```
接著在瀏覽器打開：`http://localhost:8080/`
