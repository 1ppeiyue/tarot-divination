# 🔮 tarot-divination

**OpenClaw 塔罗占卜引擎 - 职场决策辅助工具**

[![版本](https://img.shields.io/badge/版本-v2.1.0-blue)](https://github.com)
[![状态](https://img.shields.io/badge/状态-生产就绪-green)](https://github.com)
[![许可](https://img.shields.io/badge/许可-MIT-orange)](LICENSE)

---

## 📖 简介

tarot-divination 是基于 OpenClaw 框架开发的自动化职场塔罗分析工具。它将传统塔罗占卜与现代职场决策相结合，通过确定性算法和心理学分析框架，为用户提供客观、可执行的决策建议。

**核心价值**：
- ❌ 不是算命工具
- ✅ 是决策辅助系统
- ❌ 不提供模棱两可的预测
- ✅ 给出明确的行动建议

---

## ✨ 功能特性

### 核心功能

- ✅ **确定性抽牌算法**：基于SHA256种子，确保结果可复现
- ✅ **私聊/群聊双端支持**：自动适配不同场景
- ✅ **晨间占卜**：每天10:00自动推送（需配置Cron）
- ✅ **知识库同步**：自动存档到百度知识库（可选）
- ✅ **去玄幻化解读**：客观中立，提供可执行建议

### 输出格式

每次占卜包含4个核心模块：

1. **当下真相**：一句话直接点破核心状态
2. **逻辑拆解**：结合牌面意象与现实心理分析
3. **后果推演**：预测短期内的可能结果
4. **★ 避险动作**：给出具体、可执行的建议

---

## 🚀 快速开始

### 安装

#### 方式1：下载 ZIP 包

1. 下载 `tarot-divination-v2.1.zip`
2. 解压到 OpenClaw 技能目录：
   ```bash
   unzip tarot-divination-v2.1.zip -d ~/.openclaw/skills/
   ```

#### 方式2：从百度技能中心安装

```bash
openclaw skill install tarot-divination
```

### 配置（可选）

#### 创建配置文件

```bash
# 创建配置文件
cat > ~/.tarot-config.json << 'EOF'
{
  "user": {
    "uuap": "your-uuap",
    "email": "your-email@baidu.com"
  },
  "workspace": "/home/your-username/.openclaw/workspace",
  "knowledge_base": {
    "enabled": false
  },
  "morning_divination": {
    "enabled": true,
    "time": "10:00",
    "timezone": "Asia/Singapore"
  }
}
EOF
```

#### 环境变量配置（可选）

```bash
# OpenClaw workspace 路径
export OPENCLAW_WORKSPACE="/home/your-username/.openclaw/workspace"

# 知识库技能路径（如果需要知识库同步）
export KU_SKILL_PATH="/home/your-username/.openclaw/skills/ku-doc-manage"

# 用户邮箱
export EMAIL="your-email@baidu.com"
```

### 使用方法

#### 手动占卜

**私聊**：
```
塔罗 88 工作 财运
```

**群聊**：
```
@机器人 塔罗 88 工作
```

**格式说明**：
- `塔罗` 或 `占卜`：触发关键词
- `88`：幸运数字（1-999）
- `工作 财运`：关注的领域（支持多个，用空格分隔）

#### 晨间占卜（自动）

每天10:00自动执行，随机生成幸运数字，占卜四个固定方面：
1. 今天工作现状
2. 今天后续发展和未来
3. 今天需要注意的地方或者潜在的机会
4. 今天财运投资成果

---

## 📖 使用示例

### 示例1：工作决策

```
用户: 塔罗 18 休息还是奋斗

AI: 今日塔罗单次独立解析：2026-03-29 | 种子：18

1. 休息还是奋斗：Wheel of Fortune 逆
- 当下真相：你正在与命运的节奏对抗，而这种对抗本身比"休息"还是"奋斗"更消耗你。
- 逻辑拆解：命运之轮逆位代表你正处于一个需要顺应变化的时期，但你的潜意识在抵抗这种变化。
- 后果推演：如果继续在"休息还是奋斗"这个问题上纠结，预计短期内会出现决策瘫痪。
- ★ 避险动作：今天不要做非此即彼的决定。尝试"动态平衡"：上午专注工作2小时，下午彻底放松2小时。

🌟 综合盘点与生存哲学
真正的问题不是"休息还是奋斗"，而是你是否愿意接受当前的变化周期。

今日核心关键词
顺应变化 | 内在抵抗 | 动态平衡
```

### 示例2：财运分析

```
用户: 塔罗 23 现状 未来 对策行动 注意的地方

AI: 今日塔罗单次独立解析：2026-03-29 | 种子：23

1. 现状：The Moon 正
- 当下真相：你正处于一个充满不确定性的迷雾期，很多看似清晰的事情其实只是表象。
...

[完整输出省略]
```

---

## ⚙️ 高级配置

### Cron 任务配置

```bash
# 每天10:00执行晨间占卜
openclaw cron add \
  --name "晨间塔罗占卜" \
  --schedule "0 10 * * *" \
  --timezone "Asia/Singapore" \
  --payload "node /home/your-username/.openclaw/skills/tarot-divination/morning-divination.js"
```

### 知识库同步配置

如果要启用知识库同步功能：

1. 安装 `ku-doc-manage` 技能
2. 配置知识库信息：
   ```json
   {
     "knowledge_base": {
       "enabled": true,
       "space_id": "your-space-id",
       "parent_doc_id": "your-parent-doc-id"
     }
   }
   ```

---

## 📂 文件结构

```
tarot-divination/
├── SKILL.md                  # 技能描述（必需）
├── config.js                 # 配置文件
├── tarot-automation.js       # 主自动化脚本
├── tarot-engine.js           # 核心抽牌引擎
├── morning-divination.js     # 晨间占卜脚本
├── sync-to-ku.js             # 知识库同步脚本
├── tarot-data.json           # 塔罗牌库数据（78张牌）
├── prompts/
│   └── divination.md         # LLM提示词模板
├── PROJECT_ARCHIVE.md        # 项目归档文档
└── STRUCTURE.md              # 结构文档
```

---

## 🔧 技术架构

### 核心算法

```
用户输入
    ↓
参数清洗 (cleanRawMessage)
    ↓
幸运数字 + 领域提取
    ↓
SHA256种子生成
    ↓
Mulberry32随机数生成器
    ↓
Fisher-Yates洗牌
    ↓
抽取牌 + 判断正逆位
    ↓
LLM填充 (divination.md模板)
    ↓
知识库同步（可选）
    ↓
发送结果
```

### 依赖关系

```
config.js (配置)
    ↓
tarot-automation.js (主脚本)
    ├── tarot-engine.js (抽牌引擎)
    │   └── tarot-data.json (牌库)
    └── prompts/divination.md (提示词)
    ↓
sync-to-ku.js (知识库同步，可选)
    └── ku-doc-manage (知识库API)
```

---

## 📊 性能指标

- **响应时间**：3-8秒
  - 参数解析：< 100ms
  - 抽牌算法：< 50ms
  - LLM填充：2-5秒
  - 知识库同步：1-3秒

- **文件大小**：约44KB

- **支持平台**：
  - ✅ 如流私聊
  - ✅ 如流群聊
  - ✅ OpenClaw Web

---

## ⚠️ 注意事项

1. **路径配置**：首次使用需要配置 `OPENCLAW_WORKSPACE` 环境变量或创建配置文件
2. **知识库同步**：需要安装 `ku-doc-manage` 技能并配置知识库信息
3. **Cron 任务**：晨间占卜需要手动配置 Cron 任务
4. **时区设置**：默认使用 Asia/Singapore 时区，可根据需要修改

---

## 🐛 常见问题

### Q1: 知识库同步失败怎么办？

**A**: 检查以下几点：
1. 是否安装了 `ku-doc-manage` 技能
2. 配置文件中的知识库信息是否正确
3. 网络连接是否正常

### Q2: 晨间占卜没有自动触发？

**A**: 检查以下几点：
1. Cron 任务是否正确配置
2. 时区设置是否正确
3. OpenClaw 服务是否运行

### Q3: 群聊触发失败？

**A**: 使用强制前缀：
```
!塔罗 88 工作
```

---

## 📚 文档

- [项目归档文档](PROJECT_ARCHIVE.md) - 完整的技术细节和开发历程
- [结构文档](STRUCTURE.md) - 文件结构和依赖关系
- [迁移指南](MIGRATION_GUIDE.md) - 部署到其他环境的注意事项

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/your-repo/tarot-divination.git

# 安装依赖（如果需要知识库同步）
# npm install

# 测试
node tarot-automation.js --raw-message "塔罗 88 工作"
```

---

## 📝 更新日志

### v2.1.0 (2026-03-31)
- ✅ 知识库同步修复
- ✅ 按日期创建文件夹
- ✅ 项目归档文档

### v2.0.0 (2026-03-26)
- ✅ 引入4大模块
- ✅ 去玄幻化改造
- ✅ 独立解析

### v1.0.0 (2026-03-25)
- ✅ 初始版本

---

## 📄 许可证

MIT License

---

## 🙏 致谢

感谢以下项目和平台：
- OpenClaw 框架
- Node.js
- 百度知识库 API
- 如流 IM 平台

---

**🔮 愿塔罗指引你的决策之路！**