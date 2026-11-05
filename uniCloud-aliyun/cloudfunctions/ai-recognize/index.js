// index.js
//const { llmConfig2 } = require('./config.js');

const db = uniCloud.database();
const dbCmd = db.command;

// 从你的 config.js 中读取配置
const invokeUrl ='https://integrate.api.nvidia.com/v1/chat/completions';
const invokeKey = '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'; 

exports.main = async (event, context) => {
  const { imageFileID, longitude, latitude } = event; 
  if (!imageFileID) return { code: -1, msg: '缺失图片' };
	// 验证坐标
    if (!longitude || !latitude) {
    return { code: -1, msg: '缺失坐标信息' };
    }
  // 1. 检索附近猫咪
  let nearbyCats = await getNearbyCats(longitude, latitude, 1000);
  if (nearbyCats.length === 0) {
    nearbyCats = await getNearbyCats(longitude, latitude, 5000);
  }

  if (nearbyCats.length === 0) {
    console.log("方圆5公里无有记录的猫咪");
	return{is_new:true};
  }

  
  // 2. 调用 Mistral 大模型进行视觉比对
  try {
    const matchResult = await compareWithLLM(imageFileID, nearbyCats);
	if (matchResult.matched && matchResult.cat_id) {
	      return {
	        is_new: false,
	        cat_id: matchResult.cat_id
	      };
	    } else {
			return { is_new: true, msg: '未匹配到已有档案' };
			console.log("未匹配到已有档案");
	    }
  //   // 指定匹配的目标图片URL
  //       const targetImageUrl = 'https://mp-c08c02bc-f3dc-4493-a66c-cb50a9f374f3.cdn.bspapp.com/cloudstorage/fe46dc46-6143-417c-bdbe-44e7b6b3dd43.jpg';
  //       // 指定匹配成功时返回的档案ID
  //       const targetCatId = '6a23680e8b0da419203d8369';
  //   if (imageFileID === targetImageUrl) {
  //     return {
  //       is_new: false,
  //       cat_id: targetCatId
  //     };
  //   } else {
		// return { is_new: true, msg: '未匹配到已有档案' };
		// console.log("未匹配到已有档案");
  //   }
  // } catch (e) {
  //   console.error('AI识别出错详情：', e);
  //   return { is_new: true, msg: '识别引擎繁忙，建议手动建档' };
   }catch (e) {
    console.error('AI识别出错详情：', e);
    return { is_new: true, msg: '识别引擎繁忙，建议手动建档' };
  }
};

/**
 * 空间搜索
 */
async function getNearbyCats(lng, lat, maxDistance) {
  const res = await db.collection('cats').where({
    location: dbCmd.geoNear({
      geometry: new db.Geo.Point(lng, lat),
      maxDistance: maxDistance
    })
  }).limit(4).get(); // ⚠️ 安全提醒：转 Base64 会导致体积剧增，建议最多比对 4 只猫，避免请求体过大报错
  return res.data;
}

/**
 * 调用 Mistral 大模型 API 进行比对
 */
async function compareWithLLM(targetImgID, candidates) {
  // 1. 提取所有图片的 fileID（目标图 + 候选图）
  const fileIDs = [targetImgID, ...candidates.map(c => c.cover_image)];
  
  // 2. 获取临时下载链接
  const { fileList } = await uniCloud.getTempFileURL({ fileList: fileIDs });

  // 3. 并发下载图片并转换为 Base64 (核心转换步骤)
  const b64List = await Promise.all(fileList.map(async (file) => {
    const res = await uniCloud.httpclient.request(file.tempFileURL, { dataType: 'buffer' });
    return res.data.toString('base64');
  }));

  const targetB64 = b64List[0];
  const candidateB64s = b64List.slice(1);

    let contentArray = [
      {
        type: "text",
        text: "请观察第一张图片（目标猫咪），并判断它是否与后续列表中的某只猫咪是同一只。如果是，请直接返回该候选猫咪的序号（从0开始）；如果都不是，请返回 \"none\"。只返回一个数字序号或 \"none\"，不要附加任何解释。\n\n目标猫咪："
      },
      {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${targetB64}` }
      }
    ];
	
  candidateB64s.forEach((b64, index) => {
	contentArray.push({
	      "type": "text",
	      "text": `候选猫咪序号 ${index}:`
	    });
	    contentArray.push({
	      "type": "image_url",
	      "image_url": { "url": `data:image/jpeg;base64,${b64}` }
	    });
  });

  // 5. 构造 NVIDIA / Mistral 所需的 Payload
  const payload = {
    model: "meta/muse-glimmer-30b",
    messages: [
      {
        role: "user",
        content: contentArray
      }
    ],
    max_tokens: 50,      // 只需要数字，不需要长篇大论
    temperature: 0.1,    // 温度设极低，保证回答稳定
    stream: false        // 云函数必须等待结果，不能用 stream
  };

  // 6. 发起 HTTP 请求
  const response = await uniCloud.httpclient.request(invokeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${invokeKey}`,
      'Accept': 'application/json'
    },
    data: JSON.stringify(payload),
    dataType: 'json',
    timeout: 60000 // Base64体积大、大模型耗时，把超时拉长到 60 秒
  });

  // 7. 错误拦截
  if (response.status !== 200 || !response.data.choices) {
    throw new Error('NVIDIA API 请求失败: ' + JSON.stringify(response.data || response));
  }

  // 8. 解析大模型文本
  const aiText = response.data.choices[0].message.content.trim().toLowerCase();
  console.log('Mistral 模型返回结果:', aiText);

  if (aiText.includes('none')) {
    return { matched: false };
  } else {
    // 使用正则提取它说的那个数字
    const match = aiText.match(/\d+/);
    if (match) {
      const index = parseInt(match[0]);
      if (!isNaN(index) && candidates[index]) {
        return { matched: true, cat_id: candidates[index]._id };
      }
    }
  }
  return { matched: false };
}