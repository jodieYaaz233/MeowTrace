<template>
  <view class="login-container">
    <view class="header">
      <text class="title">欢迎回来</text>
      <text class="subtitle">登录你的守护者档案</text>
    </view>

    <view class="form-box">
      <input v-model="loginData.mobile" type="number" placeholder="请输入手机号" maxlength="11" />
	  <view class="input-wrapper">
	          <input 
	            v-model="loginData.password" 
	            :password="!showPassword" 
	            placeholder="请输入密码" 
	          />
	          <view class="toggle-eye" @click="showPassword = !showPassword">
	            <text>{{ showPassword ? '👁️' : '🙈' }}</text>
	          </view>
	        </view>
      
      <button class="login-btn"  @click="doLogin">登录</button>
      <text class="reg-link" @click="toRegister">新用户注册</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const showPassword = ref(false);

// 1. 初始化表单响应式数据
const loginData = ref({
  mobile: '',
  password: ''
});

const doLogin = async () => {
  // 基础格式校验
  if (loginData.value.mobile.length !== 11) {
    return uni.showToast({ title: '手机号格式不正确', icon: 'none' });
  }

  uni.showLoading({ title: '正在登录...' });

  try {
    // 2. 改用 callFunction 调用登录云函数
    const res = await uniCloud.callFunction({
      name: 'users-login',
      data: {
        mobile:loginData.value.mobile,
        password: loginData.value.password
      }
    });

    const result = res.result;
    uni.hideLoading();

    if (result.code !== 0) {
      return uni.showToast({ title: result.msg, icon: 'none' });
    }

    // 3. 【核心对接】登录成功，将后端查出来的 _id 存入本地缓存，完美对接 profile.vue
    uni.setStorageSync('current_uid', result._id);

    uni.showToast({ title: '登录成功', icon: 'success' });
    
    // 4. 成功后跳转回个人主页
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/profile/profile_written' });
    }, 1200);

  } catch (e) {
    uni.hideLoading();
    uni.showModal({
      title: '登录失败',
      content: e.message || '网络开小差了，请重试',
      showCancel: false
    });
  }
};

// 跳转到注册页面
const toRegister = () => {
  uni.navigateTo({
    url: '/pages/profile_written/register'
  });
};
</script>

<style>
.login-container { padding: 80rpx 40rpx; background: #fdfdfd; min-height: 100vh; }
.header { margin-bottom: 100rpx; }
.title { font-size: 48rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }
.subtitle { font-size: 28rpx; color: #999; }

input {
  width: 100%;
  height: 100rpx;
  background-color: #f5f5f5;
  border-radius: 50rpx;
  padding: 0 40rpx;
  margin-bottom: 30rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

/* 输入框外层包裹样式 */
.input-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 30rpx;
}

.login-btn {
  width: 100%;
  height: 100rpx;
  line-height: 100rpx;
  background-color: #F4A261;
  color: #fff;
  border-radius: 50rpx;
  margin-top: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
}
.login-btn[disabled] { background: rgba(244, 162, 97, 0.4); color: rgba(255,255,255,0.8); }

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

.reg-link {
  display: block;
  text-align: center;
  color: #999;
  font-size: 26rpx;
  margin-top: 40rpx;
}
</style>