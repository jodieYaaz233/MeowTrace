<template>
  <view class="publish-container">
    <textarea 
      class="content-input" 
      v-model="postData.content" 
      placeholder="遇到什么可爱的喵星人了？分享一下吧..." 
      maxlength="500">
    </textarea>

    <view class="image-uploader" @click="chooseImage">
      <image v-if="postData.localImagePath" :src="postData.localImagePath" mode="aspectFill" class="preview-img"></image>
      <view v-else class="upload-placeholder">
        <text class="plus-icon">+</text>
        <text class="upload-text">添加照片</text>
      </view>
    </view>

    <view class="location-tag" v-if="postData.locationName">
      <text>📍 {{ postData.locationName }}</text>
    </view>

    <button class="submit-btn" @click="submitPost" :loading="isSubmitting">发布动态</button>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const isSubmitting = ref(false);

const postData = reactive({
  content: '',
  localImagePath: '', // 本地预览路径
  cloudImageID: '',   // 上传后的云端文件ID
  locationName: '正在获取位置...'
});

onMounted(() => {
  getLocation();
});

// 获取位置
const getLocation = () => {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      // 实际项目中应调用地图API逆地址解析，这里暂用经纬度模拟
      postData.locationName = `当前位置附近 (经度:${res.longitude.toFixed(2)})`;
    },
    fail: () => {
      postData.locationName = '位置获取失败';
    }
  });
};

// 选择图片
const chooseImage = () => {
  uni.chooseImage({
    count: 1, // 暂时限制发一张图
    success: (res) => {
      postData.localImagePath = res.tempFilePaths[0];
    }
  });
};

// 提交帖子
const submitPost = async () => {
  if (!postData.content && !postData.localImagePath) {
    return uni.showToast({ title: '总得写点或发点图吧', icon: 'none' });
  }
// 获取当前用户登录ID
  const currentUserId = uni.getStorageSync('current_uid');
  if (!currentUserId) {
    return uni.showModal({
      title: '提示',
      content: '请先登录后再发表动态',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/profile_written/login' });
        }
      }
    });
  }
  
  isSubmitting.value = true;
  uni.showLoading({ title: '发布中...' });

  try {
	  // 2. 获取用户自身的昵称和头像（用于帖子冗余，避免社区列表拉取时联表查库导致卡顿）
	      const db = uniCloud.database();
	      const userRes = await db.collection('users-selfcreate').doc(currentUserId).field({ nickname: true, avatar: true }).get({ getOne: true });
	      
	      let authorName = '热心喵友';
	      let authorAvatar = '';
	      if (userRes.result.data) {
	        authorName = userRes.result.data.nickname ;
	        authorAvatar = userRes.result.data.avatar;
	      }
		  
    // 1. 如果有图片，先上传到云存储
    if (postData.localImagePath) {
      const uploadRes = await uniCloud.uploadFile({
        filePath: postData.localImagePath,
        cloudPath: `posts/user_${currentUserId}_${Date.now()}.jpg`
      });
      postData.cloudImageID = uploadRes.fileID;
    }

    // 2. 写入 posts 数据库
    await db.collection('posts').add({
	user_id: currentUserId,              // 发帖人外键ID
	author_name: authorName,             // 发帖人昵称（冗余）
	author_avatar: authorAvatar,         // 发帖人头像（冗余）
      content: postData.content,
      image_url: postData.cloudImageID, // 存入云端文件ID
      location_name: postData.locationName,
      //create_time: Date.now()
    });

    uni.hideLoading();
    uni.showToast({ title: '发布成功' });
    
    // 延迟返回上一页（社区页）
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);

  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: '发布失败，请重试', icon: 'none' });
    console.error(e);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style>
.publish-container { padding: 20px; background: #fff; min-height: 100vh; }
.content-input { width: 100%; height: 120px; background: #f8f8f8; padding: 15px; border-radius: 12px; box-sizing: border-box; font-size: 15px; margin-bottom: 20px; }
.image-uploader { width: 120px; height: 120px; background: #f5f5f5; border-radius: 12px; display: flex; justify-content: center; align-items: center; overflow: hidden; margin-bottom: 20px; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; color: #999; }
.plus-icon { font-size: 40px; line-height: 1; margin-bottom: 5px; color: #ccc; }
.upload-text { font-size: 12px; }
.preview-img { width: 100%; height: 100%; }
.location-tag { background: #f0f0f0; padding: 6px 12px; border-radius: 20px; font-size: 12px; color: #666; display: inline-block; margin-bottom: 30px; }
.submit-btn { background: #f06c7a; color: white; border-radius: 25px; }
</style>