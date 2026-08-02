# Space Tarot | 星空塔罗

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

牌面图片实际读取的是 `src/generated/tarots/*.webp`，不是直接读取 `images/tarots`。当前仓库里的 `webp` 已经是预先生成好的静态资源，`npm run build` 只是把它们打包进应用。

源图片保留在 `images/tarots/*.png`，如果你要重新导出牌面图，可以从这里开始处理。生成后的文件名会把 `_` 视为空格，例如：

```text
src/generated/tarots/The_Fool.webp -> The Fool
src/generated/tarots/Five_of_Cups.webp -> Five of Cups
```

重新生成牌面 webp：

```bash
npm run generate:tarots
```

这个脚本会读取 `images/tarots/*.png`，缩放到 900px 宽，并输出到 `src/generated/tarots/*.webp`。生成前会清空 `src/generated/tarots` 里的旧 `webp`，避免已删除的源图继续被应用读取。

## 卡背图片

应用实际读取的是 `src/generated/card_backs/card_back_day.webp` 和 `card_back_night.webp`。源文件仍然保留在 `images/card_back/*.png`，方便继续编辑；WebP 只是运行时使用的压缩副本，不会替代或破坏原 PNG。

修改卡背 PNG 后，重新启动开发环境或重新构建即可自动生成最新 WebP。也可以单独执行：

```bash
npm run generate:card-backs
```

`npm run dev` 和 `npm run build` 都会在启动/构建前自动执行资源生成流程。

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
