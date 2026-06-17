# Tarot Divination

## 本地运行

1. 安装依赖：

   ```bash
   npm install
   ```

2. 如果要使用 AI 解读功能，在网站右上角的 AI 设置里填写 GLM API key。
   API key 会保存在当前浏览器的 `localStorage`，同一浏览器下次打开可继续使用。

3. 启动开发环境：

   ```bash
   npm run dev
   ```

4. 打开浏览器访问：

   ```text
   http://localhost:3000
   ```

## 编译和预览生产版本

```bash
npm run build
npm run start
```

然后访问：

```text
http://localhost:3000
```

## 填写牌面介绍

牌面图片和牌名会从 `images/tarots` 自动读取。文件名里的 `_` 会变成空格，例如：

```text
images/tarots/The_Fool.png -> The Fool
images/tarots/Five_of_Cups.png -> Five of Cups
```

每张牌的介绍文字放在 `src/data/cardDescriptions.ts`。你只需要找到对应牌名，把 `description` 填进去即可：

```ts
'The Fool': {
  description: '在这里填写愚者牌的介绍。',
  uprightKeywords: ['new beginning', 'freedom'],
  reversedKeywords: ['reckless', 'delay'],
},
```

`uprightKeywords` 和 `reversedKeywords` 是可选的。不填时，程序会自动使用牌名和正反位作为默认关键词。

## 随机抽牌逻辑

抽牌使用浏览器 Web Crypto API 的 `crypto.getRandomValues`，并通过 Fisher-Yates 洗牌与无偏随机整数抽牌，避免使用 `Math.random()`。每次抽牌都会从剩余牌堆里取牌，所以同一次牌阵不会重复；每张牌的正位/反位也会独立随机决定。
