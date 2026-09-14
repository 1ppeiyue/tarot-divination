---
name: tarot-divination
description: 塔罗占卜技能。当用户消息包含"塔罗"、"占卜"关键词，格式为"塔罗/占卜 + 数字 + 领域"时触发。例如："塔罗 88 工作"、"占卜 67 睡眠"。数字是幸运数字（1-999），领域是用户关注的方面（工作、财运、感情、健康等）。此技能会执行塔罗占卜，返回牌面解析和建议。
---


# 🔮 tarot-divination - OpenClaw 塔罗占卜引擎

**版本**：v2.2.0  
**状态**：生产就绪  
**作者**：v_zhouyue09

---

## 📋 功能特性

- ✅ **确定性抽牌算法**：基于SHA256种子，确保结果可复现
- ✅ **私聊/群聊双端支持**：自动适配不同场景
- ✅ **晨间占卜**：每天10:00自动推送（需配置Cron）
- ✅ **知识库同步**：自动存档到百度知识库（可选）
- ✅ **去玄幻化解读**：客观中立，提供可执行建议

---

## 🚀 快速开始

### 1. 安装依赖（可选）

```bash
# 如果需要知识库同步功能，请先安装 ku-doc-manage 技能
# 如果不需要，可以跳过此步骤
```

### 2. 配置文件（可选）

创建 `~/.tarot-config.json`：
```json
{
  "user": {
    "uuap": "your-uuap",
    "email": "your-email@baidu.com"
  },
  "workspace": "/path/to/openclaw/workspace",
  "knowledge_base": {
    "enabled": true,
    "space_id": "your-space-id",
    "parent_doc_id": "your-parent-doc-id"
  }
}
```

### 3. 使用方法

**私聊**：
```
塔罗 88 工作 财运
```

**群聊**：
```
@机器人 塔罗 88 工作
```

**晨间占卜**（自动触发）：
- 每天10:00随机生成幸运数字
- 占卜四个固定方面：
  1. 今天工作现状
  2. 今天后续发展和未来
  3. 今天需要注意的地方或者潜在的机会
  4. 今天财运投资成果

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
├── tarot-data.json           # 塔罗牌库数据
├── prompts/
│   └── divination.md         # LLM提示词模板
├── PROJECT_ARCHIVE.md        # 项目归档文档
└── STRUCTURE.md              # 结构文档
```

---

## ⚙️ 配置说明

### 环境变量（可选）

```bash
# OpenClaw workspace 路径
export OPENCLAW_WORKSPACE="/path/to/openclaw/workspace"

# 知识库技能路径（如果需要知识库同步）
export KU_SKILL_PATH="/path/to/ku-doc-manage"

# 用户邮箱
export EMAIL="your-email@baidu.com"
```

### 知识库同步脚本参数

```bash
# 推荐：使用 --content-file 传文件路径（避免 shell 转义问题）
node sync-to-ku.js --date "2026-06-29" --user "zhouyue" --lucky "89" --title "标题" --content-file "/path/to/report.md"

# 或直接传内容（注意 shell 转义）
node sync-to-ku.js --date "2026-06-29" --user "zhouyue" --lucky "89" --title "标题" --content "$(cat report.md)"
```

**注意**：不要在 --content 中使用 `json.dumps()` 或其他 JSON 序列化，否则会导致中文变成 Unicode 转义序列（`\u4eca\u65e5...`）。

### Cron 任务配置（可选）

```bash
# 每天10:00执行晨间占卜
openclaw cron add \
  --name "晨间塔罗占卜" \
  --schedule "0 10 * * *" \
  --timezone "Asia/Singapore" \
  --payload "node /path/to/morning-divination.js"
```

---

## 🔧 核心算法

### 抽牌不放回机制

**核心原则**：模拟真实塔罗占卜，多领域占卜时不会出现重复牌面。

```javascript
// 步骤1：生成全局种子（日期 + 幸运数字）
const seedString = `${date}-${lucky}`;
const random = createSeededRandom(seedString);

// 步骤2：整体洗牌（只洗一次）
const shuffled = seededShuffle(allCards, random);

// 步骤3：依次取牌（不放回）
// 第0张 → 领域1，第1张 → 领域2，第2张 → 领域3...
aspects.map((aspect, index) => {
  const card = shuffled[index];  // 依次取牌
  const position = random() < 0.5 ? 'upright' : 'reversed';  // 继续使用同一随机序列
  return { aspect, card, position };
});
```

**关键点**：
- ✅ 一次性洗牌，确保牌面随机分布
- ✅ 依次取牌，天然避免重复
- ✅ 正逆位判断继续使用同一随机序列，保证结果确定性
- ✅ 同一天、同一幸运数字，结果完全一致

### 幸运数字种子算法

```javascript
// 使用 SHA256 哈希初始化 Mulberry32 随机数生成器
const hash = crypto.createHash('sha256').update(seed).digest();
let state = hash.readUInt32LE(0);

// Mulberry32 算法生成 [0, 1) 范围随机数
function random() {
  state += 0x6D2B79F5;
  let t = Math.imul(state ^ state >>> 15, state | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
```

---

## 📊 输出格式

```
今日塔罗单次独立解析：2026-03-31 | 种子：88

1. 工作：The Sun 正
- 当下真相：你正处于一个充满机遇的阶段，但需要警惕过度乐观。
- 逻辑拆解：太阳牌正位代表成功和喜悦，但也提醒你要保持清醒，避免因自信而忽视细节。
- 后果推演：如果持续积极行动，预计短期内会有明显的成果，但要注意不要冒进。
- ★ 避险动作：今天在做重要决策前，先咨询一位你信任的同事或导师。

🌟 综合盘点与生存哲学
...

今日核心关键词
机遇 | 积极 | 保持清醒
```

---

## ⚠️ 注意事项

1. **路径配置**：首次使用需要配置 `OPENCLAW_WORKSPACE` 环境变量
2. **知识库同步**：需要安装 `ku-doc-manage` 技能并配置知识库信息
3. **Cron 任务**：晨间占卜需要手动配置 Cron 任务

---

## 📚 文档

- [项目归档文档](PROJECT_ARCHIVE.md)
- [结构文档](STRUCTURE.md)
- [迁移指南](MIGRATION_GUIDE.md)

---

## 📝 更新日志

### v2.2.0 (2026-06-22)
- ✅ **抽牌不放回机制**：多领域占卜不再出现重复牌面
- ✅ 算法重构：一次性整体洗牌，依次取牌模拟真实抽牌

### v2.0.0 (2026-03-26)
- ✅ 引入4大模块（当下真相、逻辑拆解、后果推演、避险动作）
- ✅ 去玄幻化改造

### v1.0.0 (2026-03-25)
- ✅ 初始版本

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License