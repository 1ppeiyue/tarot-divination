#!/usr/bin/env node
/**
 * sync-to-ku.js - 同步填充后的塔罗报告到知识库（支持按日期创建文件夹）
 * 
 * Usage:
 *   node sync-to-ku.js --date "2026-03-29" --user "zhouyue" --lucky "88" --title "标题" --content "完整内容"
 */

const config = require('./config.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 创建或获取日期文件夹
 */
function createOrGetDateFolder(date) {
  try {
    const kuApiPath = path.join(config.ku.skillPath, 'scripts', 'ku_api_client.py');
    
    // 检查日期文件夹是否存在
    const listScript = path.join(config.storage.workspace, 'temp_ku_list.py');
    const listCode = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, '${config.ku.skillPath}')
from scripts.ku_api_client import KuApiClient
import json

client = KuApiClient()
result = client.query_repo(
    repo_id='${config.ku.spaceId}',
    parent_doc_guid='${config.ku.parentDocId}',
    page_num=1,
    page_size=100
)
print(json.dumps(result, ensure_ascii=False))
`;
    
    fs.writeFileSync(listScript, listCode, 'utf8');
    
    let listResult;
    try {
      listResult = execSync(`python3 ${listScript}`, { encoding: 'utf8', timeout: 30000 });
    } catch (error) {
      console.error(`❌ 查询知识库失败: ${error.message}`);
      throw error;
    } finally {
      if (fs.existsSync(listScript)) {
        fs.unlinkSync(listScript);
      }
    }
    
    // 解析返回结果
    let listData;
    try {
      // 只解析最后一行JSON（忽略日志输出）
      const lines = listResult.trim().split('\n');
      let jsonLine = '';
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith('{')) {
          jsonLine = lines[i];
          break;
        }
      }
      
      if (!jsonLine) {
        throw new Error('无法从返回结果中提取JSON');
      }
      
      listData = JSON.parse(jsonLine);
    } catch (error) {
      console.error(`❌ 解析JSON失败: ${error.message}`);
      console.error(`返回内容: ${listResult}`);
      throw error;
    }
    
    // 查找日期文件夹
    if (listData.result && listData.result.data) {
      for (const doc of listData.result.data) {
        if (doc.name === date) {
          console.log(`✅ 找到日期文件夹: ${date} (${doc.docGuid})`);
          return doc.docGuid;
        }
      }
    }
    
    // 创建日期文件夹
    const createScript = path.join(config.storage.workspace, 'temp_ku_create.py');
    const createCode = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, '${config.ku.skillPath}')
from scripts.ku_api_client import KuApiClient
import json

client = KuApiClient()
result = client.create_doc(
    repository_guid='${config.ku.spaceId}',
    creator_username='${config.user.uuap}',
    parent_doc_guid='${config.ku.parentDocId}',
    title='${date}',
    content='# ${date} 占卜记录',
    create_mode=2
)
print(json.dumps(result, ensure_ascii=False))
`;
    
    fs.writeFileSync(createScript, createCode, 'utf8');
    
    let createResult;
    try {
      createResult = execSync(`python3 ${createScript}`, { encoding: 'utf8', timeout: 30000 });
    } catch (error) {
      console.error(`❌ 创建文件夹失败: ${error.message}`);
      throw error;
    } finally {
      if (fs.existsSync(createScript)) {
        fs.unlinkSync(createScript);
      }
    }
    
    // 解析返回结果
    let createData;
    try {
      const lines = createResult.trim().split('\n');
      let jsonLine = '';
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith('{')) {
          jsonLine = lines[i];
          break;
        }
      }
      
      if (!jsonLine) {
        throw new Error('无法从返回结果中提取JSON');
      }
      
      createData = JSON.parse(jsonLine);
    } catch (error) {
      console.error(`❌ 解析JSON失败: ${error.message}`);
      console.error(`返回内容: ${createResult}`);
      throw error;
    }
    
    if (createData.success || createData.returnCode === 200) {
      const folderGuid = createData.result.docGuid;
      console.log(`✅ 创建日期文件夹: ${date} (${folderGuid})`);
      return folderGuid;
    } else {
      throw new Error('创建日期文件夹失败: ' + (createData.msg || createData.returnMessage));
    }
  } catch (error) {
    console.error(`❌ 创建日期文件夹异常: ${error.message}`);
    throw error;
  }
}

/**
 * 同步到知识库
 */
function syncToKu(date, user, lucky, title, content) {
  try {
    // 1. 创建或获取日期文件夹
    const dateFolderGuid = createOrGetDateFolder(date);
    
    // 2. 在日期文件夹下创建占卜文档
    const tempScript = path.join(config.storage.workspace, 'temp_ku_sync.py');
    const pythonCode = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, '${config.ku.skillPath}')
from scripts.ku_api_client import KuApiClient
import json

client = KuApiClient()
result = client.create_doc(
    repository_guid='${config.ku.spaceId}',
    creator_username='${config.user.uuap}',
    parent_doc_guid='${dateFolderGuid}',
    title='${title}',
    content=${JSON.stringify(content)},
    create_mode=2
)
print(json.dumps(result, ensure_ascii=False))
`;
    
    fs.writeFileSync(tempScript, pythonCode, 'utf8');
    
    const result = execSync(`python3 ${tempScript}`, {
      encoding: 'utf8',
      timeout: 30000
    });
    
    fs.unlinkSync(tempScript);
    
    const lines = result.trim().split('\n');
    let jsonLine = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith('{')) {
        jsonLine = lines[i];
        break;
      }
    }
    
    if (!jsonLine) {
      throw new Error('无法解析知识库响应');
    }
    
    const response = JSON.parse(jsonLine);
    
    if (response.success || response.returnCode === 200) {
      const url = response.result?.url || `https://<knowledge-base-url>/<space-id>/${response.result?.docGuid}`;
      console.log(`✅ 已同步到知识库: ${url}`);
      return { success: true, docGuid: response.result?.docGuid, url };
    } else {
      console.error(`❌ 知识库同步失败: ${response.msg || response.returnMessage}`);
      return { success: false, error: response.msg || response.returnMessage };
    }
  } catch (error) {
    console.error(`❌ 知识库同步异常: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 写入 memory
 */
function writeToMemory(date, content) {
  // 修改为 tarot_YYYY-MM-DD.md 格式
  const memoryPath = path.join(config.storage.memory, `tarot_${date}.md`);
  const memoryDir = path.dirname(memoryPath);
  
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }
  
  // 覆盖写入，不追加
  fs.writeFileSync(memoryPath, content, 'utf8');
  console.log(`✅ 已写入 memory: ${memoryPath}`);
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  let date, user, lucky, title, content, contentFile;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date') {
      date = args[i + 1];
      i++;
    } else if (args[i] === '--user') {
      user = args[i + 1];
      i++;
    } else if (args[i] === '--lucky') {
      lucky = args[i + 1];
      i++;
    } else if (args[i] === '--title') {
      title = args[i + 1];
      i++;
    } else if (args[i] === '--content') {
      content = args[i + 1];
      i++;
    } else if (args[i] === '--content-file') {
      contentFile = args[i + 1];
      i++;
    }
  }
  
  // 如果提供了 content-file，从文件读取内容
  if (contentFile && !content) {
    try {
      content = fs.readFileSync(contentFile, 'utf8');
      console.log(`✅ 已从文件读取内容: ${contentFile}`);
    } catch (error) {
      console.error(`❌ 读取文件失败: ${error.message}`);
      process.exit(1);
    }
  }
  
  if (!date || !title || !content) {
    console.error('❌ 参数不完整');
    console.error('Usage: node sync-to-ku.js --date "2026-03-29" --user "zhouyue" --lucky "88" --title "标题" --content "内容"');
    console.error('   或: node sync-to-ku.js --date "2026-03-29" --user "zhouyue" --lucky "88" --title "标题" --content-file "/path/to/content.md"');
    process.exit(1);
  }
  
  // 如果没有提供user和lucky，从title中提取
  if (!user || !lucky) {
    const match = title.match(/占卜.*?(\d+)/);
    if (match) {
      lucky = match[1];
    }
    user = user || 'zhouyue';
  }
  
  // 生成文档标题：占卜+用户+种子数字
  const docTitle = `占卜${user}${lucky}`;
  
  console.log(`\n📤 同步到知识库...`);
  console.log(`   日期: ${date}`);
  console.log(`   文档标题: ${docTitle}`);
  
  const result = syncToKu(date, user, lucky, docTitle, content);
  
  // 写入 memory
  writeToMemory(date, content);
  
  console.log('\n--- SYNC_RESULT ---');
  console.log(JSON.stringify(result, null, 2));
}

main();