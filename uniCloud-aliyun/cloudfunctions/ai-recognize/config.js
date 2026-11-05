// config.js
module.exports = {
  // 推荐使用阿里云通义千问 VL 或其他兼容 OpenAI 接口的多模态模型
  llmConfig1: {
    apiUrl: 'https://ai-gateway.vei.volces.com/v1', // 示例：阿里百炼接口
    apiKey: 'Bearer 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', // 替换为你的 API Key
    modelName: 'qwen-vl-plus' // 识别猫咪建议使用具备较强视觉识别能力的对象
  },
  llmConfig2:{
	  apiUrl:'https://integrate.api.nvidia.com/v1/chat/completions',
	  apiKey:'Bearer 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',
	  modelName:"mistralai/mistral-large-3-675b-instruct-2512"
  }
  threshold: 0.85 // 相似度判定阈值（如果模型支持返回分数）
}