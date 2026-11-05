<template>
	<view class="camera-container">
		<view class="preview-area">
			<image v-if="previewImage" :src="previewImage" mode="aspectFit" class="camera"></image>

			<!-- #ifdef MP-WEIXIN -->
			<camera v-if="!previewImage" class="camera" device-position="back"
				flash="off" @error="onCameraError"></camera>
			<!-- #endif -->

			<!-- #ifdef APP-PLUS -->
			<view v-if="!previewImage" class="camera-placeholder">
				<text class="placeholder-title">拍摄或上传猫咪照片</text>
				<text class="placeholder-description">
					点击下方按钮打开相机，也可以从相册选择照片
				</text>
			</view>
			<!-- #endif -->
		</view>

		<view class="controls">
			<button class="capture-btn" @click="takePhoto"
				:loading="isRecognizing"
				:disabled="isRecognizing || isChoosingImage">
				{{ isRecognizing ? 'AI识别中...' : '点击拍照识别' }}
			</button>
			<button class="test-btn" @click="chooseImageToTest"
				:disabled="isRecognizing || isChoosingImage">相册选图</button>
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';

	const isRecognizing = ref(false);
	const isChoosingImage = ref(false);
	const previewImage = ref('');
	const manualLocation = ref(0);

	onLoad((options) => {
		if (options.lat && options.lng) {
			manualLocation.value = {
				latitude: parseFloat(options.lat),
				longitude: parseFloat(options.lng)
			};
		}
		console.log('手动选择的位置是：', manualLocation.value);
	});

	// 系统相机和相册共用的选图逻辑。
	const chooseImage = (sourceType) => {
		if (isRecognizing.value || isChoosingImage.value) return;
		isChoosingImage.value = true;

		uni.chooseImage({
			count: 1,
			sourceType,
			success: (res) => {
				const imagePath = res.tempFilePaths?.[0];
				if (!imagePath) {
					uni.showToast({ title: '未获取到照片，请重试', icon: 'none' });
					return;
				}
				previewImage.value = imagePath;
				processAiRecognition(imagePath);
			},
			fail: (err) => {
				if ((err.errMsg || '').toLowerCase().includes('cancel')) return;
				console.error('获取照片失败：', err);
				uni.showToast({
					title: '获取照片失败，请检查权限后重试',
					icon: 'none'
				});
			},
			complete: () => {
				isChoosingImage.value = false;
			}
		});
	};

	const takePhoto = () => {
		if (isRecognizing.value || isChoosingImage.value) return;

		// #ifdef MP-WEIXIN
		isChoosingImage.value = true;
		const ctx = uni.createCameraContext();
		ctx.takePhoto({
			quality: 'high',
			success: (res) => {
				previewImage.value = res.tempImagePath;
				processAiRecognition(res.tempImagePath);
			},
			fail: (err) => {
				console.error('拍照失败：', err);
				uni.showToast({
					title: '拍照失败，请检查摄像头权限',
					icon: 'none'
				});
			},
			complete: () => {
				isChoosingImage.value = false;
			}
		});
		// #endif

		// #ifdef APP-PLUS
		chooseImage(['camera']);
		// #endif
	};

	const chooseImageToTest = () => {
		chooseImage(['album']);
	};

	// 保留现有定位、上传和 AI 识别流程。
	const processAiRecognition = async (imagePath) => {
		if (isRecognizing.value) return;
		isRecognizing.value = true;
		uni.showLoading({ title: '定位并检索中...' });

		try {
			const location = await new Promise((resolve, reject) => {
				uni.getLocation({
					type: 'gcj02',
					isHighAccuracy: true,
					success: resolve,
					fail: reject
				});
			});
			console.log('定位成功，当前位置是：', location);

			const finalLat = manualLocation.value
				? manualLocation.value.latitude : location.latitude;
			const finalLng = manualLocation.value
				? manualLocation.value.longitude : location.longitude;
			console.log('最终传入的位置是：', finalLat, finalLng);

			uni.showLoading({ title: '上传图像中...' });
			const uploadRes = await uniCloud.uploadFile({
				filePath: imagePath,
				cloudPath: `temp_recognize/${Date.now()}.jpg`
			});

			uni.showLoading({ title: 'AI 比对中...' });
			const aiRes = await uniCloud.callFunction({
				name: 'ai-recognize',
				data: {
					imageFileID: uploadRes.fileID,
					longitude: finalLng,
					latitude: finalLat
				}
			});

			const result = aiRes.result;
			uni.hideLoading();

			if (result.is_new) {
				uni.navigateTo({
					url: `/pages/add-cat/add-cat?img=${encodeURIComponent(uploadRes.fileID)}&lat=${finalLat}&lng=${finalLng}`
				});
				setTimeout(() => { previewImage.value = ''; }, 1000);
			} else {
				uni.showToast({ title: '已匹配到档案', icon: 'success' });
				setTimeout(() => {
					uni.navigateTo({
						url: `/pages/cat-detail/cat-detail?id=${result.cat_id}`
					});
					previewImage.value = '';
				}, 1000);
			}
		} catch (err) {
			uni.hideLoading();
			console.error('识别失败，请重试：', err);
			uni.showToast({ title: '识别失败，请重试', icon: 'none' });
			previewImage.value = '';
		} finally {
			isRecognizing.value = false;
		}
	};

	// #ifdef MP-WEIXIN
	const onCameraError = (err) => {
		console.error('相机组件错误：', err);
		uni.showToast({ title: '请检查摄像头权限', icon: 'none' });
	};
	// #endif
</script>

<style scoped>
	.camera-container {
		width: 100%;
		height: 100vh;
		background: #20242a;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.preview-area {
		position: relative;
		flex: 1;
		min-height: 0;
		width: 100%;
		overflow: hidden;
	}
	.camera {
		display: block;
		width: 100%;
		height: 100%;
	}
	.camera-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		padding: 24px;
	}
	.placeholder-title {
		color: #ffffff;
		font-size: 20px;
		font-weight: bold;
	}
	.placeholder-description {
		margin-top: 16px;
		color: #c7cbd1;
		font-size: 14px;
		line-height: 24px;
		text-align: center;
	}
	.controls {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		padding: 24px 16px;
		padding-bottom: calc(24px + env(safe-area-inset-bottom));
		background: #ffffff;
	}
	.capture-btn {
		flex: 2;
		min-width: 0;
		margin: 0 12px 0 0;
		padding: 0 8px;
		height: 48px;
		line-height: 48px;
		border-radius: 16px;
		background: #f06c7a;
		color: #ffffff;
		font-size: 16px;
	}
	.test-btn {
		flex: 1;
		min-width: 0;
		margin: 0;
		padding: 0 8px;
		height: 48px;
		line-height: 48px;
		font-size: 14px;
	}
</style>
