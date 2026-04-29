# 工作空间配置

**默认工作目录**: `/root/.openclaw/workspace/aiplace`  
**配置版本**: 1.0  
**最后更新**: 2026-04-15

---

## 🎯 工作空间定位

这是 **Claude AI 助手的主要工作空间**，默认应该总是从这个目录开始工作。

---

## 📋 启动检查清单

每次会话开始时应该检查：

- [ ] 确认当前目录是 `/root/.openclaw/workspace/aiplace`
- [ ] 查看是否有新的项目需要开发
- [ ] 检查现有项目的状态
- [ ] 确认环境依赖是否完整

---

## 🗂️ 项目目录结构规划

```
aiplace/
├── README.md              # 工作空间说明
├── WORKSPACE_CONFIG.md    # 工作空间配置 (本文件)
├── .workspace_state       # 工作空间状态文件
├── projects/              # 项目目录
│   └── admin-dashboard/  # 🎯 现代化管理后台
├── docs/                  # 文档和参考资料
│   └── PROJECTS_OVERVIEW.md # 项目总览
├── scripts/               # 实用脚本
├── templates/             # 项目模板
│   └── project-template/
└── temp/                  # 临时文件
```

---

## 🔧 工作规范

### 1. 项目创建流程
1. 在 `projects/` 下创建新项目目录
2. 复制适当的模板（如果有）
3. 初始化项目所需的文件
4. 创建项目README文档

### 2. 命名规范
- 项目名使用小写字母和连字符: `my-new-project`
- 避免使用特殊字符和空格
- 使用描述性的项目名称

### 3. 文档要求
- 每个项目应该有README.md
- 复杂功能应该有技术文档
- 重要决策应该有设计文档

---

## 🎨 开发环境

### 常用命令
```bash
# 进入工作空间
cd /root/.openclaw/workspace/aiplace

# 创建新项目
mkdir -p projects/my-new-project

# 查看项目列表
ls -la projects/

# 查看工作空间状态
cat .workspace_state
```

### 工具和依赖
- **Node.js v22.22.1** (前端项目)
- **pnpm 10.33.0** (包管理器，推荐)
- **npm 10.9.4** (备用包管理器)
- **Python 3.12.3** (后端项目)
- **Git 2.43.0** (版本控制)
- 其他工具根据项目需要安装

---

## 📊 工作空间状态

**当前项目数**: 1
**活跃项目**: Admin Dashboard
**最后活动**: Admin Dashboard systemd 服务管理集成 (2026-04-15)

### 活跃项目详情
- **项目名称**: Admin Dashboard
- **技术栈**: Next.js 16 + TypeScript + Tailwind CSS v4 + Shadcn UI
- **状态**: ✅ 开发环境就绪 + systemd 托管
- **路径**: `projects/admin-dashboard/`
- **文档**: 完整的技术和使用文档
- **服务**: admin-dashboard.service (systemd)

---

**aiplace 工作空间配置**  
*默认工作目录 - 2026-04-09*
