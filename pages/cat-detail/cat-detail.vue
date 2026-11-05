<template>
  <view class="detail-container" v-if="catInfo">
    <image :src="catInfo.cover_image" class="header-img" mode="aspectFill"></image>
    
    <view class="info-card">
      <text class="cat-name">{{ catInfo.name }}</text>
      <text class="cat-status">最新状态: {{ catInfo.latest_status }}</text>
      <text class="cat-address">常出没于: {{ catInfo.address }}</text>
    </view>

    <view class="action-buttons">
      <button class="btn btn-outline" @click="goAddRecord('status')">📝 新增状态</button>
      <button class="btn btn-solid" @click="goAddRecord('rescue')">❤️ 进行救助</button>
    </view>
	<view class="history-section">
	      <view class="section-title">最近救助记录</view>
	      
	      <view v-if="catInfo.rescue_history && catInfo.rescue_history.length > 0">
	        <view class="history-item" v-for="(item, index) in [...catInfo.rescue_history].reverse().slice(0, 5)" :key="index">
	          <view class="item-left">
	            <text class="action-tag">{{ item.action_type }}</text>
	            <text class="action-time">{{ formatDate(item.create_time) }}</text>
	          </view>
	          <text class="action-note">{{ item.note || '无备注' }}</text>
	        </view>
	      </view>
	      
	      <view v-else class="empty-tip">暂无记录，快去救助它吧~</view>
	    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad,onShow} from '@dcloudio/uni-app';

const catId = ref('');
const catInfo = ref(null);

//只负责接受一次参数
onLoad((options) => {
  catId.value = options.id;
  fetchCatDetail();
});

//onShow每次页面显示都执行数据拉取
onShow(()=>{
	if(catId.value){
		fetchCatDetail();
	}
});

// 格式化时间戳
const formatDate = (tm) => {
  if (!tm) return '';
  const date = new Date(tm);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}
const fetchCatDetail = async () => {
  const db = uniCloud.database();
  try{
  const res = await db.collection('cats').doc(catId.value).get();
  if (res.result.data.length > 0) {
	catInfo.value = res.result.data[0];
  };
}catch(e){
	console.error("获取详情失败",e);
}}

const goAddRecord = (type) => {
  uni.navigateTo({
    url: `/pages/add-record/add-record?catId=${catId.value}&type=${type}`
  });
};
</script>

<style>
.detail-container { background: #f8f8f8; min-height: 100vh; }
.header-img { width: 100%; height: 280px; }
.info-card { 
  margin: -40px 15px 20px; /* 原来是 -20px，加大重叠幅度让页面更紧凑 */
  padding: 24px; 
  position: relative; 
  display: flex; 
  flex-direction: column; 
}
.cat-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
.cat-status { color: #f06c7a; font-weight: bold; margin-bottom: 5px; }
.cat-address { color: #666; font-size: 14px; }
.action-buttons { display: flex; padding: 0 15px; justify-content: space-between; }
.btn { width: 45%; border-radius: 25px; font-size: 16px; }
.btn-outline { border: 1px solid #f06c7a; color: #f06c7a; background: #fff; }
.btn-solid { background: #f06c7a; color: #fff; }

/*救助记录区域样式 */
.history-section { margin: 0 15px; background: #fff; border-radius: 12px; padding: 20px; }
.section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; }
.history-item { 
  border-bottom: 1rpx solid #eee; 
  padding: 12px 0; 
}
.history-item:last-child { border-bottom: none; }
.item-left { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.action-tag { 
  background: #fff0f1; 
  font-size: 12px; 
  padding: 2px 8px; 
  border-radius: 4px; 
  font-weight: bold;
}
.action-time { font-size: 12px; }
.action-note { font-size: 14px; line-height: 1.4; }
.empty-tip { text-align: center;padding: 20px 0; font-size: 14px; }
</style>