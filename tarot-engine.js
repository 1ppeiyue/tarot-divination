#!/usr/bin/env node
/**
 * 🔮 tarot-engine.js - OpenClaw 塔罗占卜引擎
 * 
 * 基于种子的确定性抽牌算法，确保结果可复现
 * 
 * Usage:
 *   node tarot-engine.js --date "2026-03-19" --lucky 88 --aspects "工作,财运"
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 牌库数据路径
const TAROT_DATA_PATH = path.join(__dirname, 'tarot-data.json');

/**
 * 使用种子初始化伪随机数生成器（Mulberry32算法）
 * @param {string} seed - 种子字符串
 * @returns {function} - 返回 [0, 1) 范围的随机数生成器
 */
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

/**
 * Fisher-Yates 洗牌算法（种子版本）
 * @param {Array} array - 待洗牌数组
 * @param {function} random - 随机数生成器
 * @returns {Array} - 洗牌后的新数组
 */
function seededShuffle(array, random) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 加载塔罗牌库数据
 * @returns {Object} - 牌库数据
 */
function loadTarotData() {
  try {
    const data = fs.readFileSync(TAROT_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ 无法加载牌库数据: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 执行占卜
 * @param {Object} options - 占卜参数
 * @param {string} options.date - 日期 (YYYY-MM-DD)
 * @param {string|number} options.lucky - 幸运数字
 * @param {string[]} options.aspects - 关注领域列表
 * @returns {Object} - 占卜结果
 */
function divine(options) {
  const { date, lucky, aspects } = options;
  
  // 加载牌库
  const tarotData = loadTarotData();
  const allCards = [...tarotData.major_arcana, ...tarotData.minor_arcana];
  
  // 🔮 核心改动：一次性洗牌，模拟真实抽牌不放回
  // 生成种子：日期 + 幸运数字（确保同一天同一数字结果一致）
  const seedString = `${date}-${lucky}`;
  const random = createSeededRandom(seedString);
  
  // 洗牌（只洗一次）
  const shuffled = seededShuffle(allCards, random);
  
  // 为每个领域依次抽取牌（不放回）
  const results = aspects.map((aspect, index) => {
    // 依次取牌：第 index 张牌给第 index 个领域
    const card = shuffled[index];
    
    // 判断正逆位（继续使用同一个随机序列，保证确定性）
    const position = random() < 0.5 ? 'upright' : 'reversed';
    
    // 生成单个结果的种子标识（用于调试）
    const cardSeed = crypto.createHash('sha256').update(`${seedString}-${index}`).digest('hex');
    
    return {
      aspect,
      card: {
        name: card.name,
        arcana: card.arcana,
        suit: card.suit || null,
        number: card.number || null,
        position,
        keywords: position === 'upright' ? card.keywords.upright : card.keywords.reversed
      },
      seed: cardSeed
    };
  });
  
  return {
    date,
    lucky_number: lucky,
    aspects: results,
    total_seed: crypto.createHash('sha256').update(`${date}-${lucky}`).digest('hex').substring(0, 16)
  };
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      // 检查下一个参数是否是值（不是另一个选项）
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        params[key] = args[++i];
      } else if (arg.includes('=')) {
        // 支持 --key=value 格式
        const [k, v] = arg.slice(2).split('=');
        params[k] = v;
      } else {
        params[key] = true;
      }
    }
  }
  
  // 验证必要参数
  if (!params.date) {
    console.error('❌ 缺少必要参数: --date');
    console.error('用法: node tarot-engine.js --date YYYY-MM-DD [--lucky 数字] [--aspects 领域1,领域2]');
    process.exit(1);
  }
  
  if (!params.lucky) {
    params.lucky = '0'; // 默认基准占卜
  }
  
  if (!params.aspects) {
    params.aspects = '今日职场大势'; // 默认领域
  }
  
  // 解析领域列表
  const aspects = params.aspects.split(',').map(s => s.trim());
  
  // 执行占卜
  const result = divine({
    date: params.date,
    lucky: params.lucky,
    aspects
  });
  
  // 输出 JSON 结果
  console.log(JSON.stringify(result, null, 2));
}

// 导出函数供其他模块使用
module.exports = {
  divine,
  createSeededRandom,
  seededShuffle,
  loadTarotData
};

// CLI 执行
if (require.main === module) {
  main();
}
