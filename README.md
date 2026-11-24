# 空气尤克里里 Air Ukulele

用空中手势演奏尤克里里：智能戒指选和弦，智能手杖扫弦。Capacitor 打包为手机 App，并适配手表小屏。

## 功能

- **和弦组**：海岛 (C G Am F) / 民谣 / 蓝调 / 爵士
- **Web Audio 合成**：尼龙弦感扫弦（上扫 / 下扫 / 止音）
- **可穿戴输入**
  - 戒指：左右切换和弦 · 上下切换音组 · 甩动静音
  - 手杖：挥动扫弦 · 敲击止音
- **触控兜底**：点按和弦 / 扫弦按钮 · 琴身左右滑动扫弦
- **手表适配**：`max-width: 280px` 或 `max-height: 300px` 紧凑布局

## 项目结构

```
air-ukulele/
├── protocol/air-ukulele.json   # 手势与和弦组协议
└── mobile/
    ├── index.html
    ├── capacitor.config.json
    ├── package.json
    ├── scripts/build-web.js
    ├── src/
    │   ├── app.js              # UI 与手势路由
    │   ├── audio-engine.js     # Web Audio 扫弦
    │   ├── chords.js           # GCEA 和弦频率
    │   └── wearable-input.js   # 戒指 / 手杖
    └── test/
```

## 快速开始

```bash
cd mobile
npm install
npm run build          # → www/
npm test
```

浏览器预览：

```bash
npx serve www
```

## 打包 Android / iOS

```bash
cd mobile
npm install
npx cap add android    # 或 ios
npm run mobile:android
# 或 npm run mobile:ios
```

日常：改 `src/` 或 `index.html` → `npm run build` → `npx cap sync android` → 真机运行。

## 手势对照

| 设备 | 动作 | 效果 |
|------|------|------|
| 戒指 | 左右倾 > 5° | 上一/下一和弦 |
| 戒指 | 上下倾 > 5° | 上一/下一音组 |
| 戒指 | 甩动 > 20° | 切换静音 |
| 手杖 | 挥动 > 3 | 扫弦 |
| 手杖 | 加速度尖峰 > 8 | 止音 |

桌面调试：`←` `→` 切和弦，`↑` `↓` 切音组，空格扫弦，`M` 静音。
