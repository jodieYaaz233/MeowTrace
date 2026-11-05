<template>
  <view class="chat-container">
    <view class="chat-header">
		<view class="back-btn-wrapper" @click="goBack">
		        <text class="back-icon">❮</text>
		      </view>
      <text class="header-title" style="color: #ffffff;">🐱 喵星健康 AI 助手</text>
      <text class="header-subtitle">兽医大模型在线咨询</text>
    </view>

    <scroll-view 
      scroll-y 
      class="msg-scroll" 
      :scroll-top="scrollTop" 
      scroll-with-animation
    >
      <view class="msg-list">
        <view 
          v-for="(msg, index) in messageList" 
          :key="index" 
          :class="['msg-item', msg.role === 'user' ? 'msg-user' : 'msg-ai']"
        >
          <view class="avatar-box">
            <text class="avatar-emoji">{{ msg.role === 'user' ? '👤' : '🤖' }}</text>
          </view>
          
          <view class="msg-bubble">
            <text class="msg-text">{{ msg.content }}</text>
          </view>
        </view>

        <view v-if="isAiThinking" class="msg-item msg-ai">
          <view class="avatar-box"><text class="avatar-emoji">🤖</text></view>
          <view class="msg-bubble thinking-bubble">
            <text class="msg-text">AI 正在组织语言...</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="input-bar">
      <input 
        class="chat-input" 
        v-model="inputText" 
        placeholder="请详细描述猫咪的症状或问题..." 
        confirm-type="send"
        @confirm="sendMessage"
      />
      <button class="send-btn" @click="sendMessage" :disabled="!inputText.trim()">发送</button>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const inputText = ref('');
const scrollTop = ref(0);
const isAiThinking = ref(false);

// 初始欢迎语
const messageList = ref([
  {
    role: 'ai',
    content: '你好！我是你的专属 AI 猫咪健康助手。无论是宠物猫还是街头的流浪喵，只要它们表现出不舒服、受伤或者行为反常，你都可以告诉我，我会为你提供基础的急救、救助与送医建议。'
  }
]);

const goBack = () => {
  uni.navigateBack({
    delta: 1,
    fail: () => {
      uni.reLaunch({ url: '/pages/profile/profile_written' });
    }
  });
};

const scrollToBottom = () => {
  nextTick(() => {
    scrollTop.value = scrollTop.value + 2000; // 增大滚动量确保触底
  });
};

// 发送消息并调用大模型
const sendMessage = async () => {
	const query = inputText.value.trim();
	  if (!query || isAiThinking.value) return;
	
	  // 1. 将用户对话内容渲染到界面
	  messageList.value.push({ role: 'user', content: query });
	  inputText.value = ''; 
	  isAiThinking.value = true; 
	  scrollToBottom();
	
	  // 2. 整理出纯净的历史对话上下文，传给云函数
	  const apiMessages = messageList.value.map(item => ({
	    role: item.role,
	    content: item.content
	  }));
	
	  try {
	    // 3. 呼叫云函数
	    const res = await uniCloud.callFunction({
	      name: 'vetChat', // 对应刚刚创建的云函数名字
	      data: {
	        messages: apiMessages
	      },
		  timeout:60000//60s超时
	    });
	
	    // 4. 解析云函数返回的结果
	    if (res.result && res.result.code === 200) {
	      messageList.value.push({
	        role: 'ai',
	        content: res.result.reply
	      });
	    } else {
	      console.error('云函数逻辑返回错误:', res.result);
	      throw new Error('Server Business Error');
	    }
	
	  } catch (err) {
	    console.error('网络或服务异常:', err);
	    messageList.value.push({
	      role: 'ai',
	      content: '🩺 诊疗室出了点小状况。请检查网络或稍后再试。'
	    });
	  } finally {
	    // 5. 重置状态并滚动到底部
	    isAiThinking.value = false; 
	    scrollToBottom();
	  }
// 2. 伪逻辑核心：不发起任何网络请求，直接通过定时器模拟 AI 医生的思考延迟
//   setTimeout(() => {
//     // 强制赋予你指定的固定兽医文本
//     const fixedReply = `猫咪出现呕吐、食欲不振、精神萎靡（缩成一团）这些症状，需要高度警惕，常见原因如下：

// **最可能的情况**

// **1. 猫瘟（泛白细胞减少症）**
// 这是幼猫或未免疫猫咪最危险的疾病之一。病毒感染会引起剧烈呕吐、完全拒食、精神极度沉郁、蜷缩不动，常伴有腹泻甚至便血。病情进展很快，若不及时治疗死亡率较高。

// **2. 急性胃肠炎或异物梗阻**
// 误食异物（线、塑料、骨头等）或刺激性食物会导致持续性呕吐，腹痛明显时猫会蜷缩身体。完全梗阻时还会停止排便，腹部触诊可能有硬块或剧烈疼痛反应。

// **3. 肝肾疾病**
// 慢性肾病或急性肝损伤在中老年猫中较常见，毒素积累引发恶心呕吐，伴随明显精神萎靡。可能同时出现多饮多尿（肾）或黄疸（肝）等表现。

// **4. 胰腺炎**
// 猫咪胰腺炎常表现为嗜睡、厌食、呕吐，腹痛时会呈现"祈祷姿势"或蜷缩，容易被忽视但危险性不低。

// **5. 毛球症（若呕吐物含毛发）**
// 如果呕吐物中可见成团毛发，可能是毛球堆积导致，但通常不会引起如此严重的精神沉郁，需排除其他更严重的病因。

// ---

// **建议立即采取的行动**

// 这些症状组合提示猫咪身体状态已经较差，**不建议在家自行观察**。请尽快带它去宠物医院，医生通常需要进行血常规（看白细胞是否降低，排查猫瘟）、生化检查（评估肝肾）、腹部触诊或影像学检查（排查异物）来明确诊断。

// 如果猫咪已经持续24小时以上未进食进水，或呕吐频繁，脱水和电解质紊乱的风险会迅速升高，就诊的紧迫性更高。`;

//     // 3. 将固定文本推入对话列表，并关闭加载状态
//     messageList.value.push({
//       role: 'ai',
//       content: fixedReply
//     });

//     isAiThinking.value = false; 
//     scrollToBottom();
//   }, 1000); // 1000毫秒（1秒）延迟，假装 AI 在认真思考，体验更真实
};
</script>

<style>
/* 容器全屏流式布局 */
.chat-container { display: flex; flex-direction: column; background: #f4f6f6; height: 100vh; }

/* 头部视觉对齐你的 AI Banner 配色 */
.chat-header { background: linear-gradient(135deg, #2A9D8F, #264653); padding: 40px 20px 15px; text-align: center; color:#ffffff }
.header-title { font-size: 18px; font-weight: bold; display: block; color: #ffffff}
.header-subtitle { font-size: 11px; opacity: 0.8; margin-top: 4px; display: block; color: #ffffff}

/* 滚动对话区域 */
.msg-scroll { flex: 1; overflow: hidden; }
.msg-list { padding: 15px 15px 30px; }

/* 基础消息气泡架构 */
.msg-item { display: flex; margin-bottom: 20px; width: 100%; }
.avatar-box { width: 35px; height: 35px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05); }
.avatar-emoji { font-size: 18px; }
.msg-bubble { max-width: 70%; padding: 10px 14px; border-radius: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.02); }
.msg-text { font-size: 14px; line-height: 1.5; word-break: break-all; }

/* AI 气泡样式 (靠左) */
.msg-ai { flex-direction: row; }
.msg-ai .msg-bubble { background-color: #ffffff; color: #333; margin-left: 10px; border-top-left-radius: 4rpx; }
.msg-ai .thinking-bubble { background-color: #e8f5e9; color: #2A9D8F; }

/* 用户气泡样式 (靠右，采用你的主色调橘黄色) */
.msg-user { flex-direction: row-reverse; }
.msg-user .msg-bubble { background-color: #F4A261; color: #ffffff; margin-right: 10px; border-top-right-radius: 4rpx; }

/* 底部安全输入栏 */
.input-bar { display: flex; align-items: center; padding: 10px 15px; background: #ffffff; border-top: 1px solid #eee; padding-bottom: calc(10px + env(safe-area-inset-bottom)); }
.chat-input { flex: 1; height: 38px; background: #f5f5f5; border-radius: 20px; padding: 0 15px; font-size: 14px; }
.send-btn { width: 70px; height: 38px; line-height: 38px; background-color: #2A9D8F; color: #fff; font-size: 13px; font-weight: bold; border-radius: 20px; margin-left: 10px; padding: 0; border: none; }
.send-btn[disabled] { background-color: #cccccc; color: #ffffff; opacity: 0.8; }
</style>