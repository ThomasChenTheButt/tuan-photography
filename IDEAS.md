# 靈感收集箱 Ideas & links

*看到喜歡的東西、想到什麼點子,丟給 Claude 就會記在這裡。*
*這裡只是收集 — 記下來不代表要做。要做的時候才搬到 `PROGRESS.md` 的「接下來」。*

依類型整理好的 Word 版:`ideas/靈感整理.docx`(只在你的 Mac 上)。
每次這份清單有更動,跑一次 `python3 tools/ideas_doc.py` 就會重做。

<!-- 格式:每一項是一個 ### 標題,下面接「- 欄位: 內容」。Word 版依「類型」分組,每一類一張表,
     只顯示 名稱、重點、狀態、連結。「重點」請寫成一句短話;其他欄位只留在這份檔案裡。 -->

## 一、關於這個網站的想法 Ideas for the site

### 攻略變成書架上的書
- 類型: 互動效果
- 日期: 2026-09-28
- 重點: 滑鼠指到哪本,那本就彈出來
- 狀態: 收集中
- 想法: 每一篇攻略是書架上的一本書。滑鼠指到哪一本,那一本就從書架上彈出來。
- 來源: Foliom 的書架畫面(影片截圖)
- 圖片: 2026-09-28-foliom-bookshelf.webp
- Claude 備註: 做得到,用網頁本身的功能就行,不用另外裝東西。三件事要先想:手機沒有滑鼠,要改成點一下;現在只有巴賽隆納一篇,一本書的書架會很空;封面用你自己的照片,書名就是地名。

## 二、收藏 Collected

### Noomo Agency
- 類型: 設計公司網站
- 日期: 2026-10-03
- 重點: 往下捲，下一頁從底下升上來
- 狀態: 已放棄
- 網址: https://noomoagency.com/
- 喜歡它什麼: 他說：不要自己播的動畫，想要像這個網站一樣，後面的頁面是往下捲才出現的；「捲動的時候要跟我的動畫一樣」。
- Claude 備註: 做成試作 `scroll`（localhost:8646）。後來他再加上自己的想法：攻略書先排在名稱下面（照設計一那一排書），捲一下，地圖從照片裡顯現、書飛到各自的地點；再捲一下，航線飛。兩段都是自動播完，捲動只是按鈕。四款書架裡他選了設計一那一排書。10/4 併進設計二和地球開場並排比較後，他決定只留地球，書架開場和試作 scroll 都拿掉了（git 標籤 before-drop-openings-2026-10-04）。

### wilhelmchang.com
- 類型: 攝影師網站
- 日期: 建站初期
- 重點: 滿版首圖、依國家分的圖磚
- 網址: https://wilhelmchang.com
- 喜歡它什麼: 呈現方式 — 固定的滿版首圖、依國家分的圖磚。取它的安靜與乾淨,不照抄。

### Hannes Becker — Greenland
- 類型: 攝影師網站
- 日期: 2026-09-28
- 重點: 一句話開頭,其餘全是照片
- 網址: https://www.hannesbecker.com/greenland-1
- 這是什麼: 攝影師 Hannes Becker 的格陵蘭專題頁。開頭一句話交代這趟東格陵蘭帆船遠征,其餘全是照片。選單把 Travel 依地點分開。
- 喜歡它什麼: 待補

### Hello Emilie
- 類型: 攝影師網站
- 日期: 2026-09-28
- 重點: 首頁捲動時照片慢慢移的效果
- 網址: https://helloemilie.com/
- 這是什麼: 攝影師 Emilie 的個人網站。作品集、網誌、自己的攝影書、商店、接案服務都在同一個地方。
- 喜歡它什麼: 首頁的捲動效果（2026-10-01 你說的）。
- 觀察: 首頁的滿版照片墊在文字底下，捲動時照片比文字移得慢（視差），像是頁面從照片上面滑過；開場那張山景和中段那張深色照片都是這樣做的。跟 9/30 併進來的「開場照片定住、頁面滑上去」是同一類效果，她的是整頁好幾段都有。

### Jimmy Chin — Stills
- 類型: 攝影師網站
- 日期: 2026-09-28
- 重點: 整面照片,可依主題篩選
- 網址: https://jimmychin.com/stills/
- 這是什麼: 攝影師 Jimmy Chin 的靜態作品頁。一整面照片,可以依主題篩選(探險、人像、地點等)。
- 喜歡它什麼: 待補

### ourtravel.tw
- 類型: 攻略網站
- 日期: 建站初期
- 重點: 比較表、器材清單、時間情報
- 網址: https://ourtravel.tw
- 喜歡它什麼: 實用的攻略內容 — 比較表、器材清單、時間情報。

### Find Us Lost
- 類型: 攻略網站
- 日期: 2026-09-28
- 重點: 攻略卡片標出照片張數
- 網址: https://finduslost.com/
- 這是什麼: 旅遊攻略網誌。每張攻略卡片都標出裡面有幾張照片,首頁有一個「哪座希臘小島適合你」的小測驗。
- 喜歡它什麼: 待補

### Salt in our Hair
- 類型: 攻略網站
- 日期: 2026-09-28
- 重點: 依國家或月份找目的地
- 網址: https://www.saltinourhair.com/
- 這是什麼: 旅遊攻略網站。可以依國家找,也可以依月份找「現在適合去哪」,旁邊附當地氣溫。
- 喜歡它什麼: 待補

### The Common Wanderer
- 類型: 攻略網站
- 日期: 2026-09-28
- 重點: 深度攻略,真人親身經驗
- 網址: https://www.thecommonwanderer.com/
- 這是什麼: 旅遊攻略刊物。深度的目的地攻略和城市行程,強調內容都是真人親身經驗寫的。
- 喜歡它什麼: 待補

### Along Dusty Roads
- 類型: 攻略網站
- 日期: 2026-09-28
- 重點: 路線、故事、地點三個入口
- 網址: https://www.alongdustyroads.com/
- 這是什麼: Andrew 和 Emily 兩人的旅遊網站。首頁分成路線、故事、地點三個入口,攻略和攝影並重。
- 喜歡它什麼: 待補

### Impeccable
- 類型: 設計 Skill
- 日期: 2026-09-28
- 重點: 設計指令加自動檢查
- 網址: https://github.com/pbakaus/impeccable
- 狀態: 已安裝
- 狀態說明: 已安裝,已用來做試驗版網站。2026-10-06 更新到 4.5.0(Mac 和帳號都換了):元件先在瀏覽器裡逐一審核再組頁,另有 generate 一句話做出幾個版本輪播
- 這是什麼: 一套設計指令(審查、打磨、排字、產生變體等),附自動檢查工具。
- 喜歡它什麼: 待補

### Taste skill
- 類型: 設計 Skill
- 日期: 2026-09-28
- 重點: 避免 AI 模板感的規則
- 網址: https://github.com/leonxlnx/taste-skill
- 狀態: 已安裝
- 狀態說明: 已安裝其中三個(design-taste-frontend、redesign-existing-projects、minimalist-ui)
- 這是什麼: 一份設計規則手冊,目的是讓做出來的網頁不像 AI 套模板。
- 喜歡它什麼: 待補

### Scroll-craft
- 類型: 設計 Skill
- 日期: 2026-09-28
- 重點: 捲動式網站
- 網址: https://youtu.be/QUI6Ug4cHnE
- 狀態: 已存檔
- 狀態說明: 已存在 ~/Desktop/scroll-craft,留給之後的專案,不用在旅遊網站
- 這是什麼: 影片「I Built The Ultimate Claude Website Design Skill (steal this)」介紹的捲動式網站 skill。
- 喜歡它什麼: 待補

### UI UX Pro Max
- 類型: 設計 Skill
- 日期: 2026-09-30
- 重點: 可搜尋的設計資料庫
- 網址: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- 狀態: 已安裝
- 狀態說明: 2026-07-26 安裝,2026-09-30 更新到線上最新版(2026-09-27 的版本),並和同一套的 banner-design、brand、design、design-system、slides、ui-styling 一起搬進 Mac 的 ~/.claude/skills/,也上傳到 Claude 帳號,兩邊一致。
- 適合用在: 上線前的檢查清單(無障礙、圖片載入速度、手機版面、鍵盤操作)。它建議的外觀(黑底、大量動畫、Space Grotesk)和這個網站已定的樣子相反,所以不拿它來決定外觀。
- 這是什麼: 一個可以查詢的設計資料庫:風格、配色、字體搭配、各類產品的設計建議、UX 準則。
- 喜歡它什麼: 待補

### Claude Code Mods（hamzafer）
- 類型: 設計 Skill
- 日期: 2026-10-04
- 重點: Claude Code 介面小外掛合集
- 網址: https://github.com/hamzafer/claude-code-mods
- 狀態: 收集中
- 這是什麼: 16 個 mods（不是 skill），裝在 Claude Code 裡，在輸入框上方加一行資訊或加安全關卡。例如 blast-radius（刪資料夾、強制推送前先問你）、token-weather、where-am-i、next-steps，另有 usage-meter（你已經自己做了一個）。
- 適合用在: blast-radius 最有用。其他多半要在終端機裡看圖，或要 Slack、Linear、Codex，用不到。
- 限制: Desktop app 要 Claude Code 2.1.287 以上才畫得出來，你的 app 目前是 2.1.286。
- 喜歡它什麼: 待補

### MengTo Skills
- 類型: 設計 Skill
- 日期: 2026-10-04
- 重點: 140 多個設計與 3D 技能
- 網址: https://github.com/MengTo/Skills
- 狀態: 已安裝
- 狀態說明: 2026-10-04 只裝了 optimize-web-animations，Mac 的 ~/.claude/skills/ 和 Claude 帳號兩邊都有。
- 這是什麼: Meng To（Design+Code、Aura Build 作者）的技能庫，主要寫給 Codex。網頁風格、GSAP、Three.js 3D、遊戲、工作流程。
- 適合用在: optimize-web-animations（設計二的地圖、地球、畫筆動畫跑久了會不會卡）、audit-reference-originality（逐項比對網站和參考網站有沒有太像）。其餘大多是黑底、雷射、玻璃等風格，和這個網站相反。
- 喜歡它什麼: 待補

### 10K Websites
- 類型: 設計 Skill
- 日期: 2026-09-28
- 重點: AI 影片首頁,隨捲動播放
- 網址: https://www.youtube.com/watch?v=snErQUyqwCU&t=896s
- 狀態: 已移除
- 狀態說明: 裝過又移除,因為需要 Higgsfield 帳號
- 這是什麼: 影片「How to Build $10K Websites in Minutes (Claude AI)」的 skill。用 AI 生成的影片做首頁,隨捲動播放。
- 喜歡它什麼: 待補

### Higgsfield
- 類型: 工具與連接
- 日期: 2026-09-28
- 重點: AI 生成圖片和影片,付費
- 網址: https://higgsfield.ai
- 狀態: 未註冊
- 狀態說明: 還沒有帳號。要付費(以點數計)
- 這是什麼: AI 生成圖片和影片的服務,可以用 MCP 接到 Claude。10K Websites 需要它。
- 喜歡它什麼: 待補

### Turn Claude Into A Design GENIUS In 3 Simple Steps
- 類型: 教學影片
- 日期: 2026-09-28
- 重點: 三步驟讓 Claude 做出好設計
- 網址: https://youtu.be/7FU98O0JLHs
- 喜歡哪一段: 待補(Claude 看不了影片,請告訴我你記得的重點)

### Pinterest
- 類型: 找靈感的地方
- 日期: 2026-09-28
- 重點: 搜尋詞要具體,否則偏時尚商品
- 網址: https://www.pinterest.com
- Claude 備註: 找網頁設計時容易被帶去時尚和商品照。搜尋詞用 photography portfolio website、editorial web design 比較準。

### Dribbble
- 類型: 找靈感的地方
- 日期: 2026-09-28
- 重點: 多為概念稿,不一定有上線
- 網址: https://dribbble.com
- Claude 備註: 多半是設計師的概念稿,不一定是真的上線的網站。

### Refero Styles
- 類型: 找靈感的地方
- 日期: 2026-09-28
- 重點: 以產品和 App 介面為主
- 網址: https://refero.design
- Claude 備註: 以產品和 App 介面為主,攝影和個人品牌的例子少。

### 21st.dev
- 類型: 找靈感的地方
- 日期: 2026-09-28
- 重點: React 元件庫,只能參考樣子
- 網址: https://21st.dev
- Claude 備註: 現成的網頁元件庫,以 React 為主。你的網站是純 HTML,只能參考樣子,不能直接拿來用。

### Motion (motionin.design)
- 類型: 找靈感的地方
- 日期: 2026-10-06
- 網址: https://motionin.design
- 重點: 現成的動態區塊,有照片牆
- 狀態: 收集中
- 這是什麼: 一批做好的網頁動態區塊:照片牆、3D 卡片、首頁特效。多數要付費,少數免費。
- 來源: X 上 Vullnet Ademaj 的「AI 設計時代書籤包」貼文(2026-10-06)
- Claude 備註: 做法是給 React 用的,你的網站是純 HTML,只能參考效果,不能直接搬。
- 喜歡它什麼: 待補

### 附上參考網站
- 類型: 做法筆記
- 日期: 2026-09-28
- 重點: 下指令時給它看例子

### 一次做五個版本
- 類型: 做法筆記
- 日期: 2026-09-28
- 重點: 讓它多做幾版,自己再挑

### 先找感興趣的網頁
- 類型: 做法筆記
- 日期: 2026-09-28
- 重點: 有想法後,先找參考再動手

## 三、已採用/已放棄 Used or dropped

*(做了或決定不做的搬到這裡,留一句原因,之後才不會重複討論)*

### image-blaster（一張照片變成 3D 場景）
- 類型: 設計 Skill
- 日期: 2026-10-05
- 重點: 一張照片生出可走進去的 3D 場景
- 網址: https://github.com/neilsonnn/image-blaster
- 狀態: 已放棄
- 狀態說明: 10/5 看過說明後他說「感覺我不太需要」，下載的那份已刪掉（要回來的話 git clone 一下就有）。它不是單一個 skill，是一包八個 skill 加上腳本和看圖的小網頁，要在它自己的資料夾裡跑，而且要 World Labs 和 FAL 的 API 金鑰（付費）。
- 這是什麼: 給 Claude 用的一套 skill：丟一張照片進去，它會做出（一）這個地方的 3D 場景（Gaussian splat，可以把鏡頭移進去走），（二）照片裡每個可以搬動的東西的 3D 模型，（三）環境音和每個東西的音效。工作不是它自己做的，是把照片送到 World Labs（Marble）、FAL（Hunyuan 3D）、ElevenLabs 去生，一個場景大約幾美元。MIT 授權，7,400 顆星。
- Claude 備註: 腳本看過了，只連 fal.ai 和 worldlabs.ai，金鑰放在它自己的 .env（不上傳）。要注意：用它就是把你的照片送到那幾家服務。對網站來說，有意思的是第一項：庫克山或馬特洪峰的照片變成訪客可以飄進去的場景，但這很搶戲，和「設計不能蓋過照片」相反，要試也只在複本上試。
