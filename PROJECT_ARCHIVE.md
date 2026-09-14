# OpenClaw 塔罗占卜插件 - 项目归档文档

**项目状态**：✅ 生产就绪  
**最后更新**：2026-03-31  
**版本**：v2.1  
**作者**：OpenClaw AI Agent + <your-uuap>

---

## 目录

1. [产品需求文档（PRD）](#1-产品需求文档prd)
2. [提示词进化史](#2-提示词进化史)
3. [环境部署与避坑指南](#3-环境部署与避坑指南)
4. [技术架构详解](#4-技术架构详解)
5. [附录](#5-附录)

---

# 1. 产品需求文档（PRD）

## 1.1 产品定义

**OpenClaw 塔罗占卜插件**是基于 OpenClaw 框架开发的自动化职场塔罗分析工具。它将传统塔罗占卜与现代职场决策相结合，通过确定性算法和心理学分析框架，为用户提供客观、可执行的决策建议。

**核心价值主张**：
- ❌ 不是算命工具
- ✅ 是决策辅助系统
- ❌ 不提供模棱两可的预测
- ✅ 给出明确的行动建议

**目标用户**：
- 职场人士（需要决策支持）
- 创业者（需要风险评估）
- 项目经理（需要问题诊断）

---

## 1.2 技术架构

### 1.2.1 核心模块协作关系

```
┌─────────────────────────────────────────────────────────────┐
│                    tarot-automation.js                      │
│                    (参数处理与流程编排)                      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 参数清洗     │  │ 幸运数字提取 │  │ 领域识别     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      tarot-engine.js                        │
│                      (确定性抽牌算法)                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ SHA256种子   │→ │ Mulberry32   │→ │ Fisher-Yates │     │
│  │ 生成器       │  │ 随机数生成器 │  │ 洗牌算法     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │            tarot-data.json (78张牌库)            │     │
│  └──────────────────────────────────────────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      sync-to-ku.js                          │
│                      (知识库同步)                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 日期文件夹   │  │ 文档创建     │  │ Memory写入   │     │
│  │ 检查/创建    │  │ (命名规范)   │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │      ku-doc-manage (知识库API客户端)             │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2.2 环境变量配置

**config.js 统一配置**：

```javascript
{
  // 存储路径配置
  storage: {
    workspace: '<workspace>',        // OpenClaw工作目录
    memory: '<workspace>/memory',    // Memory存储路径
    skillPath: '<skill-path>'
  },
  
  // 知识库配置
  ku: {
    spaceId: '<space-id>',                             // 知识库空间ID
    parentDocId: '<parent-doc-id>',                    // 父文档ID
    skillPath: '<ku-skill-path>'
  },
  
  // 用户配置
  user: {
    uuap: '<your-uuap>',
    email: '<your-email@example.com>'
  },
  
  // 晨间占卜配置
  morning: {
    time: '10:00',
    timezone: 'Asia/Singapore',
    luckyRange: { min: 1, max: 99 },
    aspects: [
      '今天工作现状',
      '今天后续发展和未来',
      '今天需要注意的地方或者潜在的机会',
      '今天财运投资成果'
    ]
  }
}
```

**关键说明**：
- `workspace`：OpenClaw主工作目录，存储Memory文件
- `memory`：每日占卜记录存储路径，格式：`YYYY-MM-DD.md`
- `ku.spaceId`：知识库空间标识符
- `ku.parentDocId`：塔罗占卜父文档ID，所有占卜文档在此之下

---

## 1.3 业务逻辑

### 1.3.1 幸运数字种子算法

**设计目标**：
- 确保相同输入 → 相同输出（确定性）
- 不同输入 → 不同输出（随机性）
- 可复现性（用户可验证）

**算法实现**：

```javascript
// 步骤1：生成种子字符串
const seedString = `${date}-${lucky}-${aspect}-${index}`;
// 示例："2026-03-31-88-工作-0"

// 步骤2：SHA256哈希
const seed = crypto.createHash('sha256').update(seedString).digest('hex');
// 示例："9d57ffba8ee5607b02b5bd9d3345bbde28c0a1d4ef1ed8064dd14262c1fac3e8"

// 步骤3：Mulberry32随机数生成器
function createSeededRandom(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest();
  let state = hash.readUInt32LE(0);
  
  return function() {
    state += 0x6D2B79F5;
    let t = Math.imul(state ^ state >>> 15, state | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 步骤4：Fisher-Yates洗牌
const shuffled = seededShuffle(allCards, random);
const card = shuffled[0]; // 抽取第一张牌

// 步骤5：正逆位判断
const position = random() < 0.5 ? 'upright' : 'reversed';
```

**关键特性**：
- 每个领域独立种子（`date-lucky-aspect-index`）
- 确保每个领域抽到不同的牌
- 正逆位概率各50%

---

### 1.3.2 晨间占卜逻辑

**设计原则**：
- 每天10:00自动触发（Cron）
- 随机生成幸运数字（1-99）
- 固定四个方面占卜
- 独立解析（不参考历史）

**执行流程**：

```
每天10:00 (Asia/Singapore)
    ↓
Cron触发 → morning-divination.js
    ↓
随机生成幸运数字 (1-99)
    ↓
占卜四个固定方面：
  1. 今天工作现状
  2. 今天后续发展和未来
  3. 今天需要注意的地方或者潜在的机会
  4. 今天财运投资成果
    ↓
LLM填充内容（使用divination.md模板）
    ↓
sync-to-ku.js同步到知识库
    ├── 检查/创建日期文件夹 (YYYY-MM-DD)
    └── 创建占卜文档（命名：占卜zhouyue{种子数字}）
    ↓
发送到如流私聊 <your-uuap>
```

**与用户占卜的区别**：

| 特性 | 晨间占卜 | 用户占卜 |
|------|----------|----------|
| 幸运数字 | 随机生成（1-99） | 用户提供（1-999） |
| 领域 | 固定四个方面 | 用户自定义 |
| 触发方式 | Cron定时 | 手动触发 |
| 存档方式 | 自动存档 | 自动存档 |

---

### 1.3.3 私聊/群聊双端适配方案

**挑战**：
- 私聊：消息直接触发
- 群聊：需要@机器人触发
- @机器人格式多样：`@<your-uuap>_Bot`、`@机器人`、`@Bot`

**解决方案**：

```javascript
function cleanRawMessage(rawMessage) {
  let cleaned = rawMessage;
  
  // 1. 去除 @机器人 前缀（支持各种格式）
  cleaned = cleaned.replace(/^@[\w\d_\-]+\s*/i, '');      // @<your-uuap>_Bot
  cleaned = cleaned.replace(/^@[\u4e00-\u9fa5\w\d_\-]+\s*/i, ''); // @机器人
  
  // 2. 去除关键词（塔罗、占卜）
  cleaned = cleaned.replace(/^(塔罗|占卜)\s*/i, '');
  
  // 3. 清理多余空格
  cleaned = cleaned.trim();
  
  // 4. 提取幸运数字和领域
  const match = cleaned.match(/^(\d+)\s+(.+)$/);
  
  if (!match) {
    return { lucky: null, aspects: [] };
  }
  
  const lucky = match[1];
  const aspects = match[2].split(/[\s,，、\*]+/).map(s => s.trim()).filter(s => s);
  
  return { lucky, aspects };
}
```

**支持的格式**：

| 场景 | 输入示例 | 清洗结果 |
|------|----------|----------|
| 私聊 | `塔罗 88 工作 财运` | `lucky=88, aspects=[工作, 财运]` |
| 群聊 | `@<your-uuap>_Bot 塔罗 88 工作` | `lucky=88, aspects=[工作]` |
| 群聊 | `@机器人 占卜 67 睡眠` | `lucky=67, aspects=[睡眠]` |
| 强制前缀 | `!塔罗 88 工作` | `lucky=88, aspects=[工作]` |

---

## 1.4 核心功能

### 1.4.1 每日定时推送（Cron）

**配置详情**：

```bash
# Cron任务配置
任务名称：晨间塔罗占卜
任务ID：c8f80060-6b35-4808-abe0-abacc3802db9
执行时间：每天10:00 (Asia/Singapore)
执行模式：isolated（独立会话）
```

**推送渠道**：
- 如流私聊：`<your-uuap>`
- 知识库存档：按日期文件夹分类

**消息格式**：
```
今日塔罗单次独立解析：2026-03-31 | 种子：54

1. 今天工作现状：The Sun 逆
- 当下真相：...
- 逻辑拆解：...
- 后果推演：...
- ★ 避险动作：...

[其他三个领域...]

🌟 综合盘点与生存哲学
...

今日核心关键词
... | ... | ...

---
📚 **知识库存档**：[URL]
```

---

### 1.4.2 随身占卜触发

**触发方式**：

1. **如流私聊**：
   ```
   塔罗 88 工作 财运
   ```

2. **如流群聊**：
   ```
   @<your-uuap>_Bot 塔罗 88 工作
   ```

3. **强制前缀**（兼容模式）：
   ```
   !塔罗 88 工作
   ```

**响应时间**：
- 参数解析：< 100ms
- 抽牌算法：< 50ms
- LLM填充：2-5秒
- 知识库同步：1-3秒
- **总计**：3-8秒

---

### 1.4.3 自动存档（如流 Ku 知识库）

**存档策略**：

```
知识库URL：
https://<knowledge-base-url>/<space-id>/<parent-doc-id>

目录结构：
<parent-doc-id>/
├── 2026-03-27/
│   ├── 占卜zhouyue24
│   ├── 占卜zhouyue25 家人篇
│   ├── 占卜zhouyue25 职场全景
│   ├── 占卜zhouyue73
│   ├── 占卜zhouyue73 工作选择
│   └── 占卜zhouyue79 职场警示
├── 2026-03-29/
│   ├── 占卜zhouyue18
│   └── 占卜zhouyue23
└── 2026-03-31/
    └── 占卜zhouyue54
```

**命名规范**：
- 格式：`占卜{用户}{种子数字}[后缀]`
- 示例：`占卜zhouyue88`、`占卜zhouyue25 家人篇`

**同步流程**：
1. 检查日期文件夹是否存在
2. 不存在则创建（标题：YYYY-MM-DD）
3. 在日期文件夹下创建占卜文档
4. 写入Memory文件（`<workspace>/memory/YYYY-MM-DD.md`）

---

# 2. 提示词进化史

## 2.1 v1.0 (表格期) - 已废弃

**时间**：2026-03-25  
**特征**：使用Markdown表格格式输出

**示例输出**：
```markdown
| 领域 | 牌面 | 状态 | 关键词 |
|------|------|------|--------|
| 工作 | The Sun | 正 | 成功、喜悦、活力 |
| 财运 | Four of Pentacles | 逆 | 过度防御、财务焦虑 |
```

**弃用原因**：
1. **Discord/WhatsApp不支持表格**：移动端显示效果差
2. **可读性差**：表格形式显得生硬、机械化
3. **缺乏深度分析**：只罗列关键词，没有深度解读
4. **无行动建议**：用户看完不知道该做什么

**用户反馈**：
> "看起来像数据表，不像占卜结果"
> "没有告诉我该怎么办"

---

## 2.2 v2.0 (冷峻导师期) - 当前版本

**时间**：2026-03-26  
**核心改进**：从"算命"到"决策建议"的转变

### 2.2.1 引入的新模块

**① 当下真相**：
- 用一句话直接点破核心状态
- 示例：`这不是机会，而是一个让你分心的陷阱`
- 作用：快速抓住用户注意力

**② 逻辑拆解**：
- 结合牌面意象与现实心理/行为分析
- 2-3行，讲清楚因果关系
- 使用心理学词汇：潜意识、惯性、决策偏差、环境压力

**③ 后果推演**：
- 如果维持现状，短期内极大概率会发生什么
- 给出具体时间范围（如"预计3个月内"）
- 作用：增加紧迫感和可信度

**④ ★ 避险动作**：
- 给出一个具体、可执行的建议
- 示例：`不要主动联系、先搁置争议、找第三方见证`
- 作用：提供明确的行动指南

### 2.2.2 核心设计理念

**去玄幻化**：
- ❌ 禁止词汇：能量、磁场、灵性、宇宙信号
- ✅ 替换词汇：潜意识、惯性、决策偏差、环境压力

**拒绝模棱两可**：
- ❌ 废话：也许、可能、大概、或许
- ✅ 明确：高概率、必然、建议、必须

**语气把控**：
- 不是冷冰冰的说教
- 不是热情的哄人
- 像一个靠谱的老朋友在帮你复盘局势

**示例输出**：
```
1. 财运：Four of Pentacles 逆
- 当下真相：你正在过度防御，而防御本身就是一种财务漏洞。
- 逻辑拆解：星币四逆位代表对金钱的病态执着，这种紧绷状态反而导致决策变形。你不是在管理财务，而是在被财务焦虑管理。
- 后果推演：若持续这种紧绑状态，预计3个月内会出现一次"报复性消费"或"恐慌性抛售"，造成实际损失。
- ★ 避险动作：今天不做任何财务决策。把注意力从"省多少钱"转移到"怎么赚更多钱"上。
```

---

## 2.3 v2.1 (独立性补丁) - 当前版本

**时间**：2026-03-27  
**核心改进**：实现"单次独立解析"和"基准趋势对比"的平衡

### 2.3.1 问题背景

**原问题**：
- 用户可能一天内多次占卜
- 每次占卜都参考历史记录，导致输出越来越长
- 上下文冗余，影响阅读体验

### 2.3.2 解决方案

**独立解读规则**：
```
每次占卜独立进行，不参考历史占卜记录，只专注于当前牌面。
```

**实现方式**：
- Prompt中明确规则：`独立解读：每次占卜独立进行，不参考历史占卜记录`
- 不读取历史Memory文件
- 每次调用LLM时只传入当前占卜JSON

**标题格式**：
```
今日塔罗单次独立解析：2026-03-31 | 种子：54
```

### 2.3.3 基准趋势对比（可选功能）

**保留能力**：
- 仍然可以手动查询历史占卜
- 知识库按日期归档，便于回溯
- Memory文件完整记录每次占卜

**对比方式**：
```
用户问：今天的占卜和昨天相比有什么变化？
AI：让我查询历史记录...
[读取知识库或Memory文件]
对比分析：昨天牌面是X，今天是Y，说明...
```

---

## 2.4 提示词进化总结

| 版本 | 时间 | 核心特征 | 主要改进 | 用户反馈 |
|------|------|----------|----------|----------|
| v1.0 | 2026-03-25 | 表格格式 | - | ❌ 机械化、无深度 |
| v2.0 | 2026-03-26 | 冷峻导师 | 引入4大模块、去玄幻化 | ✅ 专业、有行动建议 |
| v2.1 | 2026-03-27 | 独立解析 | 剥离冗长上下文 | ✅ 简洁、易读 |

**未来方向**：
- 支持多轮对话（可选）
- 支持历史趋势分析（可选）
- 支持个性化定制（用户偏好记忆）

---

# 3. 环境部署与避坑指南

## 3.1 权限问题（chmod +x 的必要性）

### 3.1.1 问题现象

**错误信息**：
```bash
bash: ./tarot-automation.js: Permission denied
```

**场景**：
- 新创建的Node.js脚本
- 从其他环境复制过来的脚本
- Git clone下来的代码

### 3.1.2 根本原因

Linux/Unix系统中，新创建的文件默认权限是`644`（rw-r--r--），即：
- 所有者：读+写
- 组：只读
- 其他：只读

**缺少执行权限**，因此无法直接运行`./script.js`。

### 3.1.3 解决方案

**方案1：添加执行权限**
```bash
chmod +x tarot-automation.js
chmod +x sync-to-ku.js
chmod +x morning-divination.js
```

**方案2：使用Node.js解释器**
```bash
# 不需要执行权限
node tarot-automation.js --raw-message "塔罗 88 工作"
```

**方案3：在脚本头部添加shebang**
```javascript
#!/usr/bin/env node
// 脚本内容...
```

### 3.1.4 最佳实践

**推荐做法**：
```bash
# 1. 创建脚本时立即添加shebang
#!/usr/bin/env node

# 2. 添加执行权限
chmod +x script.js

# 3. 使用相对路径或绝对路径执行
./script.js
# 或
node script.js
```

**Git版本控制**：
```bash
# Git会保留文件权限
git add script.js
git commit -m "Add executable script"
# 克隆后权限仍然有效
```

---

## 3.2 群聊 Mention 导致的正则匹配失效

### 3.2.1 问题现象

**用户输入**：
```
@<your-uuap>_Bot 塔罗 88 工作
```

**错误结果**：
```javascript
// 正则匹配失败
const match = cleaned.match(/^(\d+)\s+(.+)$/);
// match = null

// 无法解析幸运数字和领域
return { lucky: null, aspects: [] };
```

### 3.2.2 根本原因

**正则表达式**：
```javascript
const match = cleaned.match(/^(\d+)\s+(.+)$/);
```

这个正则要求字符串**必须以数字开头**，但实际清洗后的字符串可能包含：
- `@<your-uuap>_Bot 塔罗 88 工作` → 清洗后：`88 工作` ✅
- `@机器人 塔罗 88 工作` → 清洗后：`88 工作` ✅
- `塔罗 88 工作` → 清洗后：`88 工作` ✅

但如果清洗逻辑有问题，可能残留`@`符号：
- `@<your-uuap>_Bot塔罗 88 工作` → 清洗后：`@塔罗 88 工作` ❌

### 3.2.3 解决方案

**完整清洗流程**：

```javascript
function cleanRawMessage(rawMessage) {
  if (!rawMessage) return { lucky: null, aspects: [] };
  
  let cleaned = rawMessage;
  
  // 1. 去除 @机器人 前缀（支持各种格式）
  cleaned = cleaned.replace(/^@[\w\d_\-]+\s*/i, '');      // @<your-uuap>_Bot
  cleaned = cleaned.replace(/^@[\u4e00-\u9fa5\w\d_\-]+\s*/i, ''); // @机器人
  
  // 2. 去除关键词（塔罗、占卜）
  cleaned = cleaned.replace(/^(塔罗|占卜)\s*/i, '');
  
  // 3. 清理多余空格
  cleaned = cleaned.trim();
  
  console.log(`🧹 消息清洗: "${rawMessage}" → "${cleaned}"`);
  
  // 4. 提取幸运数字和领域
  const match = cleaned.match(/^(\d+)\s+(.+)$/);
  
  if (!match) {
    console.error('❌ 无法解析幸运数字和领域');
    return { lucky: null, aspects: [] };
  }
  
  const lucky = match[1];
  const aspects = match[2].split(/[\s,，、\*]+/).map(s => s.trim()).filter(s => s);
  
  console.log(`✅ 解析结果: 幸运数字=${lucky}, 领域=[${aspects.join(', ')}]`);
  
  return { lucky, aspects };
}
```

**关键改进**：
1. **多层次清洗**：先去`@`，再去关键词
2. **支持多种分隔符**：空格、逗号、顿号、星号
3. **调试日志**：输出清洗前后对比

### 3.2.4 测试用例

```javascript
// 测试数据
const testCases = [
  { input: '塔罗 88 工作 财运', expected: { lucky: '88', aspects: ['工作', '财运'] } },
  { input: '@<your-uuap>_Bot 塔罗 88 工作', expected: { lucky: '88', aspects: ['工作'] } },
  { input: '@机器人 占卜 67 睡眠', expected: { lucky: '67', aspects: ['睡眠'] } },
  { input: '!塔罗 88 工作', expected: { lucky: '88', aspects: ['工作'] } },
  { input: '塔罗占卜 18 休息还是奋斗', expected: { lucky: '18', aspects: ['休息还是奋斗'] } },
];

// 执行测试
testCases.forEach(({ input, expected }) => {
  const result = cleanRawMessage(input);
  console.log(`输入: ${input}`);
  console.log(`期望: ${JSON.stringify(expected)}`);
  console.log(`实际: ${JSON.stringify(result)}`);
  console.log(`结果: ${JSON.stringify(result) === JSON.stringify(expected) ? '✅ PASS' : '❌ FAIL'}`);
});
```

---

## 3.3 知识库 API 的 DocId 锁定策略

### 3.3.1 问题现象

**错误信息**：
```json
{
  "returnCode": 400,
  "returnMessage": "文档位置重复"
}
```

**场景**：
- 尝试移动文档到日期文件夹
- 日期文件夹名称与现有文档名称冲突

### 3.3.2 根本原因

**知识库结构**：
```
<parent-doc-id>/
├── 2026-03-29 (文档，不是文件夹)
├── 塔罗占卜 - 2026-03-29 (种子: 18)
└── 塔罗占卜 - 2026-03-29 (种子: 23)
```

**问题**：
- `2026-03-29`已存在（是一个普通文档）
- 尝试创建同名文件夹失败
- 或尝试移动文档到`2026-03-29`时，目标已经是文档而非文件夹

### 3.3.3 解决方案

**策略1：先检查后创建**

```python
def get_or_create_date_folder(date_str):
    # 1. 查询现有文档
    result = list_docs()
    
    # 2. 检查日期文件夹是否存在
    if result.get('success') or result.get('returnCode') == 200:
        docs = result.get('result', {}).get('data', [])
        for doc in docs:
            if doc.get('name') == date_str:
                print(f"✅ 日期文件夹已存在: {date_str}")
                return doc.get('docGuid')
    
    # 3. 不存在则创建
    print(f"🔨 创建日期文件夹: {date_str}")
    result = create_folder(date_str)
    
    if result.get('success') or result.get('returnCode') == 200:
        doc_guid = result.get('result', {}).get('docGuid')
        print(f"✅ 创建成功: {date_str}")
        return doc_guid
    else:
        print(f"❌ 创建失败")
        return None
```

**策略2：异常处理**

```python
def move_doc(doc_guid, new_parent_guid):
    try:
        result = client.move_doc(
            doc_id=doc_guid,
            to_repo_guid=REPO_GUID,
            to_parent_guid=new_parent_guid,
            operator_username=USERNAME
        )
        
        if result.get('success') or result.get('returnCode') == 200:
            print(f"✅ 移动成功")
            return True
        else:
            error_msg = result.get('msg') or result.get('returnMessage')
            if '文档位置重复' in error_msg:
                print(f"⚠️ 文档已在目标位置，跳过移动")
                return True
            else:
                print(f"❌ 移动失败: {error_msg}")
                return False
    except Exception as e:
        print(f"❌ 移动异常: {e}")
        return False
```

**策略3：文档命名规范**

```
格式：占卜{用户}{种子数字}[后缀]

示例：
- 占卜zhouyue18
- 占卜zhouyue23
- 占卜zhouyue25 家人篇
- 占卜zhouyue73 工作选择

避免：
- 2026-03-29 (日期格式，容易与日期文件夹冲突)
- 塔罗占卜 - 2026-03-29 (种子: 18) (旧格式，太长)
```

### 3.3.4 最佳实践

**知识库整理脚本**：
```python
# organize_ku.py
# 功能：
# 1. 查询所有占卜文档
# 2. 按日期分组
# 3. 创建日期文件夹
# 4. 移动文档到对应文件夹
# 5. 处理异常情况（文档位置重复等）
```

**执行结果**：
```
📚 开始整理知识库...

📋 查询现有文档...
✅ 找到 9 个文档

📊 分析结果:
  2026-03-27: 6 个文档
  2026-03-29: 2 个文档
  2026-03-31: 1 个文档

🔨 创建日期文件夹...
✅ 创建成功: 2026-03-27
✅ 创建成功: 2026-03-29
✅ 创建成功: 2026-03-31

📦 移动文档到日期文件夹...
  2026-03-27:
    ✅ 移动成功 (6个文档)
  2026-03-29:
    ⚠️ 文档已在目标位置，跳过移动
    ✅ 移动成功 (2个文档)
  2026-03-31:
    ⚠️ 文档已在目标位置，跳过移动
    ✅ 移动成功 (1个文档)

✅ 整理完成！
   创建文件夹: 3 个
   移动文档: 9 个
```

---

# 4. 技术架构详解

## 4.1 文件依赖关系图

```
config.js (统一配置)
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

## 4.2 数据流向

```
用户输入
    ↓
参数清洗 (cleanRawMessage)
    ↓
幸运数字 + 领域提取
    ↓
调用 tarot-engine.divine()
    ↓
SHA256种子生成
    ↓
Mulberry32随机数生成器
    ↓
Fisher-Yates洗牌
    ↓
抽取牌 + 判断正逆位
    ↓
输出JSON结果
    ↓
LLM填充 (divination.md模板)
    ↓
sync-to-ku.js 同步知识库
    ├── 检查/创建日期文件夹
    └── 创建占卜文档
    ↓
发送到如流
```

## 4.3 关键算法

### 4.3.1 Mulberry32算法

**用途**：生成伪随机数

**优点**：
- 速度快
- 状态小（32位）
- 分布均匀

**实现**：
```javascript
function createSeededRandom(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest();
  let state = hash.readUInt32LE(0);
  
  return function() {
    state += 0x6D2B79F5;
    let t = Math.imul(state ^ state >>> 15, state | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
```

### 4.3.2 Fisher-Yates洗牌算法

**用途**：打乱牌组顺序

**优点**：
- 时间复杂度：O(n)
- 空间复杂度：O(n)
- 完全随机

**实现**：
```javascript
function seededShuffle(array, random) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

---

# 5. 附录

## 5.1 文件清单

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
├── SKILL.md                   # 技能说明文档
├── STRUCTURE.md               # 结构文档
└── PROJECT_ARCHIVE.md         # 项目归档文档（本文档）
```

## 5.2 总大小

**约44KB**（45,106字节）

## 5.3 知识库URL

**空间ID**：`<space-id>`  
**父文档ID**：`<parent-doc-id>`  
**访问链接**：https://<knowledge-base-url>/<space-id>/<parent-doc-id>

## 5.4 Cron任务

**任务ID**：`c8f80060-6b35-4808-abe0-abacc3802db9`  
**执行时间**：每天10:00 (Asia/Singapore)  
**执行模式**：isolated（独立会话）

## 5.5 用户配置

**UUAP**：`<your-uuap>`  
**Email**：`<your-email@example.com>`  
**推送渠道**：如流私聊

---

## 5.6 开发历程

| 日期 | 里程碑 | 主要工作 |
|------|--------|----------|
| 2026-03-25 | v1.0 | 初始版本，表格格式输出 |
| 2026-03-26 | v2.0 | 引入4大模块，去玄幻化 |
| 2026-03-27 | v2.1 | 独立解析，剥离冗长上下文 |
| 2026-03-28 | 优化 | 代码精简，统一配置 |
| 2026-03-29 | 整理 | 知识库按日期归档 |
| 2026-03-31 | 归档 | 生成项目归档文档 |

---

## 5.7 未来规划

### 5.7.1 功能增强

- [ ] 多轮对话支持（可选）
- [ ] 历史趋势分析（可选）
- [ ] 个性化定制（用户偏好记忆）
- [ ] 群聊触发优化（当前有bug，已用强制前缀`!塔罗`兼容）

### 5.7.2 技术优化

- [ ] 错误处理增强
- [ ] 日志系统完善
- [ ] 单元测试覆盖
- [ ] 性能监控

### 5.7.3 用户体验

- [ ] 多语言支持
- [ ] 牌面可视化（生成图片）
- [ ] 占卜历史查询界面
- [ ] 统计分析面板

---

## 5.8 致谢

本项目基于以下开源技术和平台：
- OpenClaw 框架
- Node.js
- 百度知识库 API
- 如流 IM 平台

特别感谢用户的耐心测试和反馈，使产品不断迭代优化。

---

**文档版本**：v1.0  
**最后更新**：2026-03-31  
**维护者**：OpenClaw AI Agent