#!/usr/bin/env node
/**
 * 🔮 tarot-automation.js - OpenClaw 塔罗占卜自动化脚本（精简版）
 * 
 * 整合：
 * 1. 抽牌引擎
 * 2. LLM 解析（使用 divination.md 提示词）
 * 3. 如流消息推送
 * 4. 知识库同步
 * 
 * Usage:
 *   node tarot-automation.js --raw-message "塔罗 88 工作 财运" --user <your-uuap>
 */

const tarotEngine = require('./tarot-engine.js');
const config = require('./config.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 强化参数清洗（去除 @机器人、关键词等）
 */
function cleanRawMessage(rawMessage) {
  if (!rawMessage) return { lucky: null, aspects: [] };
  
  let cleaned = rawMessage;
  
  // 1. 去除 @机器人 前缀
  cleaned = cleaned.replace(/^@[\w\d_\-]+\s*/i, '');
  cleaned = cleaned.replace(/^@[\u4e00-\u9fa5\w\d_\-]+\s*/i, '');
  
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
  const aspectsStr = match[2];
  
  // 5. 分割领域
  const aspects = aspectsStr
    .split(/[\s,，、\*]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  console.log(`✅ 解析结果: 幸运数字=${lucky}, 领域=[${aspects.join(', ')}]`);
  
  return { lucky, aspects };
}

/**
 * 获取当前日期（YYYY-MM-DD）
 */
function getToday() {
  return new Date().toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
}

/**
 * 生成随机幸运数字（用于晨间占卜）
 */
function generateRandomLuckyNumber(min = 1, max = 99) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  let lucky, aspects, user;
  
  // 解析参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--raw-message') {
      const parsed = cleanRawMessage(args[i + 1]);
      lucky = parsed.lucky;
      aspects = parsed.aspects;
      i++;
    } else if (args[i] === '--user') {
      user = args[i + 1];
      i++;
    } else if (args[i] === '--lucky') {
      lucky = args[i + 1];
      i++;
    } else if (args[i] === '--aspects') {
      aspects = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (args[i] === '--morning') {
      // 晨间占卜模式：随机生成幸运数字，使用固定四个方面
      lucky = generateRandomLuckyNumber();
      aspects = config.morning.aspects;
      console.log(`🌅 晨间占卜模式: 随机幸运数字=${lucky}`);
    }
  }
  
  if (!lucky || !aspects || aspects.length === 0) {
    console.error('❌ 参数不完整');
    console.error('Usage:');
    console.error('  node tarot-automation.js --raw-message "塔罗 88 工作 财运"');
    console.error('  node tarot-automation.js --morning --user <your-uuap>');
    process.exit(1);
  }
  
  const date = getToday();
  
  console.log(`\n🔮 执行个性化占卜: ${date}`);
  console.log(`   幸运数字: ${lucky}`);
  console.log(`   领域: ${aspects.join(', ')}\n`);
  
  // 执行占卜
  const divinationResult = tarotEngine.divine({
    date,
    lucky,
    aspects
  });
  
  if (!divinationResult || !divinationResult.aspects) {
    console.error('❌ 占卜失败');
    process.exit(1);
  }
  
  console.log('--- TAROT_RESULT ---');
  console.log(JSON.stringify(divinationResult, null, 2));
  
  console.log('\n--- DIVINATION_RESULT ---');
  console.log(JSON.stringify({ success: true, result: divinationResult }, null, 2));
}

main();