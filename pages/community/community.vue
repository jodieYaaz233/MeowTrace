<template>
	<view class="community-container">
		<view class="header-bar">
			<text class="title">喵星广场</text>
			<button class="publish-btn" @click="goToPublish">✍️ 发帖子</button>
		</view>

		<scroll-view scroll-y class="post-list" @scrolltolower="loadMore">
			<view class="post-card" v-for="post in posts" :key="post._id">
				<view class="user-info">
					<image class="avatar" :src="post.author_avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
					<view>
						<text class="nickname">{{ post.author_name || '热心喵友' }}</text>
						<text class="time">{{ formatTime(post.create_time) }}</text>
					</view>
				</view>
				
				<view class="post-card-click"  @click="goToPost(post._id)">
					<text class="post-content">{{ post.content }}</text>
					<image v-if="post.image_url" :src="post.image_url" class="post-image" mode="aspectFill"></image>
				</view>

				<view class="linked-cat" v-if="post.linked_cat_id" @click="goToCatDetail(post.linked_cat_id)">
					<text class="cat-link-text">🐱 涉及猫咪：{{ post.linked_cat_name }}</text>
					<text class="arrow">查看档案</text>
				</view>

				<view class="location-tag" v-if="post.location_name">
					<text>📍 {{ post.location_name }}</text>
				</view>

				<view class="action-bar">
					<view class="action-item" @click="toggleLike(post)">
						<text class="icon">{{ isLiked(post) ? '❤️' : '🤍' }}</text>
						<text class="count">{{ post.like_account || 0 }}</text>
					</view>
					<view class="action-item" @click="toggleCommentBox(post)">
						<text class="icon">💬</text>
						<text class="count">{{ post.comment_account || 0 }}</text>
					</view>
					<view class="action-item" @click="toggleFavorite(post)">
						<text class="icon">{{ isFavorited(post) ? '⭐' : '☆' }}</text>
						<text class="count">{{ post.favorite_account || 0 }}</text>
					</view>
				</view>

				<view class="comment-section" v-if="post.showComments">
					<view class="comment-list" v-if="post.comments && post.comments.length > 0">
						<view class="comment-item" v-for="(comment, index) in post.comments" :key="index">
							<text class="comment-user">{{ comment.comment_author_name }}: </text>
							<text class="comment-text">{{ comment.comment_content }}</text>
						</view>
					</view>

					<view class="comment-input-box">
						<input class="comment-input" v-model="post.tempComment" placeholder="说点什么吧..." @confirm="submitComment(post)" />
						<button class="send-btn" @click="submitComment(post)">发送</button>
					</view>
				</view>

			</view>
			<view class="loading-text" v-if="loading">加载中...</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import { ref } from 'vue';
	import { onShow } from '@dcloudio/uni-app';

	const PAGE_SIZE = 10;
	const posts = ref([]);
	const loading = ref(false);
	const hasMore = ref(true);
	const currentUserId = ref('');
	const currentUserName = ref('热心喵友');
	const currentUserAvatar = ref('');

	onShow(() => {
		currentUserId.value = uni.getStorageSync('current_uid') || '';
		getUserProfile();
		loadPosts();
	});
	// 只读取当前用户资料，供评论展示最新昵称/头像。
	// 原实现用用户 ID 去更新 posts 文档是错的：posts 的 _id 是帖子 ID，不是用户 ID。
	const getUserProfile = async () => {
		if (!currentUserId.value) return;
		try {
			const db = uniCloud.database();
			const res = await db.collection('users-selfcreate').doc(currentUserId.value).field({ nickname: true, avatar: true }).get({ getOne: true });
			const user = Array.isArray(res.result.data) ? res.result.data[0] : res.result.data;
			if (user) {
				currentUserName.value = user.nickname || currentUserName.value;
				currentUserAvatar.value = user.avatar || '';
			}
		} catch (e) { console.error(e) }
	};
	
	//跳转到帖子详情页
	const goToPost = (id,showComments = true) => {
		const query = showComments ? '&showComments=1' : '';
		uni.navigateTo({
			url:`/pages/community/posts?id=${encodeURIComponent(id)}${query}`
		});
	};
	const mapPost = (post) => ({
		...post,
		likes: post.likes || [],
		favorites: post.favorites || [],
		comments: post.comments || [],
		showComments: false,
		tempComment: ''
	});

	const fetchPosts = async (append = false) => {
		if (loading.value || (append && !hasMore.value)) return;
		loading.value = true;
		try {
			const db = uniCloud.database();
			const res = await db.collection('posts')
				.orderBy('create_time', 'desc')
				.skip(append ? posts.value.length : 0)
				//.limit(PAGE_SIZE)
				.get();
			const list = res.result.data.map(mapPost);
			if (append) {
				const exists = new Set(posts.value.map(p => p._id));
				posts.value = [...posts.value, ...list.filter(p => !exists.has(p._id))];
			} else {
				posts.value = list;
			}
			hasMore.value = res.result.data.length === PAGE_SIZE;
		} catch (e) {
			uni.showToast({ title: '获取动态失败', icon: 'none' });
		} finally {
			loading.value = false;
		}
	};

	const loadPosts = () => fetchPosts(false);

	// 状态断言
	const isLiked = (post) => currentUserId.value ? (post.like_users || []).includes(currentUserId.value) : false;
	const isFavorited = (post) => currentUserId.value ? (post.favorite_users || []).includes(currentUserId.value) : false;
	
	// 前端登录拦截拦截
	const checkLogin = () => {
		if (!currentUserId.value) {
			uni.showToast({ title: '请先登录', icon: 'none' });
			return false;
		}
		return true;
	};

	// 喜欢功能，数据库留存
	const toggleLike = async (post) => {
	  if (!checkLogin()) return;
	  if (!post.like_users) {
	  		post.like_users = [];
	  	}
	  const index = post.like_users.indexOf(currentUserId.value);
	  		
	  		// 在前端克隆一份新数组和新数量
	let newLikeUsers = [...post.like_users];
	let newLikeAccount = post.like_account || 0;
	  		
	if (index > -1) {
	  				// 取消点赞
	  	newLikeUsers.splice(index, 1);
	  	newLikeAccount = Math.max(0, newLikeAccount - 1);
	  	} else {
	  				// 确认点赞
	  		newLikeUsers.push(currentUserId.value);
			newLikeAccount = newLikeAccount + 1;
		}
	  		
	  	const db = uniCloud.database();
	  	try {
	  		await db.collection('posts').doc(post._id).update({
	  		like_users: newLikeUsers,
	  		like_account: newLikeAccount
	  	});
	  				
	  	// 数据库更新成功后，再同步更新前端UI视图
	  		post.like_users = newLikeUsers;
	  		post.like_account = newLikeAccount;
	  		} catch (e) {
	  		uni.showToast({ title: '点赞操作失败', icon: 'none' });
	  		console.error(e);
	  		}
	};
	
	// 收藏状态
	const toggleFavorite = async (post) => {
		if (!checkLogin()) return;
		//初始化一下
		if (!post.favorite_users) post.favorite_users = [];
	
		const index = post.favorite_users.indexOf(currentUserId.value);
		
		// 在前端计算好新的收藏数组与数量
		let newFavoriteUsers = [...post.favorite_users];
		let newFavoriteAccount = post.favorite_account || 0;
	
		if (index > -1) {
			// 取消收藏
			newFavoriteUsers.splice(index, 1);
			newFavoriteAccount = Math.max(0, newFavoriteAccount - 1);
		} else {
			// 添加收藏
			newFavoriteUsers.push(currentUserId.value);
			newFavoriteAccount = newFavoriteAccount + 1;
		}
	
		const db = uniCloud.database();
		try {
			await db.collection('posts').doc(post._id).update({
				favorite_users: newFavoriteUsers,
				favorite_account: newFavoriteAccount
			});
			
			// 同步前端渲染状态
			post.favorite_users = newFavoriteUsers;
			post.favorite_account = newFavoriteAccount;
			uni.showToast({ title: index > -1 ? '已取消收藏' : '收藏成功', icon: index > -1 ? 'none' : 'success' });
		} catch (e) {
			uni.showToast({ title: '收藏操作失败', icon: 'none' });
			console.error(e);
		}
	};
	
	const toggleCommentBox = (post) => {
		post.showComments = !post.showComments;
	};
	// 提交评论：保存至数据库，保留最近 5 条数据
	const submitComment = async (post) => {
		if (!checkLogin()) return;
		if (!post.tempComment.trim()) {
			return uni.showToast({ title: '评论不能为空', icon: 'none' });
		}
	
		const db = uniCloud.database();
	
		// 构建符合 Schema 的新评论对象
		const newComment = {
			comment_id: String(Date.now()) + Math.random().toString(36).substring(2, 7),
			comment_content: post.tempComment.trim(),
			comment_author_id: currentUserId.value,
			comment_author_name: currentUserName.value,
			comment_author_avatar: currentUserAvatar.value,
			create_time: Date.now()
		};
	
		// 1. 先在前端合并，并用 slice(-5) 永远只截取保留最后最亲的5条
		let updatedComments = [...(post.comments || []), newComment];
		// if (updatedComments.length > 5) {
		// 	updatedComments = updatedComments.slice(-5);
		// }
		
		const newCommentAccount = (post.comment_account || 0) + 1;
	
		try {
			// 3. 将最新加工完毕的数据整体打包直接写库
			await db.collection('posts').doc(post._id).update({
				comments: updatedComments,
				comment_account: newCommentAccount
			});
			
			// 4. 同步更新本地响应式状态以触发视图刷新
			post.comments = updatedComments;
			post.comment_account = newCommentAccount;
			post.tempComment = ''; 
			uni.showToast({ title: '评论成功', icon: 'success' });
		} catch (e) {
			uni.showToast({ title: '评论发布失败', icon: 'none' });
			console.error(e);
		}
	};
	
	const loadMore = () => fetchPosts(true);
	const goToPublish = () => {
		if (!checkLogin()) return;
		uni.navigateTo({ url: '/pages/community/publish-post' });
	};
	const goToCatDetail = (catId) => {
		uni.navigateTo({ url: `/pages/cat-detail/cat-detail?id=${catId}` });
	};
	const formatTime = (timestamp) => {
		if (!timestamp) return '';
		const date = new Date(timestamp);
		
		const month = String(date.getMonth()+1).padStart(2,'0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${month}-${day} ${hours}:${minutes}`;
	};
</script>

<style>
	.community-container { background:#fff; height: 100vh; display: flex; flex-direction: column; }
	.header-bar { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #fff5f0; border-bottom: 1px solid #eee; }
	.title { font-size: 20px; font-weight: bold; color: #333; }
	.publish-btn { background: #F4A261; color: white; border-radius: 20px; font-size: 14px; margin: 0; height: 32px; line-height: 32px; padding: 0 15px; font-weight: bold; }
	.post-list { flex: 1; padding: 10px; box-sizing: border-box; }
	.post-card { background: #fff; border-radius: 12px; padding: 15px; margin-bottom: 15px; display: flex; flex-direction: column; }
	.user-info { display: flex; align-items: center; margin-bottom: 10px; }
	.avatar { width: 40px; height: 40px; border-radius: 20px; margin-right: 10px; background: #eee; }
	.nickname { font-size: 15px; font-weight: bold; display: block; color: #333; }
	.time { font-size: 12px; color: #999; }
	.post-content { font-size: 15px; color: #333; margin-bottom: 10px; line-height: 1.5; }
	.post-image { width: 100%; height: 200px; border-radius: 8px; margin-bottom: 10px; background: #fafafa; }
	.linked-cat { background: #fff5f0; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center; }
	.cat-link-text { color: #E76F51; font-weight: bold; font-size: 14px; }
	.arrow { color: #E76F51; font-size: 12px;font-weight:bold }
	.location-tag { font-size: 12px; color: #666; background: #f0f0f0; display: inline-block; padding: 4px 8px; border-radius: 4px; align-self: flex-start; margin-bottom: 8px; }
	.loading-text { text-align: center; color: #999; padding: 10px 0; font-size: 12px; }
	.action-bar { display: flex; justify-content: space-around; border-top: 1px solid #f0f0f0; padding-top: 12px; margin-top: 5px; }
	.action-item { display: flex; align-items: center; color: #666; font-size: 14px; padding: 5px 10px; }
	.action-item .icon { margin-right: 4px; font-size: 16px; }
	.comment-section { background: #f9f9f9; border-radius: 8px; padding: 10px; margin-top: 12px; }
	.comment-item { margin-bottom: 6px; font-size: 13px; }
	.comment-user { font-weight: bold; color: #333; }
	.comment-text { color: #555; }
	.comment-input-box { display: flex; margin-top: 10px; align-items: center; }
	.comment-input { flex: 1; background: #fff; border: 1px solid #ddd; border-radius: 15px; padding: 4px 12px; font-size: 13px; height: 30px; }
	.send-btn { background: #F4A261; color: #fff; font-size: 12px; height: 30px; line-height: 30px; border-radius: 15px; margin-left: 10px; padding: 0 12px; border: none; }
</style>