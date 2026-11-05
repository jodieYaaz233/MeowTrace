<template>
  <view class="profile-container">
    <view class="user-header">
      <image class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'" mode="aspectFill" @click="changeAvatar"></image>
      <view class="info" v-if="isLogin">
        <text class="nickname">{{ userInfo.nickname || '爱猫志愿者'}}</text>
        <view class="credit-tag">信誉积分: {{ userInfo.credit_score || 0 }}</view>
      </view>
      <view class="info auth-box" v-else>
		  <text class="nickname">欢迎加入救助网络</text>
		  <view class = "auth-btn-group">
			  <text class="auth-action-btn" @click="goToLogin">点击登录</text>
			  <text class="auth-split-line">|</text>
			  <text class="auth-action-btn" @click="goToRegister">点击注册</text>
		  </view>
      </view>
    </view>

	<view class="ai-banner" @click="goToVetAI">
      <view class="ai-left">
        <text class="ai-title">🤖 智能猫咪兽医大模型</text>
        <text class="ai-desc">遇猫生病、异常状态？点击即刻在线诊疗</text>
      </view>
      <text class="ai-go">去咨询 ➔</text>
    </view>
	
    <view class="section-title">📊 我的救助档案</view>
        <view class="grid-panel">
          <view class="grid-item" :class="{ active: currentTab === 'registered' }" @click="switchTab('registered')">
            <text class="grid-num">{{ registeredCats.length }}</text>
            <text class="grid-label">我登记的</text>
          </view>
          <view class="grid-item" :class="{ active: currentTab === 'rescued' }" @click="switchTab('rescued')">
            <text class="grid-num">{{ rescuedCats.length }}</text>
            <text class="grid-label">我救助的</text>
          </view>
        </view>
	<view class="cat-list-wrapper">
	      <block v-if="currentTab === 'registered' || currentTab === 'rescued'">
	        <view class="cat-item" v-for="cat in displayList" :key="cat._id" @click="goToCatDetail(cat.cat_id || cat._id)">
	          <image class="cat-cover" :src="cat.cover_image" mode="aspectFill"></image>
	          <view class="cat-info">
	            <text class="cat-name">{{ cat.cat_name || cat.name}}</text>
	            <text class="cat-status">最新状态: {{ cat.latest_status }}</text>
	            <text class="cat-time">{{ formatTime(cat.create_time) }}</text>
	          </view>
	        </view>
	      </block>
	      
	      <block v-else>
	        <view class="mock-social-container">
	          <view class="empty-state">
	            <text>✨ 正在加载 {{ getTabName(currentTab) }} 的最新内容...</text>
	          </view>
	        </view>
	      </block>

      <view class="empty-state" v-if="displayList.length === 0">
        <text>{{ isLogin ? '暂无相关记录' : '登录后查看我的救助记录' }}</text>
      </view>
    </view>
<view class="section-title">💬 我的社区互动</view>
    <view class="grid-panel social-grid">
      <view class="grid-item" :class="{ active: currentTab === 'my_posts' }" @click="switchTab('my_posts')">
        <text class="grid-icon">📝</text>
        <text class="grid-label">发表的帖子</text>
      </view>
      <view class="grid-item" :class="{ active: currentTab === 'favorites' }" @click="switchTab('favorites')">
        <text class="grid-icon">⭐</text>
        <text class="grid-label">收藏的帖子</text>
      </view>
      <view class="grid-item" :class="{ active: currentTab === 'likes' }" @click="switchTab('likes')">
        <text class="grid-icon">❤️</text>
        <text class="grid-label">点赞的帖子</text>
      </view>
      <view class="grid-item" :class="{ active: currentTab === 'comments' }" @click="switchTab('comments')">
        <text class="grid-icon">💬</text>
        <text class="grid-label">评论的帖子</text>
      </view>
    </view>
	

	
	<button v-if="isLogin" class="logout-btn" @click="doLogout">退出登录</button>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';

// 1. 状态管理：移除对 store.js 的依赖，改为手动控制
const isLogin = ref(false);
const userInfo = ref({});
const currentUserId = ref(''); // 当前用户 ID
const currentTab = ref('registered');
const registeredCats = ref([]);
const rescuedCats = ref([]);

const displayList = computed(() => {
  return currentTab.value === 'registered' ? registeredCats.value : rescuedCats.value;
});

// 2. 使用 onShow 确保每次回到个人中心都会刷新状态（比如注册成功回来）
onShow(() => {
  checkLoginStatus();
});

const checkLoginStatus = async () => {
  // 获取当前 uni-id 的 token
  const localUid = uni.getStorageSync('current_uid');
  if (localUid) {
	  currentUserId.value = localUid;
    await fetchUserProfile(localUid);
    fetchMyRecords();
  } else {
    isLogin.value = false;
	currentUserId.value = '';
    userInfo.value = {};
	registeredCats.value = [];
    rescuedCats.value = [];
  }
};

// 3. 核心：从数据库获取你在注册时保存的 credit_score
const fetchUserProfile = async (uid) => {
  const db = uniCloud.database();
  try {
    const res = await db.collection('users-selfcreate')
      .doc(uid)
      .field('nickname,avatar,credit_score') // 只取需要的字段
      .get({getOne: true});
    
    if (res.result.data) {
      userInfo.value = res.result.data;
      isLogin.value = true;
    }
  } catch (e) {
    console.error("获取用户信息失败", e);
  }
};

// 跳转到自定义的登录/注册页面
const goToRegister = () => {
  uni.navigateTo({
    url: '/pages/profile_written/register'
  });
};
const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/profile_written/login'
  });
};

const fetchMyRecords = async () => {
	if(!currentUserId.value) return;
  const db = uniCloud.database();
  try {
    const regRes = await db.collection('cats').where({ creator_id: currentUserId.value}).orderBy('create_time desc').limit(20).get();
    registeredCats.value = regRes.result.data;

    const rescueRes = await db.collection('rescue_records').where({ user_id: currentUserId.value }).orderBy('create_time desc').limit(20).get();
    rescuedCats.value = rescueRes.result.data;
  } catch (e) {
    console.error("获取记录失败", e);
  }
};

//帖子
const switchTab = (tab) => {
  currentTab.value = tab;
};

const getTabName = (tab) => {
  const names = { my_posts: '发表的帖子', favorites: '收藏的帖子', likes: '点赞的帖子', comments: '评论的帖子' };
  return names[tab] || '';
};
// 【大模型对接路由】：跳转至兽医AI大模型对话页
const goToVetAI = () => {
  uni.navigateTo({
    url: '/pages/ai-chat/vet_ai' // 💡 你可以在 pages 目录下新建一个简单的聊天室组件
  });
};

//更换头像
const changeAvatar = () => {
  if (!isLogin.value) {
    return uni.showToast({ title: '请先登录后再修改头像', icon: 'none' });
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'], // 压缩图提高上传速度
    sourceType: ['album', 'camera'],
    success: (res) => {
      uni.showLoading({ title: '头像上传中...' });
      const tempFilePath = res.tempFilePaths[0];
      
      // 1. 上传至 uniCloud 云存储
      uniCloud.uploadFile({
        filePath: tempFilePath,
        cloudPath: `avatars/user_${currentUserId.value}_${Date.now()}.jpg`,
        success: async (uploadRes) => {
          const fileID = uploadRes.fileID;
          
          try {
            // 2. 将云存储中的 fileID 更新到你的自定义用户表中
            const db = uniCloud.database();
            await db.collection('users-selfcreate').doc(currentUserId.value).update({
              avatar: fileID
            });
            
            // 3. 同步更新前端视图渲染
            userInfo.value.avatar = fileID;
            uni.hideLoading();
            uni.showToast({ title: '头像修改成功', icon: 'success' });
          } catch (dbErr) {
            uni.hideLoading();
            uni.showToast({ title: '更新数据库失败', icon: 'none' });
          }
        },
        fail: (err) => {
          uni.hideLoading();
          uni.showToast({ title: '上传云端失败', icon: 'none' });
        }
      });
    }
  });
};

const doLogout = () => {
	uni.showModal({
		title:'提示',
		content:'确定要退出当前账号吗？',
		success:(res) =>{
			if(res.confirm){
				uni.removeStorageSync('current_uid');
				checkLoginStatus();
				uni.showToast({
					title:'已安全退出',
					icon:'success'
				});
			}
		}
	})
};

const goToCatDetail = (catId) => {
  if(!catId) return;
  uni.navigateTo({ url: `/pages/cat-detail/cat-detail?id=${catId}` });
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};
</script>

<style>
.profile-container { background: #f8f8f8; min-height: 100vh; }
.user-header { 
  padding: 60px 20px 30px; /* 增加一点上边距避开刘海屏 */
  display: flex; 
  align-items: center; 
}
.avatar { width: 70px; height: 70px; border-radius: 35px; border: 2px solid #fff; margin-right: 15px; background: #eee;}
.nickname { font-size: 20px; font-weight: bold; margin-bottom: 5px; display: block; }
.credit-tag { background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 10px; font-size: 12px; display: inline-block; }
.sub-text { font-size: 14px; opacity: 0.8; }

.auth-box { display: flex; flex-direction: column; }
.auth-btn-group { display: flex; align-items: center; margin-top: 6px; }
.auth-action-btn { font-size: 14px; color: #666; font-weight: 500; padding: 4px 0; }
.auth-action-btn:active { opacity: 0.7; }
.auth-split-line { margin: 0 16px; color: #ddd; font-size: 14px; }

.stats-panel { background: #fff; display: flex; padding: 15px 0; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.stat-item { flex: 1; text-align: center; }
.stat-num { display: block; font-size: 20px; font-weight: bold; color: #333; margin-bottom: 5px; }
.stat-label { font-size: 14px; color: #999; padding-bottom: 5px; }
.stat-label.active { color: #f06c7a; border-bottom: 2px solid #f06c7a; }

.cat-list { padding: 10px; height: calc(100vh - 200px); }
.cat-item { background: #fff; padding: 15px; border-radius: 10px; display: flex; margin-bottom: 10px; align-items: center; }
.cat-cover { width: 60px; height: 60px; border-radius: 8px; margin-right: 15px; background: #eee; }
.cat-info { flex: 1; }
.cat-name { font-size: 16px; font-weight: bold; display: block; margin-bottom: 5px; }
.cat-status { font-size: 13px; color: #666; display: block; margin-bottom: 5px; }
.cat-time { font-size: 12px; color: #999; }
.empty-state { text-align: center; color: #999; margin-top: 50px; font-size: 14px; }

/* 【新增样式】：大模型AI广告条 */
.ai-banner { margin: 15px; background: linear-gradient(135deg, #2A9D8F, #264653); padding: 15px; border-radius: 16rpx; display: flex; justify-content: space-between; align-items: center; color: white; box-shadow: 0 6rpx 15rpx rgba(42, 157, 143, 0.2); }
.ai-title { font-size: 15px; font-weight: bold; display: block; margin-bottom: 4px; }
.ai-desc { font-size: 12px; opacity: 0.85; }
.ai-go { font-size: 12px; background: rgba(255,255,255,0.2); padding: 6rpx 16rpx; border-radius: 30rpx; font-weight: bold; white-space: nowrap; }

.section-title { font-size: 14px; font-weight: bold; color: #666; margin: 15px 15px 5px; }

/* 宫格视觉面板结构 */
.grid-panel { background: #fff; margin: 0 15px 15px; display: flex; border-radius: 16rpx; padding: 12px 0; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.02); }
.grid-item { flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 6px 0; }
.grid-num { font-size: 20px; font-weight: bold; color: #2A9D8F; margin-bottom: 4px; }
.grid-icon { font-size: 20px; margin-bottom: 6px; }
.grid-label { font-size: 12px; color: #777; }
.grid-item.active .grid-label { color: #E76F51; font-weight: bold; }
.grid-item.active::after { content: ''; position: absolute; bottom: -6px; width: 20px; height: 3px; background: #E76F51; border-radius: 2px; }
.social-grid .grid-item { border-right: 1px solid #f5f5f5; }
.social-grid .grid-item:last-child { border-right: none; }
/* 退出按钮样式 */
.logout-btn {
	margin: 20px;
	background: #fff;
	color: #999;
	font-size: 14px;
	border-radius: 20px;
	border: 1px solid #eee;
}
</style>