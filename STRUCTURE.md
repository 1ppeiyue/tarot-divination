# tarot-divination 完整结构文档

## 📂 文件结构

```
<skill-path>/
├── config.js                  # 统一配置文件
├── tarot-automation.js        # 主自动化脚本
├── tarot-engine.js            # 核心抽牌引擎
├── morning-divination.js      # 晨间占卜专用脚本
├── sync-to-ku.js              # 知识库同步脚本
├── tarot-data.json            # 塔罗牌库数据
├── prompts/
│   └── divination.md          # LLM提示词模板
└── SKILL.md                   # 技能说明文档
```

---

## 📄 各文件详解

### 1. config.js（统一配置）

**作用**：集中管理所有配置信息

**内容包括**：
```javascript
{
  storage: {
    workspace: '<workspace>',           // OpenClaw工作目录
    memory: '<workspace>/memory',       // Memory存储路径
    skillPath: '<skill-path>'  // 技能路径
  },
  
  ku: {
    spaceId: '<space-id>',                                // 知识库空间ID
    parentDocId: '<parent-doc-id>',                       // 父文档ID
    skillPath: '<ku-skill-path>'  // 知识库API路径
  },
  
  user: {
    uuap: '<your-uuap>',                                 // 用户UUAP
    email: '<your-email@example.com>'                       // 用户邮箱
  },
  
  morning: {
    time: '10:00',                                       // 晨间占卜时间
    timezone: 'Asia/Singapore',                          // 时区
    luckyRange: { min: 1, max: 99 },                    // 随机数字范围
    aspects: [                                          // 固定占卜方面
      '今天工作现状',
      '今天后续发展和未来',
      '今天需要注意的地方或者潜在的机会',
      '今天财运投资成果'
    ]
  }
}
```

**被依赖**：
- tarot-automation.js
- morning-divination.js
- sync-to-ku.js

---

### 2. tarot-automation.js（主自动化脚本）

**作用**：核心占卜执行脚本，支持手动和晨间占卜

**功能**：
1. 参数清洗（去除@机器人、关键词等）
2. 调用抽牌引擎
3. 输出占卜结果JSON

**使用方式**：
```bash
# 手动占卜
node tarot-automation.js --raw-message "塔罗 88 工作 财运" --user <your-uuap>

# 晨间占卜
node tarot-automation.js --morning --user <your-uuap>
```

**依赖**：
- `tarot-engine.js` - 抽牌引擎
- `config.js` - 配置
- `tarot-data.json` - 牌库数据（间接依赖）

**输出格式**：
```json
{
  "date": "2026-03-31",
  "lucky_number": "54",
  "aspects": [
    {
      "aspect": "今天工作现状",
      "card": { "name": "The Sun", "position": "reversed", ... },
      "keywords": ["暂时的挫折", "过度乐观", "缺乏热情"]
    }
  ]
}
```

---

### 3. tarot-engine.js（核心抽牌引擎）

**作用**：基于种子的确定性抽牌算法

**功能**：
1. SHA256种子生成
2. Fisher-Yates洗牌算法
3. 牌面抽取（正/逆位判断）

**依赖**：
- `tarot-data.json` - 牌库数据
- Node.js内置模块：`crypto`, `fs`, `path`

**被依赖**：
- `tarot-automation.js`
- `morning-divination.js`

**核心函数**：
```javascript
divine({ date, lucky, aspects })  // 执行占卜
createSeededRandom(seed)          // 创建随机数生成器
seededShuffle(array, random)      // 种子洗牌
```

---

### 4. morning-divination.js（晨间占卜脚本）

**作用**：专门用于Cron定时任务的晨间占卜

**功能**：
1. 自动生成随机幸运数字（1-99）
2. 使用固定四个方面占卜
3. 输出JSON结果

**依赖**：
- `tarot-engine.js` - 抽牌引擎
- `config.js` - 配置

**使用方式**：
```bash
node morning-divination.js
```

---

### 5. sync-to-ku.js（知识库同步脚本）

**作用**：将占卜结果同步到知识库，按日期创建文件夹

**功能**：
1. 检查日期文件夹是否存在
2. 创建日期文件夹（如不存在）
3. 在日期文件夹下创建占卜文档
4. 写入Memory

**依赖**：
- `config.js` - 配置
- `ku-doc-manage` 技能 - 知识库API

**使用方式**：
```bash
node sync-to-ku.js --date "2026-03-29" --user "zhouyue" --lucky "88" --title "标题" --content "内容"
```

**知识库URL结构**：
```
https://<knowledge-base-url>/<space-id>/
├── <parent-doc-id> (父文档)
│   ├── 2026-03-29/ (日期文件夹)
│   │   ├── 占卜zhouyue18
│   │   └── 占卜zhouyue23
│   └── 2026-03-30/
│       └── 占卜zhouyue54
```

---

### 6. tarot-data.json（塔罗牌库数据）

**作用**：存储78张塔罗牌的完整信息

**内容包括**：
- 22张大阿尔卡那牌
- 56张小阿尔卡那牌（4个花色：Wands, Cups, Swords, Pentacles）

**数据结构**：
```json
{
  "major_arcana": [
    {
      "name": "The Fool",
      "number": 0,
      "keywords": {
        "upright": ["新开始", "纯真", "自发性"],
        "reversed": ["鲁莽", "冒险", "愚蠢"]
      }
    }
  ],
  "minor_arcana": {
    "Wands": [...],
    "Cups": [...],
    "Swords": [...],
    "Pentacles": [...]
  }
}
```

**大小**：20.4KB

**被依赖**：
- `tarot-engine.js`

---

### 7. prompts/divination.md（LLM提示词模板）

**作用**：指导LLM如何填充完整的占卜内容

**功能**：
1. 定义输出格式（禁止Markdown表格）
2. 提供解读规则（去玄幻化、客观中立）
3. 给出示例

**使用流程**：
1. 从tarot-automation.js获取占卜JSON
2. 使用此模板填充详细解读
3. 生成最终报告

**输出格式**：
```
今日塔罗单次独立解析：[日期] | 种子：[LuckyNum]

1. [领域名]：[牌名] [正/逆]
- 当下真相：...
- 逻辑拆解：...
- 后果推演：...
- ★ 避险动作：...

🌟 综合盘点与生存哲学
...

今日核心关键词
... | ... | ...
```

---

### 8. SKILL.md（技能说明文档）

**作用**：OpenClaw技能系统的说明文档

**内容包括**：
- 触发规则（塔罗、占卜关键词）
- 执行流程（5个步骤）
- 绝对路径清单
- 禁止事项

---

## 🔗 依赖关系图

```
config.js (配置)
    ↓
┌─────────────────────────────────────┐
│  tarot-automation.js (主脚本)       │
│  ├── tarot-engine.js (抽牌引擎)     │
│  │   └── tarot-data.json (牌库)     │
│  └── prompts/divination.md (提示词) │
└─────────────────────────────────────┘
    ↓
sync-to-ku.js (知识库同步)
    ├── config.js (配置)
    └── ku-doc-manage (知识库API)
```

---

## 📁 存储文件路径

### 本地存储

**Memory文件**：
```
<workspace>/memory/YYYY-MM-DD.md
```
- 用途：记录每日占卜历史
- 格式：Markdown追加

**临时文件**：
```
<workspace>/temp_ku_*.py
```
- 用途：知识库同步时的临时Python脚本
- 生命周期：脚本执行完后删除

---

### 知识库存储

**知识库URL**：
```
https://<knowledge-base-url>/<space-id>/
```

**空间ID**：`<space-id>`

**父文档ID**：`<parent-doc-id>`

**文档结构**：
```
<parent-doc-id>/
├── 2026-03-29/
│   ├── 占卜zhouyue18
│   └── 占卜zhouyue23
├── 2026-03-30/
│   └── 占卜zhouyue54
└── ... (更多日期文件夹)
```

---

## 🚀 执行流程

### 手动占卜流程

```bash
# 步骤1：执行占卜
node <skill-path>/tarot-automation.js \
  --raw-message "塔罗 88 工作 财运"

# 步骤2：LLM填充内容（使用prompts/divination.md）

# 步骤3：同步到知识库
node <skill-path>/sync-to-ku.js \
  --date "2026-03-29" \
  --user "zhouyue" \
  --lucky "88" \
  --title "占卜zhouyue88" \
  --content "完整内容"

# 步骤4：发送到如流
infoflow-send --to <your-uuap> --message "占卜结果"
```

---

### 晨间占卜流程（自动化）

```
每天10:00 (Asia/Singapore)
    ↓
Cron触发 → 执行 morning-divination.js
    ↓
随机生成幸运数字 (1-99)
    ↓
占卜四个固定方面
    ↓
LLM填充内容
    ↓
sync-to-ku.js 同步到知识库
    ├── 创建/获取日期文件夹
    └── 创建占卜文档
    ↓
发送到如流私聊 <your-uuap>
```

---

## 📊 文件大小统计

```
config.js                714 字节
tarot-automation.js    3,453 字节
tarot-engine.js        4,799 字节
morning-divination.js  1,703 字节
sync-to-ku.js          6,567 字节
tarot-data.json       20,362 字节
prompts/divination.md  2,800 字节
SKILL.md               4,708 字节
─────────────────────────────────
总计                  45,106 字节 (约44KB)
```

---

## 🔧 关键配置

**用户信息**：
- UUAP: `<your-uuap>`
- Email: `<your-email@example.com>`

**知识库**：
- 空间ID: `<space-id>`
- 父文档ID: `<parent-doc-id>`
- URL: https://<knowledge-base-url>/<space-id>/<parent-doc-id>

**Cron任务**：
- 任务ID: `c8f80060-6b35-4808-abe0-abacc3802db9`
- 时间: 每天10:00 (Asia/Singapore)
- 下次执行: 明天10:00

---

## ✅ 总结

**核心文件（必须）**：
1. config.js - 配置
2. tarot-automation.js - 主脚本
3. tarot-engine.js - 抽牌引擎
4. tarot-data.json - 牌库
5. sync-to-ku.js - 知识库同步
6. prompts/divination.md - 提示词

**辅助文件（可选）**：
1. morning-divination.js - 晨间占卜专用
2. SKILL.md - 技能说明

**所有依赖和路径均为绝对路径，确保在任何环境下都能正确执行。**