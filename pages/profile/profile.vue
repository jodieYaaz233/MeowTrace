<template>
  <view class="profile-container">
    <view class="user-header">
      <image class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
      <view class="info" v-if="store.hasLogin">
        <text class="nickname">{{ store.userInfo.nickname || '微信用户'}}</text>
        <view class="credit-tag">信誉积分: {{ store.userInfo.credit_score || 100 }}</view>
      </view>
      <view class="info" v-else @click="doLogin">
        <text class="nickname">点击登录/注册</text>
        <text class="sub-text">登录后参与救助网络</text>
      </view>
    </view>

    <view class="stats-panel">
      <view class="stat-item" @click="currentTab = 'registered'">
        <text class="stat-num">{{ registeredCats.length }}</text>
        <text class="stat-label" :class="{ active: currentTab === 'registered' }">我登记的</text>
      </view>
      <view class="stat-item" @click="currentTab = 'rescued'">
        <text class="stat-num">{{ rescuedCats.length }}</text>
        <text class="stat-label" :class="{ active: currentTab === 'rescued' }">我救助的</text>
      </view>
    </view>

    <scroll-view scroll-y class="cat-list">
      <view class="cat-item" v-for="cat in displayList" :key="cat._id" @click="goToCatDetail(cat.cat_id || cat._id)">
        <image class="cat-cover" :src="cat.cover_image" mode="aspectFill"></image>
        <view class="cat-info">
          <text class="cat-name">{{ cat.name }}</text>
          <text class="cat-status">最新状态: {{ cat.latest_status || cat.action_type }}</text>
          <text class="cat-time">{{ formatTime(cat.create_time) }}</text>
        </view>
      </view>
      <view class="empty-state" v-if="displayList.length === 0">
        <text>暂无相关记录</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
// 引入 uni-id 的便捷工具
import { store } from '@/uni_modules/uni-id-pages/common/store.js'

// 使用 store 中的状态代替我们自己写的响应式变量
// store.hasLogin 就是是否登录的布尔值
// store.userInfo 就是当前用户的信息

const isLogin = ref(false);
const userInfo = ref({});
const currentTab = ref('registered'); // 'registered' | 'rescued'

const registeredCats = ref([]);
const rescuedCats = ref([]);

// 根据当前 Tab 动态返回展示列表
const displayList = computed(() => {
  return currentTab.value === 'registered' ? registeredCats.value : rescuedCats.value;
});

onMounted(() => {
  checkLoginStatus();
});

const checkLoginStatus = () => {
  // 实际项目中应检查 uni.getStorageSync('token')
  // const user = uni.getStorageSync('userInfo');
  // if (user) {
  //   isLogin.value = true;
  //   userInfo.value = user;
  //   fetchMyRecords();
  // }
  if(store.hasLogin){
	  //如果登录了，直接获取救助过的猫咪
	  fetchMyRecords();
	  isLogin.value = true;
	  userInfo.value = store.userInfo;
  }
};

const doLogin = () => {
	uni.navigateTo({
		//跳转到uni-id自带的一键登录/注册页面
		url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
	})
  // 模拟登录逻辑
  // uni.showLoading({ title: '登录中' });
  // setTimeout(() => {
  //   uni.hideLoading();
  //   isLogin.value = true;
  //   userInfo.value = { nickname: '爱猫达人', credit_score: 105, avatar: '' };
  //   uni.setStorageSync('userInfo', userInfo.value);
  //   fetchMyRecords();
  // }, 1000);
};

const fetchMyRecords = async () => {
  const db = uniCloud.database();
  try {
    // 1. 获取我登记的猫咪 (假设 users 表或 cats 表里有 creator_id)
    // const regRes = await db.collection('cats').where({ creator_id: uniCloud.getCurrentUserInfo().uid }).limit(20).get();
    // registeredCats.value = regRes.result.data;
	const regRes = await db.collection('cats')
      .orderBy('create_time desc') // 按时间倒序，最新的在前
      .limit(50) 
      .get();
    registeredCats.value = regRes.result.data;
    // 2. 获取我救助的猫咪 (查询 rescue_records 表)
    // const rescueRes = await db.collection('rescue_records').where({ user_id: uniCloud.getCurrentUserInfo().uid }).limit(20).get();
    // rescuedCats.value = rescueRes.result.data;
	const rescueRes = await db.collection('rescue_records')
	      .orderBy('create_time desc')
	      .limit(50)
	      .get();
	    rescuedCats.value = rescueRes.result.data;
	
	    uni.hideLoading();
  } catch (e) {
    console.error("获取记录失败", e);
  }
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
</style>