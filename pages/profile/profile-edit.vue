<template>
  <view class="edit-container">
    <view class="avatar-section" @click="changeAvatar">
      <image :src="userInfo.avatar || '/static/default-avatar.png'" mode="aspectFill" class="avatar-img"></image>
      <view class="edit-badge">📷</view>
    </view>
    <text class="hint-text">点击更换头像</text>

    <view class="form-group">
      <view class="input-row">
        <text class="label">昵称</text>
        <input class="input-box" v-model="userInfo.nickname" placeholder="请输入您的昵称" />
      </view>

      <view class="input-row readonly-row">
        <text class="label">信誉积分</text>
        <view class="score-box">
          <text class="score-num">{{ userInfo.credit_score }}</text>
          <text class="score-desc">（由系统评估，不可修改）</text>
        </view>
      </view>
    </view>

    <button class="save-btn" @click="saveProfile" :loading="isSaving">保存修改</button>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isSaving = ref(false);
const userInfo = ref({
  _id: '',
  avatar: '',
  nickname: '',
  credit_score: 100
});

onMounted(() => {
  loadUserInfo();
});

const loadUserInfo = () => {
  // 实际开发中从缓存或 uniCloud 获取真实信息
  const cachedUser = uni.getStorageSync('userInfo');
  if (cachedUser) {
    userInfo.value = { ...userInfo.value, ...cachedUser };
  } else {
    // 兜底默认值
    userInfo.value.nickname = '热心喵友';
  }
};

const changeAvatar = () => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      uni.showLoading({ title: '上传中...' });
      const tempFilePath = res.tempFilePaths[0];
      
      try {
        // 将头像传至云存储
        const uploadRes = await uniCloud.uploadFile({
          filePath: tempFilePath,
          cloudPath: `avatars/user_${Date.now()}.jpg`
        });
        
        // 更新本地预览
        userInfo.value.avatar = uploadRes.fileID;
        uni.hideLoading();
      } catch (e) {
        uni.hideLoading();
        uni.showToast({ title: '头像上传失败', icon: 'none' });
      }
    }
  });
};

const saveProfile = async () => {
  if (!userInfo.value.nickname.trim()) {
    return uni.showToast({ title: '昵称不能为空', icon: 'none' });
  }

  isSaving.value = true;
  uni.showLoading({ title: '保存中...' });

  try {
    const db = uniCloud.database();
    
    // 如果你在使用 uni-id，这里应该是调用 uni-id 的 updateUser 接口
    // 这里演示使用普通数据库操作修改 uni-id-users 表
    const currentUid = uniCloud.getCurrentUserInfo().uid; 
    
    if (currentUid) {
      await db.collection('uni-id-users').doc(currentUid).update({
        nickname: userInfo.value.nickname,
        avatar: userInfo.value.avatar
      });
    }

    // 同步更新本地缓存
    uni.setStorageSync('userInfo', userInfo.value);

    uni.hideLoading();
    uni.showToast({ title: '保存成功', icon: 'success' });
    
    setTimeout(() => {
      uni.navigateBack();
    }, 1000);

  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: '保存失败', icon: 'none' });
  } finally {
    isSaving.value = false;
  }
};
</script>

<style>
.edit-container { padding: 30px 20px; background: #f8f8f8; min-height: 100vh; display: flex; flex-direction: column; align-items: center;}
.avatar-section { position: relative; width: 100px; height: 100px; margin-bottom: 10px; }
.avatar-img { width: 100%; height: 100%; border-radius: 50%; background: #ddd; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.edit-badge { position: absolute; bottom: 0; right: 0; background: #f06c7a; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid #fff; font-size: 14px;}
.hint-text { font-size: 14px; color: #999; margin-bottom: 40px; }

.form-group { width: 100%; background: #fff; border-radius: 12px; padding: 0 15px; box-sizing: border-box; }
.input-row { display: flex; align-items: center; padding: 20px 0; border-bottom: 1px solid #eee; }
.input-row:last-child { border-bottom: none; }
.label { width: 80px; font-size: 16px; font-weight: bold; color: #333; }
.input-box { flex: 1; font-size: 16px; text-align: right; color: #333;}
.readonly-row { background: transparent; }
.score-box { flex: 1; text-align: right; }
.score-num { font-size: 18px; color: #f06c7a; font-weight: bold; }
.score-desc { font-size: 12px; color: #999; display: block; margin-top: 4px;}

.save-btn { width: 100%; background: #f06c7a; color: white; border-radius: 25px; margin-top: 40px; height: 46px; line-height: 46px; font-size: 16px;}
</style>