#!/usr/bin/env node
/**
 * morning-divination.js - 晨间占卜脚本
 * 
 * 每天10点自动执行，随机生成幸运数字，占卜四个固定方面
 * 
 * Usage:
 *   node morning-divination.js
 */

const tarotEngine = require('./tarot-engine.js');
const config = require('./config.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 获取当前日期（YYYY-MM-DD）
 */
function getToday() {
  return new Date().toLocaleDateString('zh-CN', {
    timeZone: config.morning.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
}

/**
 * 生成随机幸运数字
 */
function generateRandomLuckyNumber() {
  const min = config.morning.luckyRange.min;
  const max = config.morning.luckyRange.max;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 执行占卜
 */
function performDivination() {
  const date = getToday();
  const lucky = generateRandomLuckyNumber();
  const aspects = config.morning.aspects;
  
  console.log(`\n🌅 晨间占卜: ${date}`);
  console.log(`   幸运数字: ${lucky}`);
  console.log(`   领域: ${aspects.join(', ')}\n`);
  
  // 执行占卜 (使用 divine 函数)
  const divinationResult = tarotEngine.divine({
    date,
    lucky,
    aspects
  });
  
  if (!divinationResult || !divinationResult.aspects) {
    console.error('❌ 占卜失败');
    return null;
  }
  
  console.log('--- TAROT_RESULT ---');
  console.log(JSON.stringify(divinationResult, null, 2));
  
  return {
    date,
    lucky,
    aspects,
    result: divinationResult
  };
}

/**
 * 主函数
 */
function main() {
  const divination = performDivination();
  
  if (!divination) {
    process.exit(1);
  }
  
  console.log('\n--- DIVINATION_RESULT ---');
  console.log(JSON.stringify({ success: true, ...divination }, null, 2));
}

main();