# Stellar Defenders - 深空防线

一款科幻题材的网页生存射击小游戏。

## 游戏特色

- 🎮 自动射击 + 左右移动
- 🌊 5 波敌人 + Boss 战
- 🎲 升级三选一肉鸽成长系统
- 🚀 追踪导弹、激光、电弧等特殊武器
- 👾 4 种敌人类型 + 多阶段 Boss
- ⏱ 单局约 3 分钟

## 快速开始

```bash
# 方法 1: Python
python3 -m http.server 8000

# 方法 2: Node.js
npx serve .
```

打开浏览器访问 http://localhost:8000

## 操作方式

| 操作 | 按键 |
|------|------|
| 左移 | ← 或 A |
| 右移 | → 或 D |
| 暂停 | ESC |
| 射击 | 自动 |
| 选择升级 | 鼠标点击 |

## 游戏流程

1. **波次 1-5**: 击杀敌人获取经验，升级选择强化
2. **Boss 战**: 击败歼灭母舰即可通关
3. **失败条件**: 生命值归零 或 基地耐久归零

## 技术信息

- 纯 HTML/CSS/JavaScript + Canvas 2D
- 无框架依赖，无需构建
- ES Modules 模块化
- 可直接部署到任意静态托管平台

## 部署

将整个项目目录上传至静态托管平台即可：
- GitHub Pages
- Netlify
- Vercel
- 任意支持静态文件的 Web 服务器

### Cloudflare Pages

仓库已补充 Cloudflare Pages 发布配置：

```bash
npm run deploy:pages
```

命令会先生成 `dist/`，再发布到 `stellar-defenders.pages.dev`。

## 素材替换

当前使用极简几何图形占位。替换方法：
1. 将图片资源放入 `assets/` 目录
2. 修改对应实体的 `render()` 方法，用 `ctx.drawImage()` 替代几何绘制

## 数值调整

所有游戏数值集中在 `src/config/` 目录：
- `constants.js` - 全局常量（画布大小、玩家属性、基地配置等）
- `enemies.js` - 敌人属性配置
- `weapons.js` - 武器配置
- `upgrades.js` - 升级项池
- `waves.js` - 波次配置

## License

MIT
