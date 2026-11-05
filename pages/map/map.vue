<template>
	<view class = "container" :style="mapSizeStyle">
		<!-- 非 App 端（如微信小程序）：保留直接点击地图任意位置选点 -->
				<!-- #ifndef APP-PLUS -->
				<map 
					id = "myMap"
					class="map" 
					:style="mapSizeStyle"
					:latitude="latitude" 
					:longitude="longitude"
					:markers="markers"
					show-location
					@markertap="onMarkerTap"
					@tap="onMapTap"
				></map>
				<!-- #endif -->
				
		<!-- #ifdef APP-PLUS -->
		<map 
		      id="myMap"
			  class="map" 
		      :style="mapSizeStyle"
		      :latitude="latitude" 
		      :longitude="longitude"
			  :markers="markers"
		      show-location
		      @markertap="onMarkerTap"
			  @tap="onMapTap"
		    ></map>
		<!-- 屏幕中心固定地标按钮（背景透明） -->
		<view class="center-marker-wrap" @click="addCatAtCenter">
					<!-- 地标图案主体（水滴形渐变地标） -->
					<view class="pin-icon">
						<view class="pin-inner"></view>
					</view>
					<!-- 地标针尖投射在地面上的小阴影（精准对齐地图中心点） -->
					<view class="pin-shadow"></view>
					<!-- 下方一行小字 -->
					<view class="pin-label">点我标记</view>
		</view>
		<!-- #endif -->
		<view class = "refresh-location-btn"
		:class = "{'is-locating':locating}"
		@click.stop="refreshLocation"
		>
		<image
		class = "refresh-location-icon"
		src = "/static/refresh-icon.png"
		mode = "aspectFit"
		/>
		</view>
		<view class="action-bar">
		      <button class="mark-btn" @click="goToRecognize">发现了猫咪?📷快记下来!</button>
		</view>
	</view>
</template>

<script setup>
	import { computed, ref, onMounted} from 'vue';
	import {onShow, onResize,onUnload} from '@dcloudio/uni-app';
	import { getCurrentInstance } from 'vue';
	
	// App 原生地图使用明确的像素尺寸，避免百分比尺寸未生效时退回默认大小。
	const windowSize = ref(uni.getSystemInfoSync());
	const instance = getCurrentInstance();
	const mapSizeStyle = computed(() => ({
		width: `${windowSize.value.windowWidth}px`,
		height: `${windowSize.value.windowHeight}px`
	}));
	onResize(({ size }) => {
		windowSize.value = size;
	});
	// #ifdef MP-WEIXIN
	const QQMapWX = require('../../static/qqmap-wx-jssdk.js');
	// #endif
	const latitude = ref(39.909); //默认北京天安门
	const longitude = ref(116.397);
	const currentLocationName = ref('正在获取位置……'); //用于页面显示的地址文字
	const markers = ref([]);
	//用于刷新按钮的旋转动画，也用于防止重复点击
	const locating = ref(false);
	//标记是否同时onMounted and mounted,防止重复启动监听
	let locationUpdating = false;
	// 页面加载时获取位置并加载附近猫咪
	onMounted(() => {
		uni.onLocationChange(updateLocation);
		refreshLocation();
	 //实时定位刷新
	 // uni.startLocationUpdate({
		//  success:() => {
		// 	 uni.onLocationChange((res) => {
		// 		 latitude.value = res.latitude;
		// 		 longitude.value = res.longitude;
		// 		 loadNearbyCats(res.latitude,res.longitude);
		// 	 });
		//  },
		//  fail:(err)=>{
		// 	 console.error('开启实时定位失败',err);
		//  }
	 // })
	 
	});
	//使用onShow确保每次返回地图页都刷新猫咪位置
	onShow(()=>{
		windowSize.value = uni.getSystemInfoSync();
		loadNearbyCats();
	})
	onUnload(() => {
		uni.offLocationChange(updateLocation);
		if(locationUpdating){
			uni.stopLocationUpdate({});
			locationUpdating = false;
		}
	});
	//首次定位，手动刷新，实时定位共用
	const updateLocation = (res) => {
		latitude.value = res.latitude;
		longitude.value = res.longitude;
	}
	
	//支持手动刷新位置信息
	const refreshLocation = () => {
		if(locating.value) return;
		const startedAt = Date.now();
		locating.value = true;
		uni.getLocation({
			type:'gcj02',
			isHighAccuracy:true,
			success: (res) => {
			updateLocation(res);

			// 即使用户没有移动，也将拖动过的地图移回当前位置
			const mapCtx = uni.createMapContext('myMap', instance.proxy);
			mapCtx.moveToLocation({
				latitude: res.latitude,
				longitude: res.longitude
			});
			// 首次成功定位后开启实时定位；
			// 如果之前启动失败，点击刷新时可以再次尝试
			if (!locationUpdating){
				locationUpdating = true;
				uni.startLocationUpdate({
					type: 'gcj02',
					fail: (err) => {
						locationUpdating = false;
						console.error('开启实时定位失败', err);
						
						uni.showToast({
							title: '当前位置已更新，实时定位未开启',
							icon: 'none'
						});
					}
				});
			}
		},
		fail:(err) => {
			console.error('刷新定位失败',err);
			uni.showToast({
				title:'定位失败，请检查定位权限和定位服务',
				icon:'none'
			});
		},
		complete:() => {
			const elapsed = Date.now() - startedAt;
			//为了让每次点击都有动画，一圈为900ms，动画至少展示900ms
			const remaining = Math.max(0,900 - elapsed);
			setTimeout(() => {
				locating.value = false;
			},remaining);
		}
		});
	};
		
			
	// 击中心地标图案，获取当前地图正中心坐标并跳转标记
	// #ifdef APP-PLUS
	const addCatAtCenter = () => {
	  const mapCtx = uni.createMapContext('myMap', instance.proxy);
	  mapCtx.getCenterLocation({
	    success: (res) => {
	      console.log('当前地图中心经纬度：', res.latitude, res.longitude);
	      uni.showModal({
	        title: '发现猫咪',
	        content: '是否在此处添加猫咪？',
	        confirmText: '去标记',
	        cancelText: '取消',
			confirmColor: '#E76F51',
	        success: (modalRes) => {
	          if (modalRes.confirm) {
	            uni.navigateTo({
	              url: `/pages/recognize/recognize?lat=${res.latitude}&lng=${res.longitude}`
	            });
	          }
	        }
	      });
	    },
	    fail: (err) => {
	      console.error('获取中心点失败：', err);
		  uni.showToast({ title: '获取位置失败，请稍后重试', icon: 'none' });
	    }
	  });
	};
	// #endif
	
	//逆地理编码函数
	// #ifdef MP-WEIXIN
	const getAddressByTencentMap = (latitude,longitude) => {
		const qqMapsdk = new QQMapWX({
			key: '4NJBZ-UBI67-5OUX2-P5EUF-I3G7T-C4BQC'
		});
		qqMapsdk.reverseGeocoder({
		    location: {
		      latitude: latitude,
		      longitude: longitude
	},
	success: (res) => {
	      console.log('逆地址解析成功：', res);
	      // res.result.address 就是类似 "陕西省西安市雁塔区xx路" 的标准地址
	      currentLocationName.value = res.result.address; 
	    },
	    fail: (error) => {
	      console.error('逆地址解析失败：', error);
	    }
	  });
	};
	// #endif
	// 处理定位错误
	const handleLocationError = (err) => {
		const errMsg = err.errMsg || ''
		
		// 用户拒绝授权
		if (errMsg.includes('auth deny') || errMsg.includes('authorize')) {
			uni.showModal({
				title: '需要位置权限',
				content: '为了帮你发现附近的猫咪，请允许获取你的位置信息',
				confirmText: '去设置',
				success: (res) => {
					if (res.confirm) {
						uni.openSetting({
							success: (settingRes) => {
								if (settingRes.authSetting['scope.userLocation']) {
									getUserLocation()
								} else {
									uni.showToast({ title: '已使用默认位置', icon: 'none' })
									loadNearbyCats(latitude.value, longitude.value)
								}
							}
						})
					} else {
						uni.showToast({ title: '已使用默认位置', icon: 'none' })
						loadNearbyCats(latitude.value, longitude.value)
					}
				}
			})
		}
		// 定位超时
		else if (errMsg.includes('timeout')) {
			uni.showModal({
				title: '定位超时',
				content: '网络或GPS信号较弱，是否手动选择位置?',
				confirmText: '是',
				cancelText: '否',
				success: (res) => {
					if (res.confirm) {
						chooseLocationManually()
					} else {
						loadNearbyCats(latitude.value, longitude.value)
					}
				}
			})
		}
		// 其他错误
		else {
			uni.showModal({
				title: '定位失败',
				content: '无法获取你的位置，是否手动选择？',
				confirmText: '手动选择',
				cancelText: '使用默认位置',
				success: (res) => {
					if (res.confirm) {
						chooseLocationManually()
					} else {
						loadNearbyCats(latitude.value, longitude.value)
					}
				}
			})
		}
	}
	
	// 手动选择位置
	const chooseLocationManually = () => {
		uni.chooseLocation({
			success: (res) => {
				console.log('手动选择位置', res)
				latitude.value = res.latitude
				longitude.value = res.longitude
				loadNearbyCats(res.latitude, res.longitude)
			},
			fail: (err) => {
				console.error('手动选点失败', err)
				uni.showToast({ title: '已使用默认位置', icon: 'none' })
				loadNearbyCats(latitude.value, longitude.value)
			}
		})
	}
	// 模拟从数据库获取猫咪列表
	const loadNearbyCats = async (lat, lng) => {
	  try {
	    const db = uniCloud.database();
	    const res = await db.collection('cats').limit(50).get();
	    
		//映射数据库字段到地图markers格式
		markers.value = res.result.data.map((cat,index) => {
			//uniCloud 的 location 字段通常是 { type: "Point", coordinates: [lng, lat] }
			// coordinates[0] 是经度，coordinates[1] 是纬度
			return{
					id:index,//marker的内部id
					catId:cat._id,
					latitude:cat.location.coordinates[1],
					longitude:cat.location.coordinates[0],
					iconPath:'/static/tabbar/cat-icon.png',
					width:40,
					height:40,
					//显示出来有点丑 后面优化再说吧
					// callout:{
					// 	content:cat.name,
					// 	color:'#ffffff',
					// 	fontSize: 12,
					// 	borderRadius: 5,
					// 	backgroundColor: '#f06c7a',
					// 	padding: 5,
					// 	display: 'ALWAYS' // 常显名字
					// }
				};
			});
	  } catch (e) {
	    console.error(e);
	  }
	};
	
	// 点击地图上的猫咪图标，跳转至档案页
	const onMarkerTap = (e) => {
	  const marker = markers.value.find(m => m.id === e.detail.markerId);
	  if (marker && marker.catId) {
	    uni.navigateTo({ url: `/pages/cat-detail/cat-detail?id=${marker.catId}` });
	  }
	};
	
	// 小程序返回 latitude/longitude，App 原生 Point 可能返回 lat/lng。
	const getMapTapLocation = (detail = {}) => {
		const toNumber = (value) => {
			if (typeof value === 'number') return value;
			if (typeof value === 'string' && value.trim() !== '') return Number(value);
			return NaN;
		};
		const lat = toNumber(detail.latitude ?? detail.lat ??
			(typeof detail.getLat === 'function' ? detail.getLat() : undefined));
		const lng = toNumber(detail.longitude ?? detail.lng ??
			(typeof detail.getLng === 'function' ? detail.getLng() : undefined));
		if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
			lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
		return { latitude: lat, longitude: lng };
	};
	//点击地图任一位置标记猫咪
	const onMapTap = (e) => {
		const detail = e?.detail ?? {};
		console.log('地图事件类型：', e?.type);
		try {
				console.log('地图事件详情：', JSON.stringify(detail));
			} catch (err) {
				console.log('地图事件字段：', Object.keys(detail).join(','));
			}
		const location = getMapTapLocation(detail);
		if (!location) {
			console.warn('地图点击坐标无效，事件字段：', Object.keys(detail).join(','));
			uni.showToast({ title: '坐标无效，请重新选点', icon: 'none' });
			return;
		}
		const { latitude: clickLat, longitude: clickLng } = location;
		console.log('点击位置：',clickLat,clickLng);
		uni.showModal({
			title:'提示',
			content:'是否在此处添加猫咪？',
			confirmText:'去标记',
			cancelText:'取消',
			success:(res) => {
				if(res.confirm){
					//跳转至add-cat页面并传递当前坐标
					uni.navigateTo({
						url:`/pages/recognize/recognize?lat=${clickLat}&lng=${clickLng}`
					})
				}
			}
		})
	}
	// 点击一键标记，跳转至AI识别页
	const goToRecognize = () => {
	  uni.navigateTo({ url: '/pages/recognize/recognize' });
	};
</script>

<style>
.container { position: relative; overflow: hidden; }
.map { width: 100%; height: 100%; }
.action-bar { position: absolute; bottom: 40px; width: 100%; display: flex; justify-content: center; }
.mark-btn { background-color: #f06c7a; color: white; border-radius: 30px; padding: 0 40px; font-weight: bold; box-shadow: 0 4px 10px rgba(240, 108, 122, 0.4); }
/* ========== 中心地标按钮（背景全透明） ========== */
.center-marker-wrap {
	position: absolute;
	top: 50%;
	left: 50%;
	/* 让地标针尖（阴影处）刚好对齐地图正中心 50% 50% */
	transform: translate(-50%, -44px);
	display: flex;
	flex-direction: column;
	align-items: center;
	background: transparent; /* 确保外层容器完全透明 */
	z-index: 20;
	padding: 6px;
	transition: transform 0.18s ease;
}

/* 点击时的按压下沉反馈 */
.center-marker-wrap:active {
	transform: translate(-50%, -40px) scale(0.95);
}

/* 纯CSS绘制水滴形地标图案：使用 App.vue 活力橙渐变 */
.pin-icon {
	width: 36px;
	height: 36px;
	background: linear-gradient(135deg, var(--orange, #E76F51) 0%, var(--orange-light, #F4A261) 100%);
	/* 三个角为圆形，右下角为尖角，旋转45度即成标准地图地标 */
	border-radius: 50% 50% 50% 0;
	transform: rotate(-45deg);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 6px 16px rgba(231, 111, 81, 0.4);
	border: 2px solid var(--paper, #FFFCF8);
}

/* 地标中心镂空暖白圆点 */
.pin-inner {
	width: 14px;
	height: 14px;
	background-color: var(--paper, #FFFCF8);
	border-radius: 50%;
	box-shadow: inset 0 1px 3px rgba(231, 111, 81, 0.25);
}

/* 地标针尖下方的地面投影点（正好处于地图正中心点） */
.pin-shadow {
	width: 12px;
	height: 5px;
	background: rgba(45, 52, 54, 0.22);
	border-radius: 50%;
	margin-top: 5px;
}

/* 下方一行小字：点我标记 */
.pin-label {
	margin-top: 4px;
	padding: 2px 10px;
	font-size: 11px;
	font-weight: 700;
	color: var(--orange, #E76F51);
	background: var(--card, rgba(255, 252, 248, 0.94));
	border: 1px solid rgba(231, 111, 81, 0.25);
	border-radius: 999px;
	box-shadow: 0 4px 12px rgba(231, 111, 81, 0.15);
	white-space: nowrap;
	letter-spacing: 0.5px;
}
/* 右上角刷新按钮 */
.refresh-location-btn {
	position: absolute;
	top: 16px;
	right: 16px;
	z-index: 40;

	width: 48px;
	height: 48px;
	display: flex;
	align-items: center;
	justify-content: center;

	background-color: transparent;
	border: none;
	border-radius: 50%;
	box-shadow: none;
}

/* 图片本身 */
.refresh-location-icon {
	display: block;
	width: 36px;
	height: 36px;
	transform-origin: center;
}

/* 获取位置期间持续旋转 */
.refresh-location-btn.is-locating .refresh-location-icon {
	animation: location-refresh-spin 0.9s linear infinite;
}

/* 点击反馈 */
.refresh-location-btn:active {
	opacity: 0.75;
}

@keyframes location-refresh-spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>
