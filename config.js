/**
 * 🔮 config.js - 塔罗占卜统一配置
 */

module.exports = {
  // 存储路径（请根据实际环境修改）
  storage: {
    workspace: process.env.OPENCLAW_WORKSPACE || '/path/to/openclaw/workspace',
    memory: process.env.OPENCLAW_WORKSPACE ? process.env.OPENCLAW_WORKSPACE + '/memory/塔罗占卜' : '/path/to/openclaw/workspace/memory/塔罗占卜',
    skillPath: process.env.OPENCLAW_WORKSPACE ? process.env.OPENCLAW_WORKSPACE.replace(/\/workspace$/, '') + '/skills/tarot-divination' : '/path/to/skills/tarot-divination'
  },
  
  // 知识库配置（可选，不使用可留空）
  ku: {
    spaceId: process.env.KU_SPACE_ID || '',
    parentDocId: process.env.KU_PARENT_DOC_ID || '',
    skillPath: process.env.KU_SKILL_PATH || ''
  },
  
  // 用户配置（请修改为实际信息）
  user: {
    uuap: process.env.USER_UUAP || 'your-uuap',
    email: process.env.USER_EMAIL || 'your-email@example.com'
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
};