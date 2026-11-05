<template>
  <view class="post-page">
    <view v-if="loading" class="page-state">帖子加载中...</view>
    <view v-else-if="errorText" class="page-state">
      <text>{{ errorText }}</text>
      <button v-if="postId" class="retry-button" @click="loadPost">重试</button>
    </view>

    <view v-else-if="post" class="post-detail">
      <view class="author-row">
        <image class="avatar" :src="post.author_avatar || defaultAvatar" mode="aspectFill" />
        <view class="author-meta">
          <text class="author-name">{{ post.author_name || post.user_id || '热心喵友' }}</text>
          <text class="time">{{ formatTime(post.create_time) }}</text>
        </view>
		<view class="forward" @click="sharePost">
			<image src="/static/forward.png" mode="aspectFit"></image>
		</view>
      </view>

      <text class="post-content">{{ post.content }}</text>
      <image v-if="post.image_url" class="post-image" :src="post.image_url" mode="widthFix" @click="previewImage" />

      <view v-if="post.linked_cat_id" class="linked-cat" @click="goToCatDetail">
        <text>🐱 涉及猫咪：{{ post.linked_cat_name || post.linked_cat_id }}</text>
        <text class="cat-arrow">查看档案</text>
      </view>
      <view v-if="post.location_name" class="location-tag">📍 {{ post.location_name }}</view>



	<view class="action-bar">
		<view class="action-item" @click="togglePostReaction('like')">
			<text class="icon">{{ hasReaction(post, 'like_users') ? '❤️' : '🤍' }}</text>
			<text class="count">{{ post.like_account || 0 }}</text>
		</view>
		<view class="action-item" @click="showComments = !showComments">
			<text class="icon">💬</text>
			<text class="count">{{ post.comment_account || 0 }}</text>
		</view>
		<view class="action-item" @click="togglePostReaction('favorite')">
			<text class="icon">{{ hasReaction(post, 'favorite_users') ? '⭐' : '☆' }}</text>
			<text class="count">{{ post.favorite_account || 0 }}</text>
		</view>
	</view>

      <view v-if="showComments" class="comments-section">
        <text class="section-title">评论</text>
        <view v-if="!topComments.length" class="empty-comments">暂无评论</view>
        <view v-for="comment in topComments" :key="comment.comment_id" class="comment-thread">
          <view v-for="item in commentRows(comment)" :key="item.comment_id" class="comment-row" :class="{ 'reply-row': !!item.parent_id }" @click="selectReply(comment, item)">
            <image class="comment-avatar" :src="item.comment_author_avatar || defaultAvatar" mode="aspectFill" />
            <view class="comment-body">
              <text class="comment-user">{{ item.comment_author_name || '用户' }}</text>
              <text v-if="item.reply_to_id && item.reply_to_id !== comment.comment_id" class="reply-target">回复 {{ replyTargetName(item.reply_to_id) }}</text>
              <text class="comment-text">{{ item.comment_content }}</text>
              <view class="comment-actions">
                <text>回复</text>
                <text class="comment-like" :class="{ active: hasReaction(item, 'like_users') }" @click.stop="toggleCommentLike(item)"><uni-icons :type="hasReaction(item, 'like_users') ? 'heart-filled' : 'heart'" :color="hasReaction(item, 'like_users') ? '#E76F51' : '#74797A'" size="15" /> {{ item.likes || 0 }}</text>
              </view>
            </view>
          </view>
          <button v-if="repliesFor(comment.comment_id).length > 2" class="more-replies" @click="toggleReplies(comment.comment_id)">
            {{ repliesLabel(comment.comment_id) }}
          </button>
        </view>

        <view v-if="replyTarget" class="reply-hint">
          <text>回复 {{ replyTarget.comment_author_name || replyTarget.comment_author_id || '用户' }}</text>
          <text class="cancel-reply" @click="clearReply">取消</text>
        </view>
        <view class="comment-editor">
          <input v-model="commentInput" class="post-comment-input" :placeholder="replyTarget ? '写回复...' : '写评论...'" maxlength="500" confirm-type="send" @confirm="submitComment" />
          <button class="send-button" :disabled="saving || !commentInput.trim()" @click="submitComment">发送</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow, onShareAppMessage } from '@dcloudio/uni-app';

const defaultAvatar = '/static/default-avatar.png';
const postId = ref('');
const post = ref(null);
const loading = ref(true);
const errorText = ref('');
const saving = ref(false);
const showComments = ref(false);
const commentInput = ref('');
const replyTarget = ref(null);
const replyParentId = ref('');
const expandedReplies = ref({});
const currentUserId = ref('');
const currentUserName = ref('');
const currentUserAvatar = ref('');

const allComments = computed(() => Array.isArray(post.value?.comments) ? post.value.comments : []);
const topComments = computed(() => allComments.value.filter(comment => !comment.parent_id));
const repliesFor = parentId => allComments.value.filter(comment => comment.parent_id === parentId);
const visibleReplies = parentId => expandedReplies.value[parentId] ? repliesFor(parentId) : repliesFor(parentId).slice(0, 2);
const commentRows = comment => [comment, ...visibleReplies(comment.comment_id)];
const repliesLabel = parentId => expandedReplies.value[parentId]
  ? '收起回复'
  : `展开其余 ${repliesFor(parentId).length - 2} 条回复`;
const replyTargetName = id => {
  const target = allComments.value.find(comment => comment.comment_id === id);
  return target?.comment_author_name || target?.comment_author_id || '用户';
};
const readPost = async () => {
  const res = await uniCloud.database().collection('posts').doc(postId.value).get({ getOne: true });
  return Array.isArray(res.result.data) ? res.result.data[0] : res.result.data;
};

onLoad(options => {
  postId.value = options.id || '';
  showComments.value = options.showComments === '1';
  loadPost();
});

let firstShow = true;
onShow(() => {
  currentUserId.value = uni.getStorageSync('current_uid') || '';
  loadCurrentUser();
  if (firstShow) {
    firstShow = false;
    return;
  }
  if (postId.value && post.value && !saving.value) loadPost(false);
});

onShareAppMessage(() => ({
  title: post.value?.content?.slice(0, 40) || '喵星社区帖子',
  path: `/pages/community/posts?id=${encodeURIComponent(postId.value)}`
}));

const loadPost = async (showLoading = true) => {
  if (!postId.value) {
    loading.value = false;
    errorText.value = '缺少帖子 ID';
    return;
  }
  if (showLoading) loading.value = true;
  try {
    const data = await readPost();
    post.value = data || null;
    errorText.value = data ? '' : '帖子不存在或已删除';
  } catch (e) {
    console.error('获取帖子失败', e);
    if (!post.value) errorText.value = '帖子加载失败，请重试';
    else uni.showToast({ title: '刷新帖子失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const loadCurrentUser = async () => {
  currentUserName.value = '';
  currentUserAvatar.value = '';
  if (!currentUserId.value) return;
  try {
    const res = await uniCloud.database().collection('users-selfcreate').doc(currentUserId.value)
      .field({ nickname: true, avatar: true }).get({ getOne: true });
    const data = res.result.data;
    currentUserName.value = data?.nickname || '';
    currentUserAvatar.value = data?.avatar || '';
  } catch (e) {
    console.error('获取用户资料失败', e);
  }
};

const requireLogin = () => {
  if (currentUserId.value) return true;
  uni.showToast({ title: '请先登录', icon: 'none' });
  return false;
};

const hasReaction = (item, usersField) => !!currentUserId.value &&
  Array.isArray(item?.[usersField]) && item[usersField].includes(currentUserId.value);

const nextReaction = (item, usersField, countField) => {
  const users = Array.isArray(item[usersField]) ? item[usersField] : [];
  const liked = hasReaction(item, usersField);
  return {
    [usersField]: liked ? users.filter(id => id !== currentUserId.value) : [...users, currentUserId.value],
    [countField]: Math.max(0, Number(item[countField] || 0) + (liked ? -1 : 1))
  };
};
const togglePostReaction = async type => {
  if (!post.value || saving.value || !requireLogin()) return;
  const usersField = type === 'like' ? 'like_users' : 'favorite_users';
  const countField = type === 'like' ? 'like_account' : 'favorite_account';
  saving.value = true;
  try {
    const latest = await readPost();
    if (!latest) throw new Error('帖子不存在');
    const changes = nextReaction(latest, usersField, countField);
    await uniCloud.database().collection('posts').doc(postId.value).update(changes);
    Object.assign(post.value, changes);
  } catch (e) {
    console.error('更新帖子互动失败', e);
    uni.showToast({ title: '操作失败，请重试', icon: 'none' });
  } finally {
    saving.value = false;
  }
};

const toggleCommentLike = async comment => {
  if (saving.value || !requireLogin()) return;
  saving.value = true;
  try {
    const latest = await readPost();
    if (!latest) throw new Error('帖子不存在');
    const comments = (Array.isArray(latest.comments) ? latest.comments : []).map(item => ({ ...item }));
    const target = comments.find(item => item.comment_id === comment.comment_id);
    if (!target) return;
    Object.assign(target, nextReaction(target, 'like_users', 'likes'));
    await uniCloud.database().collection('posts').doc(postId.value).update({ comments });
    post.value = { ...latest, comments };
  } catch (e) {
    console.error('评论点赞失败', e);
    uni.showToast({ title: '操作失败，请重试', icon: 'none' });
  } finally {
    saving.value = false;
  }
};

const selectReply = (parent, target) => {
  replyParentId.value = parent.comment_id;
  replyTarget.value = target;
};
const clearReply = () => {
  replyParentId.value = '';
  replyTarget.value = null;
};
const toggleReplies = parentId => {
  expandedReplies.value[parentId] = !expandedReplies.value[parentId];
};

const submitComment = async (post) => {
		if (!post.tempComment.trim()) {
			return uni.showToast({ title: '评论不能为空', icon: 'none' });
		}
	
		const db = uniCloud.database();
	
		// 构建符合 Schema 的新评论对象
		const newComment = {
		    comment_id: String(Date.now()) + Math.random().toString(36).substring(2, 7),
		    comment_content: content,
		    comment_author_id: currentUserId.value,
		    comment_author_name: currentUserName.value || '热心喵友',
		    comment_author_avatar: currentUserAvatar.value,
		    create_time: Date.now(),
		    parent_id: replyParentId.value,
		    reply_to_id: replyTarget.value?.comment_id || '',
		    likes: 0,
		    like_users: []
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
// const submitComment = async () => {
//   const content = commentInput.value.trim();
//   if (!post.value || saving.value || !content || !requireLogin()) return;
//   saving.value = true;
//   const newComment = {
//     comment_id: String(Date.now()) + Math.random().toString(36).substring(2, 7),
//     comment_content: content,
//     comment_author_id: currentUserId.value,
//     comment_author_name: currentUserName.value || '热心喵友',
//     comment_author_avatar: currentUserAvatar.value,
//     create_time: Date.now(),
//     parent_id: replyParentId.value,
//     reply_to_id: replyTarget.value?.comment_id || '',
//     likes: 0,
//     like_users: []
//   };
//   try {
//     const db = uniCloud.database();
//     await db.collection('posts').doc(postId.value).update({
//       comments: db.command.push({ each: [newComment] }),
//       comment_account: db.command.inc(1)
//     });
//     await loadPost(false);
//     commentInput.value = '';
//     clearReply();
//     showComments.value = true;
//   } catch (e) {
//     console.error('发表评论失败', e);
//     uni.showToast({ title: '发送失败，请重试', icon: 'none' });
//   } finally {
//     saving.value = false;
//   }
// };

const formatTime = (timestamp) => {
		if (!timestamp) return '';
		const date = new Date(timestamp);
		
		const month = String(date.getMonth()+1).padStart(2,'0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${month}-${day} ${hours}:${minutes}`;
	};

const goToCatDetail = () => {
  uni.navigateTo({ url: `/pages/cat-detail/cat-detail?id=${encodeURIComponent(post.value.linked_cat_id)}` });
};
const previewImage = () => {
  uni.previewImage({ urls: [post.value.image_url] });
};
const sharePost = () => {
  // #ifdef H5
  const url = `${window.location.origin}${window.location.pathname}#/pages/community/posts?id=${encodeURIComponent(postId.value)}`;
  uni.setClipboardData({ data: url, success: () => uni.showToast({ title: '链接已复制', icon: 'none' }) });
  // #endif
  // #ifndef H5
  uni.showToast({ title: '请使用系统分享功能', icon: 'none' });
  // #endif
};
</script>

<style scoped>
.post-page { min-height: 100vh; padding: 20rpx 28rpx 60rpx; box-sizing: border-box; background: var(--bg); color: var(--ink); }
.page-state { padding: 140rpx 24rpx; text-align: center; color: var(--subtle); }
.retry-button { width: 180rpx; margin-top: 24rpx; background: var(--green); color: #fff; font-size: 26rpx; }
.post-detail { max-width: 900rpx; margin: 0 auto; }
.author-row { display: flex; align-items: center; margin-bottom: 24rpx; gap:12px;}
.avatar { flex: none; width: 88rpx; height: 88rpx; border-radius: 50%; background: #eee; margin-right: 18rpx; }
.author-meta { flex:1;display: flex; flex-direction: column; min-width: 0; }
.author-name { overflow:hidden;text-overflow: ellipsis;white-space: nowrap;font-weight: 600; }
.forward {
  flex-shrink: 0;
  margin-left: auto; /* 或靠 flex:1 的 meta 撑开 */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
}
.forward image {
  width: 36px;
  height: 36px;
}
.time, .comment-id { color: var(--subtle); font-size: 23rpx; overflow-wrap: anywhere; }
.post-content { display: block; font-size: 30rpx; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; margin-bottom: 20rpx; }
.post-image { display: block; width: 100%; height: auto; margin-bottom: 22rpx; }
.linked-cat { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; padding: 22rpx; margin-bottom: 18rpx; border: 1rpx solid var(--line); border-radius: 8rpx; background: var(--orange-soft); color: var(--orange); font-weight:bold; font-size: 14px;}
.cat-arrow { flex: none; font-size: 12px}
.location-tag { display: inline-block; color: var(--subtle); font-size: 24rpx; margin-bottom: 22rpx; }
.action-bar { display: flex; justify-content: space-around; border-top: 1px solid #f0f0f0; padding-top: 12px; margin-top: 5px; }
.action-item { display: flex; align-items: center; color: #666; font-size: 14px; padding: 5px 10px; }
.action-item .icon { margin-right: 4px; font-size: 16px; }
	/* .comment-section { background: #f9f9f9; border-radius: 8px; padding: 10px; margin-top: 12px; }
	.comment-item { margin-bottom: 6px; font-size: 13px; }
	.comment-user { font-weight: bold; color: #333; }
	.comment-text { color: #555; }
	.comment-input-box { display: flex; margin-top: 10px; align-items: center; }
	.comment-input { flex: 1; background: #fff; border: 1px solid #ddd; border-radius: 15px; padding: 4px 12px; font-size: 13px; height: 30px; } */
.active { color: var(--orange); }
.comments-section { padding-top: 30rpx; }
.section-title { display: block; font-size: 30rpx; font-weight: 600; margin-bottom: 24rpx; }
.empty-comments { color: var(--subtle); font-size: 25rpx; padding-bottom: 24rpx; }
.comment-thread { padding: 0 0 22rpx; margin-bottom: 20rpx; border-bottom: 1rpx solid var(--line); }
.comment-row { display: flex; padding: 8rpx 0; }
.reply-row { margin-left: 56rpx; }
.comment-avatar { flex: none; width: 64rpx; height: 64rpx; margin-right: 16rpx; border-radius: 50%; background: #eee; }
.comment-body { display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 6rpx; }
.comment-user { font-size: 26rpx; font-weight: 600; }
.comment-text { font-size: 27rpx; line-height: 1.45; white-space: pre-wrap; overflow-wrap: anywhere; }
.reply-target { color: var(--green); font-size: 23rpx; }
.comment-actions { display: flex; gap: 36rpx; color: var(--subtle); font-size: 24rpx; padding: 8rpx 0; }
.comment-like.active { color: var(--orange); }
.more-replies { margin: 0 0 0 80rpx; padding: 0; height: 54rpx; line-height: 54rpx; background: transparent; color: var(--green); font-size: 24rpx; text-align: left; }
.reply-hint { display: flex; justify-content: space-between; margin: 16rpx 0; color: var(--subtle); font-size: 25rpx; }
.cancel-reply { color: var(--green); }
.comment-editor { display: flex; align-items: center; gap: 12rpx; margin-top: 20rpx; }
.post-comment-input { flex: 1; min-width: 0; height: 70rpx; padding: 0 18rpx; box-sizing: border-box; border: 1rpx solid var(--line); border-radius: 8rpx; background: var(--paper); font-size: 26rpx; }
.send-button { flex: none; width: 110rpx; margin: 0; padding: 0; height: 70rpx; line-height: 70rpx; border-radius: 8rpx; background: var(--green); color: #fff; font-size: 25rpx; }
.send-button[disabled] { opacity: .55; }
</style>
