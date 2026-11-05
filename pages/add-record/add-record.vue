<template>
  <view class="form-container">
    <view class="header-title">
      {{ isStatusType ? '报告猫咪最新状态' : '记录一次救助行为' }}
    </view>

    <block v-if="isStatusType">
      <view class="input-group">
        <text>它现在的状态如何？</text>
        <input class="input-box" v-model="formData.statusDesc" placeholder="例如：腿瘸了、很健康在睡觉" />
      </view>
    </block>

    <block v-else>
      <view class="input-group">
        <text>救助类型：</text>
        <picker @change="onActionChange" :value="actionIndex" :range="actionArray">
          <view class="input-box">{{ actionArray[actionIndex] }}</view>
        </picker>
      </view>
      <view class="input-group">
        <text>救助详情：</text>
        <textarea class="text-box" v-model="formData.memo" placeholder="例如：花了100块钱带去打疫苗..."></textarea>
      </view>
    </block>

    <button class="submit-btn" @click="submitRecord">提交记录</button>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const catId = ref('');
const recordType = ref(''); // 'status' | 'rescue'
const isStatusType = ref(true);

const actionArray = ['投喂', '送医', '绝育', '驱虫', '洗澡'];
const actionIndex = ref(0);

const formData = reactive({
  statusDesc: '',
  action: '投喂',
  memo: ''
});

onLoad((options) => {
  catId.value = options.catId;
  recordType.value = options.type;
  isStatusType.value = options.type === 'status';
});

const onActionChange = (e) => {
  actionIndex.value = e.detail.value;
  formData.action = actionArray[actionIndex.value];
};

const submitRecord = async () => {
	const currentUserId = uni.getStorageSync('current_uid');
	  if (!currentUserId) {
	    return uni.showModal({
	      title: '提示',
	      content: '请先登录后再提交记录',
	      confirmText: '去登录',
	      success: (res) => {
	        if (res.confirm) {
	          uni.navigateTo({ url: '/pages/profile_written/login' });
	        }
	      }
	    });
	  }
  const db = uniCloud.database();
  uni.showLoading({ title: '提交中' });

  try {
	  let res = null;
    if (isStatusType.value){
		//封装状态更新参数
      // 1. 新增状态逻辑：写入 updates 表，并更新 cats 主表的最新状态
      res = await uniCloud.callFunction({
        name: 'update_status',
        data: {
          catId: catId.value,
          lastStatus: formData.statusDesc,
        }
      });
    } else {
		let payload = {
			catId :catId.value,
			userId:currentUserId
		}
		payload.rescueItem ={
			action:formData.action,
			memo:formData.memo
		}
		// 2. 救助记录逻辑：更新cats表中的history数组
		res = await uniCloud.callFunction({
			name:'update_rescue',
			data:payload
		});
    }
	if(res && res.result && (res.result.updated >= 0 || res.result.success!==false)){
		uni.hideLoading();
		uni.showToast({title:'提交成功'});
		setTimeout(()=>{
			uni.navigateBack();
		},1500);
		
	}else{
		throw new Error(res.result.msg || '更新失败');
	}
  } catch (e) {
    uni.hideLoading();
	console.log(e);
    uni.showToast({ title: '提交失败', icon: 'none' });
	return;
  }
};
</script>

<style>
.form-container { padding: 20px; }
.header-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #333; }
.input-group { margin-bottom: 20px; }
.input-box { background: #f5f5f5; padding: 12px; border-radius: 8px; margin-top: 8px; }
.text-box { background: #f5f5f5; padding: 12px; border-radius: 8px; margin-top: 8px; width: 100%; box-sizing: border-box; height: 100px; }
.submit-btn { background: #f06c7a; color: #fff; margin-top: 30px; }
</style>