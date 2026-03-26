# Stellar Defenders - 深空防线

## 项目概述
科幻题材网页生存射击小游戏。**540×960 竖屏**，左右分屏设计。纯 HTML/CSS/JS + Canvas，无框架依赖。

## 核心玩法
- 屏幕**左右等分**（各 270px 宽）
- **左侧**：砖块包裹的宝箱模块，打碎砖块→暴露宝箱→击破宝箱获取史诗武器
- **右侧**：敌人从上方入侵，保护基地
- **玩家**：底部全宽移动，自动向上射击
- **核心策略**：在左侧打宝箱升级 vs 右侧清怪防守之间权衡

## 宝箱模块设计
- 4 个宝箱纵向排列，品质从上到下递增：普通→稀有→史诗→传说
- 砖块完全包裹宝箱，必须先打碎全部外围砖块
- 宝箱暴露后有发光效果，击破掉落 1-2 个强化
- 深层宝箱奖励更强（传说级有电弧、全属性等）

## 技术栈
- HTML5 Canvas 2D (540×960)
- 原生 JavaScript (ES Modules)
- 无构建工具，静态文件直接运行

## 项目结构
```
src/
├── core/          # game.js(主循环)、eventBus.js、renderer.js
├── entities/      # player、enemy、bullet、particle、pickup、wall(宝箱模块系统)
├── systems/       # input、collision、spawner、upgrade、wave
├── ui/            # hud、menu、upgradePanel(→RewardPopup)
├── config/        # constants(CHEST配置)、enemies、weapons、upgrades(按品质分池)、waves
└── utils/         # helpers
```

## 如何运行
```bash
python3 -m http.server 8000  # 或 npx serve .
```

## 扩展指南
- **新宝箱品质**: config/constants.js CHEST.TIERS + config/upgrades.js REWARD_POOL
- **新敌人**: config/enemies.js + entities/enemy.js render
- **新武器**: config/weapons.js + core/game.js fire逻辑
- **砖墙布局**: config/constants.js CHEST配置 + entities/wall.js ChestModule
- **调数值**: config/ 目录下集中管理

## 关键实现细节
- wall.js: WallSystem.modules[] 包含 ChestModule，每个有 bricks[] 和 chest
- wall.checkBulletCollisions() 返回 { brickHits: [], chestHits: [] }
- chest.exposed 为 true 时才能被子弹命中（所有周围砖块打破后）
- 敌人只在右侧(x>=270)生成和移动，Boss 也限右侧
