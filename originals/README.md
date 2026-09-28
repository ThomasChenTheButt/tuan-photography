# 你的原檔放這裡 · Your originals go here

把照片丟進對應的國家資料夾就好，其他交給 Claude。
Drop photos into the matching country folder. Claude handles the rest.

```
originals/           ← 你的。只存在你的電腦，不會上 GitHub
  spain/  japan/  taiwan/  …      一個國家一個資料夾
  portfolio/                       最想放進作品集的照片
  photo-list.html                  照片清單（自動產生）

images/              ← 網站的。Claude 做的縮小版，你不用打開
```

## 看照片清單 · The photo list

雙擊專案資料夾裡的 **`photo-list.command`**，就會更新並打開清單。它會告訴你：
Double-click **`photo-list.command`** in the project folder. It shows:

- 網站上每一張照片，是從哪個原檔來的、用在哪些頁面
  each photo on the site, the original it came from, and the pages that use it
- 哪些原檔還沒上網站 · which originals are not on the site yet
- 每個資料夾有幾張 · how many photos each folder holds

## 幾件事 · A few notes

- **原始大小就好**：直接丟全解析度檔案，Claude 會做網頁用的縮小版，原檔不會被改動。
  Drop full-res files. Claude makes web-sized copies and never alters your originals.
- **檔名不用管**：5S5A1234.jpg 這種也可以。Filenames don't matter.
- **只放自己拍的**：別人的參考圖放 `ideas/`，不要放這裡。
  Only your own photos. Other people's reference shots belong in `ideas/`.
- **資料夾不要改名或搬走**：要新增國家，跟 Claude 說。
  Don't rename or move the folders. For a new country, ask Claude.
- 想指定某張當開場照片或國家封面，跟 Claude 說檔名就好。
  To make a photo the opening photo or a country cover, tell Claude its filename.
