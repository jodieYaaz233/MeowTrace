'use strict';

// 1. 完全对齐你可成功运行的 NVIDIA 平台配置
const invokeUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
//https://api-ai.vivo.com.cn/v1/chat/completions
const invokeKey = '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'; 
//sk-xuanji-2026918847-WHRrVHl6Snhlc2xOelpPVQ==

const MODEL_NAME = 'meta/muse-glimmer-30b';
// 强行约束它扮演专业兽医的 System Prompt
const SYSTEM_PROMPT = `你是一位经验丰富、富有同理心的专业宠物兽医。
你的主要职责是针对用户描述的猫咪的不良身体状态、反常行为或受伤情况，给出专业的救助、护理和应急处理建议。
请严格遵守以下原则：
1. 分析用户描述的症状，指出可能存在健康隐患。
2. 给出具体、安全、适合普通人在家或救助现场操作的护理或急救建议。
3. 必须明确区分“轻微症状（可留观）”与“紧急症状（需立即送医）”。一旦发现猫咪有致命风险（如尿闭、张口呼吸、严重外伤、频繁呕吐脱水等），必须强烈建议用户立即送往宠物医院。
4. 语言要通俗易懂，多一些关怀和温暖。`;

exports.main = async (event, context) => {
  // 从前端接收多轮聊天历史数组
  const { messages } = event;
  
  if (!messages || !Array.isArray(messages)) {
    return { code: -1, msg: '参数错误，缺失对话历史' };
  }

const cleanedMessages = messages.map(msg => {
    return {
      // 如果角色是 'ai'，则纠正为 'assistant'，否则保持 'user' 不变
      role: msg.role === 'ai' ? 'assistant' : msg.role,
      content: msg.content
    };
  });
  
  // 2. 组装发送给大模型的消息历史（首位注入 System 角色设定）
  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...cleanedMessages
  ];

  // 3. 仿照成功案例，严格构造 NVIDIA 所需的 Payload 结构
  const payload = {
    model: MODEL_NAME,
    messages: apiMessages,
    max_tokens: 1024,    // 兽医诊断需要相对详细的解答，设为 1024
    temperature: 0.7,    // 适当的创造力，利于生成富有同理心的关怀回复
    stream: false        // 云函数必须等待完整结果，不能用 stream
  };

  try {
    // 4. 核心复制：使用与成功案例完全一致的 headers 命名和 JSON.stringify 传参方式
    const response = await uniCloud.httpclient.request(invokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${invokeKey}`,
        'Accept': 'application/json',
		'app_id':'2026918847'
      },
      data: JSON.stringify(payload),
      dataType: 'json',
      timeout: 120000 // 保持 60 秒超时，防止大模型思考时间过长导致中断
    });

    // 5. 拦截并处理响应
    if (response.status !== 200 || !response.data.choices) {
      throw new Error('API 响应异常: ' + JSON.stringify(response.data || response));
    }

    // 6. 成功提取 AI 兽医的回复文本
    const aiReply = response.data.choices[0].message.content;
    
    return {
      code: 200,
      reply: aiReply
    };

  } catch (err) {
    console.error('AI 兽医诊断出错详情：', err);
    return {
      code: 500,
      msg: '诊断引擎繁忙，请稍后再试',
      error: err.message
    };
  }
};