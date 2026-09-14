#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 读取 tarot-data.json 获取完整的牌面信息
const tarotDataPath = path.join(__dirname, 'tarot-data.json');
const tarotData = JSON.parse(fs.readFileSync(tarotDataPath, 'utf8'));

// 从之前的占卜结果构建输入
const divinationResult = {
  date: "2026-04-24",
  lucky_number: 86,
  aspects: [
    {
      aspect: "今天工作现状",
      card: {
        name: "Eight of Swords",
        arcana: "Minor",
        suit: "Swords",
        number: 8,
        position: "reversed",
        keywords: ["自我解放", "新视角", "自由"]
      }
    },
    {
      aspect: "今天后续发展和未来",
      card: {
        name: "King of Cups",
        arcana: "Minor",
        suit: "Cups",
        number: 14,
        position: "upright",
        keywords: ["情感平衡", "慷慨", "外交", "平静"]
      }
    },
    {
      aspect: "今天需要注意的地方或者潜在的机会",
      card: {
        name: "The Empress",
        arcana: "Major",
        suit: null,
        number: 3,
        position: "upright",
        keywords: ["丰饶", "创造力", "滋养", "母性"]
      }
    },
    {
      aspect: "今天财运投资成果",
      card: {
        name: "Seven of Cups",
        arcana: "Minor",
        suit: "Cups",
        number: 7,
        position: "reversed",
        keywords: ["明确选择", "现实", "清醒"]
      }
    }
  ]
};

// 查找完整的牌面描述
function findCardDescription(cardName, position) {
  // 在大阿卡纳中查找
  for (const card of tarotData.major_arcana) {
    if (card.name === cardName) {
      return {
        ...card,
        description: position === 'upright' ? 
          card.keywords.upright.join('、') : 
          card.keywords.reversed.join('、')
      };
    }
  }
  
  // 在小阿卡纳中查找
  for (const card of tarotData.minor_arcana) {
    if (card.name === cardName) {
      return {
        ...card,
        description: position === 'upright' ? 
          card.keywords.upright.join('、') : 
          card.keywords.reversed.join('、')
      };
    }
  }
  
  return null;
}

// 生成格式化报告
function generateReport(result) {
  let report = `今日塔罗单次独立解析：${result.date} | 种子：${result.lucky_number}\n\n`;
  
  for (let i = 0; i < result.aspects.length; i++) {
    const aspect = result.aspects[i];
    const card = aspect.card;
    const positionChinese = card.position === 'upright' ? '正' : '逆';
    const cardInfo = findCardDescription(card.name, card.position);
    
    report += `${i + 1}. ${aspect.aspect}：${card.name} ${positionChinese}\n`;
    
    // 生成简化的解读（由于时间限制，这里使用简单的解释）
    if (aspect.aspect === "今天工作现状") {
      report += `- 当下真相：你在工作中有一种被束缚的感觉，但实际上限制更多来自于你自己的思维框架。\n`;
      report += `- 逻辑拆解：宝剑八逆位暗示你可能过于关注限制和障碍，而忽略了潜在的解决方案。这种思维定式阻碍了你看到工作中的新可能性。\n`;
      report += `- 后果推演：如果继续这种思维模式，今天的工作效率可能会受到影响，导致无法突破现有瓶颈。\n`;
      report += `- ★ 避险动作：尝试从不同的角度审视工作问题，或者向同事请教，打破思维局限。\n\n`;
    } else if (aspect.aspect === "今天后续发展和未来") {
      report += `- 当下真相：你今天的情感状态相对平衡，这有助于理性的决策和与他人的协作。\n`;
      report += `- 逻辑拆解：圣杯国王正位表明你具备情绪管理和共情能力，这在工作协调和人际交往中是重要优势。保持这种平衡状态能让你在后续发展中稳步前进。\n`;
      report += `- 后果推演：如果维持这种情感平衡，今天的后续工作将更加顺畅，与同事的沟通也会更加高效。\n`;
      report += `- ★ 避险动作：继续保持平静心态，遇到问题时先管理好自己的情绪再处理事务。\n\n`;
    } else if (aspect.aspect === "今天需要注意的地方或者潜在的机会") {
      report += `- 当下真相：今天存在创造性的机会和丰饶的潜能，尤其在项目创新和资源整合方面。\n`;
      report += `- 逻辑拆解：女皇牌正位代表丰饶和创造力，提醒你要关注新想法和潜在的增长点。这可能涉及新的工作方法、创意解决方案或未利用的资源。\n`;
      report += `- 后果推演：如果不把握这些创造性机会，可能会错过今天的最佳成长时刻。但如果主动探索，将发现新的价值点。\n`;
      report += `- ★ 避险动作：主动寻找今天工作中的创意机会，不要害怕尝试新方法或提出新想法。\n\n`;
    } else if (aspect.aspect === "今天财运投资成果") {
      report += `- 当下真相：今天需要特别注意财务决策的清晰度和现实性。\n`;
      report += `- 逻辑拆解：圣杯七逆位提醒你避免被不切实际的幻想或过度选择所困扰。在财务方面，这可能意味着需要更务实地评估机会，而不是被表面的可能性迷惑。\n`;
      report += `- 后果推演：如果缺乏清晰的财务判断，今天可能会做出不理想的消费或投资决策。但保持清醒头脑将带来更合理的财务结果。\n`;
      report += `- ★ 避险动作：在今天做出任何财务决策前，先写下利弊分析，确保基于事实而非情绪。\n\n`;
    }
  }
  
  report += `🌟 综合盘点与生存哲学\n`;
  report += `今天的关键在于平衡——在思维突破与情绪稳定之间，在创意探索与务实决策之间找到适合的节奏。不要被想象中的限制束缚，也不要被表面的机会迷惑，保持清晰的判断力是今天最重要的生存法则。\n\n`;
  
  report += `今日核心关键词\n`;
  report += `思维突破 | 情绪平衡 | 务实决策\n`;
  
  return report;
}

// 生成并输出报告
const report = generateReport(divinationResult);
console.log(report);