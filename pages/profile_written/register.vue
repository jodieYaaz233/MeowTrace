<template>
  <view class="reg-container">
    <view class="header">
      <text class="title">加入救助网络</text>
      <text class="subtitle">第一步：建立你的身份档案</text>
    </view>

    <view class="form">
      <input v-model="formData.name" placeholder="怎么称呼您？" />
      <input v-model="formData.mobile" type="number" placeholder="手机号码" />
	  <view class="input-wrapper">
	          <input 
	            v-model="formData.password" 
	            :password="!showPassword" 
	            placeholder="设置密码(必须含有符号,大小写字母,数字)" 
	          />
	          <view class="toggle-eye" @click="showPassword = !showPassword">
	            <text>{{ showPassword ? '👁️' : '🙈' }}</text>
	          </view>
	        </view>
      <view class="input-wrapper">
              <input 
                v-model="formData.confirmPassword" 
                :password="!showPassword" 
                placeholder="确认密码" 
              />
            </view>
      
      <button class="next-btn" @click="goStep2">下一步：准入测试</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const formData = ref({
  name: '',
  mobile: '',
  password: '',
  confirmPassword: '',
  quizScore: 0
});
//是否显示密码
const showPassword = ref(false);

const goStep2 = () => {
  const { name, mobile, password, confirmPassword } = formData.value;
  
  if (!name || !mobile || !password || !confirmPassword) {
    return uni.showToast({ title: '请填写完整信息', icon: 'none' });
  }
  if (password !== confirmPassword) {
    return uni.showToast({ title: '两次密码不一致', icon: 'none' });
  }
  if (mobile.length !== 11) {
    return uni.showToast({ title: '手机号格式不正确', icon: 'none' });
  }

  // 跳转并将基础数据序列化传递
  uni.navigateTo({
    url: `/pages/profile_written/quiz?info=${encodeURIComponent(JSON.stringify(formData.value))}`
  });
};
</script>
<style>
.reg-container {
  padding: 60rpx 40rpx;
  background-color: #fdfdfd;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 80rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #999;
}

.form {
  background: #fff;
  border-radius: 24rpx;
}

/* 输入框外层包裹样式 */
.input-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 30rpx;
}

/* 输入框样式 */
input {
  width: 100%;
  height: 100rpx;
  background-color: #f5f5f5;
  border-radius: 50rpx;
  padding: 0 100rpx 0 40rpx;
  margin-bottom: 30rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.toggle-eye {
  position: absolute;
  right: 10rpx;
  top: 50%;
  transform: translateY(-50%);
  height: 100rpx;
  width: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  z-index: 10;
}
.toggle-eye:active {
  opacity: 0.6; /* 点击时的反色反馈 */
}

.next-btn {
  width: 100%;
  height: 100rpx;
  line-height: 100rpx;
  background-color: #F4A261;
  color: #fff;
  border-radius: 50rpx;
  margin-top: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 10rpx 20rpx #E76F51;
}

.next-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}
</style>