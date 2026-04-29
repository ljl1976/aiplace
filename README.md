# AI工作空间 - aiplace

**目录**: `/root/.openclaw/workspace/aiplace`  
**用途**: Claude AI 助手的默认工作空间  
**创建时间**: 2026-04-09

---

## 📋 工作空间说明

这是我的主要工作空间，用于：
- 🛠️ 开发和维护项目
- 📝 编写和管理代码
- 🧪 测试和验证功能
- 📚 存储工作文档

---

## 🚀 快速开始

```bash
# 进入工作空间
cd /root/.openclaw/workspace/aiplace

# 查看当前项目
ls -la

# 开始工作...
```

---

## 📁 项目结构

```
aiplace/
├── README.md              # 工作空间说明 (本文件)
├── WORKSPACE_CONFIG.md    # 工作空间配置
├── .workspace_state       # 工作空间状态
├── projects/              # 项目目录
│   └── admin-dashboard/   # 🎯 现代化管理后台 (Next.js 16)
├── docs/                  # 文档目录
├── scripts/               # 脚本目录
├── templates/             # 项目模板
│   └── project-template/
└── temp/                  # 临时文件
```

---

## 💡 工作规范

1. **项目组织**: 每个项目应该在 `projects/` 下有独立目录
2. **文档管理**: 重要文档应放在 `docs/` 目录
3. **代码规范**: 遵循既定的编码标准和最佳实践
4. **版本控制**: 重要更改应及时提交到Git

---

## 🎯 当前项目

### 🚀 **Admin Dashboard** (活跃)
- **技术栈**: Next.js 16 + TypeScript + Tailwind CSS v4 + Shadcn UI
- **状态**: ✅ 开发环境配置完成
- **路径**: `projects/admin-dashboard/`
- **启动**: `cd projects/admin-dashboard && pnpm run dev`
- **文档**:
  - [项目信息](./projects/admin-dashboard/PROJECT_INFO.md)
  - [结构详解](./projects/admin-dashboard/PROJECT_STRUCTURE.md)

**核心特性**:
- 🎨 极简现代设计风格
- 📊 多种仪表板模板 (Default, CRM, Finance, Analytics)
- 🔐 完整认证系统
- 🌓 主题定制 (浅色/深色 + 多种颜色方案)
- 📱 完全响应式设计
- ⚡ 高性能构建 (Turbopack)

---

## 🎯 当前任务

- [x] 完成 Admin Dashboard 项目集成
- [ ] 后端API集成规划
- [ ] 业务功能定制开发
- [ ] 部署配置优化

---

**aiplace - AI工作空间**  
*默认工作目录 - 2026-04-09*
