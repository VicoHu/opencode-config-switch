# OpenCode Config Switch

一款用于灵活切换 Oh My OpenCode 和 OpenCode 配置的桌面应用。

## 功能特性

- **多套配置管理**：为 Oh My OpenCode 和 OpenCode 分别创建多套配置
- **灵活组合**：自由组合不同的 Oh My OpenCode 和 OpenCode 配置
- **一键切换**：快速激活选中的配置到系统
- **配置预设**：保存常用的配置组合，一键应用
- **导入导出**：从现有系统配置导入，方便迁移

## 技术栈

- **Electron** - 桌面应用框架
- **Vue 3** - 前端框架
- **Vite** - 构建工具
- **Pinia** - 状态管理
- **Naive UI** - UI 组件库
- **TypeScript** - 类型安全

## 安装

```bash
# 克隆项目
cd opencode-config-switch

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建应用
npm run build:mac
```

## 使用说明

1. **新建配置**
   - 在 Oh My OpenCode 或 OpenCode 标签页下
   - 点击"新建配置"按钮
   - 输入配置名称、描述和 JSON 内容
   - 保存

2. **导入现有配置**
   - 点击"从系统导入"按钮
   - 应用会自动读取 `~/.config/opencode/` 目录下的现有配置
   - 可以基于现有配置创建新的配置

3. **激活配置**
   - 点击配置项旁边的"激活"按钮
   - 配置会被复制到 `~/.config/opencode/` 目录
   - 原配置会自动备份

4. **配置组合**
   - 点击顶部"配置组合"按钮
   - 创建新的组合，选择 Oh My OpenCode 和 OpenCode 配置
   - 一键应用组合，同时切换两套配置

## 配置存储位置

应用内部配置存储在：
- macOS: `~/Library/Application Support/opencode-config-switch/configs/`

系统配置目标位置：
- Oh My OpenCode: `~/.config/opencode/oh-my-opencode.json`
- OpenCode: `~/.config/opencode/opencode.json`

## 项目结构

```
opencode-config-switch/
├── src/
│   ├── main/           # Electron 主进程
│   ├── preload/        # 预加载脚本
│   └── renderer/       # 渲染进程 (Vue 应用)
│       ├── components/ # 组件
│       ├── stores/     # Pinia 状态管理
│       └── views/      # 页面
├── dist/               # 构建输出
└── release/            # 打包输出
```

## 开发

```bash
# 开发模式
npm run dev

# 代码检查
npm run lint

# 构建
npm run build

# 打包 macOS 应用
npm run build:mac
```

## License

MIT