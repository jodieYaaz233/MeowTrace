<template>
  <view class="quiz-container">
    <view class="progress-box">
      <view class="progress-bar" :style="{ width: progress + '%' }"></view>
      <text class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</text>
    </view>

    <view class="question-card" v-if="currentIndex < questions.length">
      <text class="q-title">{{ questions[currentIndex].text }}</text>
      
      <view class="options-group">
        <view 
          v-for="(label, index) in optionLabels" 
          :key="index" 
          class="option-item"
          :class="{ active: currentAnswer === index + 1 }"
          @click="selectOption(index + 1)"
        >
          <text class="option-text">{{ label }}</text>
        </view>
      </view>
    </view>

    <button class="next-btn" :disabled="!currentAnswer" @click="handleNext">
      {{ currentIndex === questions.length - 1 ? '提交审核' : '下一题' }}
    </button>
  </view>
</template>

<script setup>
import { ref, computed} from 'vue';
import { onLoad } from '@dcloudio/uni-app'; // 确保这一行存在

const preFormData = ref({});
const currentIndex = ref(0);
const currentAnswer = ref(0);
const totalScore = ref(0);

// 10道精选暗黑人格维度题目 (针对自私、权术、冷酷、施虐倾向)
const questions = [
  { text: "为了达成我的目标，即使伤害他人也是可以接受的。" },
  { text: "我喜欢掌握别人的弱点，以便在需要时利用他们。" },
  { text: "看到那些弱小的人或动物受惊吓，我会感到一种莫名的兴奋。" },
  { text: "规则是给普通人定的，像我这样的人可以不受约束。" },
  { text: "如果有人挡了我的路，我会想方设法让他付出代价。" },
  { text: "我并不真正关心陌生人的死活或痛苦。" },
  { text: "只要能获得成功，使用欺骗手段是理所应当的。" },
  { text: "看到流浪动物被驱赶或清理，我觉得那是它们应有的下场。" },
  { text: "我享受那种能够掌控他人命运的感觉。" },
  { text: "如果可以不被发现，我愿意通过伤害别人来换取利益。" }
];

const optionLabels = ["非常不同意", "不同意", "一般", "同意", "非常同意"];

const progress = computed(() => ((currentIndex.value + 1) / questions.length) * 100);

onLoad((options) => {
  if (options.info) {
    preFormData.value = JSON.parse(decodeURIComponent(options.info));
  }
});

const selectOption = (score) => {
  currentAnswer.value = score;
};

const handleNext = () => {
  // 评分逻辑：选择“非常不同意”(1)得10分，选择“非常同意”(5)得2分
  // 这样 10 题满分为 100 分
  const scoreForThisQ = (6 - currentAnswer.value) * 2;
  totalScore.value += scoreForThisQ;

  if (currentIndex.value < questions.length - 1) {
    currentIndex.value++;
    currentAnswer.value = 0; // 重置下一题选项
  } else {
    submitRegistration();
	
  }
};

const submitRegistration = async () => {
  const finalScore = totalScore.value;

  if (finalScore < 80) {
    uni.showModal({
      title: '审核未通过',
      content: `您的安全契合度评分为 ${finalScore}，未达到社区入驻标准（80分）。救助网络需要高同理心的成员。`,
      showCancel: false,
      confirmText: '返回',
      success: () => uni.navigateBack()
    });
    return;
  }

  // 调用注册逻辑
  uni.showLoading({ title: '正在创建守护账号...' });
  
  try {
	  const res = await uniCloud.callFunction({
	  	name:"users-register",
		data:{
			action:'registerUser',
			params:{
				  name: preFormData.value.name,
				  password: preFormData.value.password,
				  mobile: preFormData.value.mobile,
				  quizscore:finalScore,
				  credit_score: finalScore
			}
		}
	  });
	  const result = res.result;
	  if(result.code !== 0){
		  throw new Error(result.msg);
	  }
	
	// if (result.token) {
	//   uni.setStorageSync('uni_id_token', result.token);
	//   uni.setStorageSync('uni_id_token_expired', result.tokenExpired);
	// } else {
	//   console.warn("云函数未返回 token，请检查 users-register 是否正确生成了 token");
	// }
	//uni.setStorageSync('current_uid',result.uid);
	
    uni.hideLoading();
    uni.showToast({ title: '档案建立成功', icon: 'success' });
	
    setTimeout(() => uni.reLaunch({ url: '/pages/profile/profile_written' }), 1500);
  } catch (e){
    uni.hideLoading();
	console.error('档案建立失败：',e);
	// 提取错误信息（兼容标准 Error、uniCloud 云函数报错及字符串报错）
	const errMsg = e?.message || e?.errMsg || (typeof e === 'string' ? e : '系统开小差了，请重试');
    uni.showModal({ title: '档案建立失败',
	content:errMsg,
	showCancel:false
	 });
  }
};
</script>

<style>
.quiz-container { padding: 40rpx; background: #fdfdfd; min-height: 100vh; }
.progress-box { margin-bottom: 60rpx; }
.progress-bar { height: 8rpx; background: #F4A261; transition: width 0.3s; border-radius: 4rpx; }
.progress-text { font-size: 24rpx; color: #999; margin-top: 10rpx; display: block; text-align: right; }

.question-card { background: #fff; padding: 40rpx; border-radius: 20rpx; box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.05); margin-bottom: 60rpx; }
.q-title { font-size: 36rpx; color: #333; font-weight: bold; line-height: 1.6; display: block; margin-bottom: 40rpx; }

.option-item { padding: 30rpx; border: 2rpx solid #eee; border-radius: 12rpx; margin-bottom: 20rpx; transition: all 0.2s; }
.option-item.active { background: #fff1f2; border-color: #F4A261; }
.option-text { font-size: 30rpx; color: #666; }
.active .option-text { color: #F4A261; font-weight: bold; }

.next-btn { background: #F4A261; color: #fff; border-radius: 50rpx; height: 100rpx; line-height: 100rpx; font-size: 32rpx; }
.next-btn[disabled] { background: rgba(233, 196, 106, 0.15); }
</style>