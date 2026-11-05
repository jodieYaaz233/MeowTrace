<template>
  <view class="form-container">
    <image :src="formData.coverImage" class="cover-img" mode="aspectFill"></image>
    
    <view class="input-group">
      <text>给它起个名字：</text>
      <input class="input-box" v-model="formData.name" placeholder="想要一个好听的名字！" />
    </view>

    <view class="input-group">
      <text>当前位置：</text>
      <view class="info-box">{{ formData.address }}</view>
    </view>
	<view class="discription">
		<text>描述猫咪：</text>
		<input class="info-box" v-model="formData.discription" placeholder="描述一下这只喵">
	</view>
    <view class="input-group">
      <text>初次发现状态：</text>
      <picker @change="onStatusChange" :value="statusIndex" :range="statusArray">
        <view class="info-box">{{ statusArray[statusIndex] }}</view>
      </picker>
    </view>
	<view v-if="showOtherInput" class="input-group">
	  <text>状态描述：</text>
	  <input text="text" class="input-box" v-model="otherStatusDesc" placeholder="请输入状态描述" />
	</view>
    <button class="submit-btn" @click="submitCat">建立档案</button>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// #ifdef MP-WEIXIN
const QQMapWX = require('../../static/qqmap-wx-jssdk.js');
// #endif
const statusArray = ['健康', '瘦弱', '生病', '受伤', '怀孕', '疑似绝育','其他'];
const statusIndex = ref(0);
const showOtherInput = ref(false);
const otherStatusDesc = ref('');
const currentLocationName = ref('正在获取位置……'); //用于页面显示的地址文字
const manualLocation = ref(null);

const formData = reactive({
  coverImage: '',
  name: '',
  address: '正在获取定位...',
  discription:'',
  longitude: 0,
  latitude: 0,
  status: '健康'
});

//状态改变时的处理函数
const onStatusChange = (e) => {
	formData.status = statusArray[e.detail.value];
  const index = e.detail.value;
  statusIndex.value = index;
  
// 判断是否选择了"其他"（索引为6）
  if (statusArray[index] === '其他') {
    showOtherInput.value = true;
  } else {
    showOtherInput.value = false;
    otherStatusDesc.value = ''; // 清空描述
  }
}


// 接收AI识别页传来的图片
onLoad((options) => {
  if (options.img) formData.coverImage = decodeURIComponent(options.img);
  if(options.lat && options.lng){
	  manualLocation.value={
		  latitude:parseFloat(options.lat),
		  longitude:parseFloat(options.lng)
	  };
	  getAddressByTencentMap(manualLocation.value.latitude,manualLocation.value.longitude);
  }else{getLocation();}
});

const getLocation = () => {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
		formData.latitude = res.latitude;
		formData.longitude = res.longitude;
      //这里调用腾讯地图API将经纬度转为文字地址
      getAddressByTencentMap(formData.latitude,formData.longitude);
    }
  });
};

	//逆地理编码函数
	const getAddressByTencentMap = (latitude,longitude) => {
		// #ifdef MP-WEIXIN
		const qqMapsdk = new QQMapWX({
			key: '4NJBZ-UBI67-5OUX2-P5EUF-I3G7T-C4BQC'
		});
		console.log(latitude,longitude);
		qqMapsdk.reverseGeocoder({
		    location: {
		      latitude: latitude,
		      longitude: longitude
	},
	success: (res) => {
	      console.log('逆地址解析成功：', res);
	      // res.result.address 就是类似 "陕西省西安市雁塔区xx路" 的标准地址
	      const address = res.result.address; 
		  formData.address = address;
		  currentLocationName.value = address;
	    },
	    fail: (error) => {
	      console.error('逆地址解析失败：', error);
	    }
	  });
	  // #endif
	  
	  //在APP端
	  // #ifdef APP-PLUS
	  const key = '4NJBZ-UBI67-5OUX2-P5EUF-I3G7T-C4BQC';
	  	uni.request({
	  		url: 'https://apis.map.qq.com/ws/geocoder/v1/',
	  		method: 'GET',
	  		data: {
	  			location: `${latitude},${longitude}`, // 格式要求：纬度,经度
	  			key: key,
	  			get_poi: 0 // 是否返回周边POI列表：0不返回，1返回
	  		},
	  		success: (res) => {
	  			// HTTP 请求成功，且腾讯接口返回 status === 0 代表解析成功
	  			if (res.statusCode === 200 && res.data && res.data.status === 0) {
	  				console.log('逆地址解析成功：', res.data);
	  				// res.data.result.address 就是类似 "陕西省西安市雁塔区xx路" 的标准地址
	  				const address = res.data.result.address;
	  				formData.address = address;
	  				currentLocationName.value = address;
	  			} else {
	  				console.error('逆地址解析接口返回异常：', res.data);
	  				currentLocationName.value = '未知位置（解析受限）';
	  			}
	  		},
	  		fail: (error) => {
	  			console.error('逆地址解析网络请求失败：', error);
	  			currentLocationName.value = '位置获取失败';
	  		}
	  	});
	  // #endif
	};

// 获取完整状态值（包含其他状态的描述）
const getFullStatus = () => {
  const selectedStatus = statusArray[statusIndex.value];
  if (selectedStatus === '其他' && otherStatusDesc.value) {
    return `其他：${otherStatusDesc.value}`;
  }
  return selectedStatus;
}

// 在提交表单时使用
const submitForm = () => {
  const finalStatus = getFullStatus();
  console.log('最终状态:', finalStatus);
  // 其他提交逻辑...
}

const submitCat = async () => {
  if (!formData.name) return uni.showToast({ title: '请填写名字', icon: 'none' });
  // 从缓存获取当前自定义登录的用户ID
    const currentUserId = uni.getStorageSync('current_uid');
    if (!currentUserId) {
      return uni.showModal({
        title: '提示',
        content: '请先登录后再建立猫咪档案',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: '/pages/profile_written/login' });
          }
        }
      });
    }
  const finalLat = manualLocation.value ? manualLocation.value.latitude : formData.latitude;
  const finalLng = manualLocation.value ? manualLocation.value.longitude : formData.longitude;
  // 验证是否为有效数字
  if (isNaN(finalLat) || isNaN(finalLng)) {
    return uni.showToast({ title: '经纬度无效', icon: 'none' });
  }
  uni.showLoading({ title: '建档中...' });
  //寻找此用户的用户名与头像
  const db = uniCloud.database();
  const userRes = await db.collection('users-selfcreate').doc(currentUserId).field({ nickname: true, avatar: true }).get({ getOne: true });
  let authorName = '热心喵友';
  let authorAvatar = '';
  if (userRes.result.data) {
    authorName = userRes.result.data.nickname;
    authorAvatar = userRes.result.data.avatar;
  }
  
  try {
	  const finalStatus = getFullStatus();
	//放入猫咪档案
    const res = await db.collection('cats').add({
      name: formData.name,
      cover_image: formData.coverImage,
	  discription:formData.discription,
	  status:[finalStatus],
      latest_status: finalStatus,
      location: new db.Geo.Point(finalLng,finalLat),
      address: formData.address,
	  creator_id:currentUserId
    });
	//添加猫咪后，在社区同时发表帖子
    const res2 = await db.collection('posts').add({
		content:formData.discription,
		image_url:formData.coverImage,
		linked_cat_name:formData.name,
		linked_cat_id:res.result.id,
		location_name:formData.address,
		user_id:currentUserId,
		author_name:authorName,
		author_avatar:authorAvatar
	});
    uni.hideLoading();
    uni.showToast({ title: '档案建立成功!' });
    // 建档成功后，跳往这只猫的详情页
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/cat-detail/cat-detail?id=${res.result.id}` });
    }, 1500);
  } catch (e) {
	  console.log(e);
    uni.hideLoading();
	uni.showModal({
	    title: '提交失败',
	    content: e.message || JSON.stringify(e),
	    showCancel: false
	  });
  }
};
</script>

<style>
.form-container { padding: 20px; }
.cover-img { width: 100%; height: 200px; border-radius: 12px; margin-bottom: 20px; }
.input-group { margin-bottom: 20px; }
.input-box, .info-box { background: #f5f5f5; padding: 12px; border-radius: 8px; margin-top: 8px; }
.submit-btn { background: #f06c7a; color: #fff; margin-top: 40px; }
</style>