<script>
	import uniIdPageInit from '@/uni_modules/uni-id-pages/init.js'
	export default {
		onLaunch: async function() {
			console.log('App Launch')
			await uniIdPageInit()
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */

	page {
		/* ========== 图标配色系统 ========== */
		/* 主色调：活力橙系 */
		--orange: #E76F51;           /* 图标爪印橙 - 主品牌色 */
		--orange-light: #F4A261;     /* 浅橙 - 渐变/ hover */
		--orange-soft: rgba(231, 111, 81, 0.12);  /* 橙色透明背景 */
		
		/* 生命力绿系 */
		--green: #2A9D8F;            /* 图标青绿 - 辅助色 */
		--green-light: #4ECDC4;      /* 亮青绿 - 点缀 */
		--green-soft: rgba(42, 157, 143, 0.12);   /* 绿色透明背景 */
		
		/* 清新蓝系 */
		--blue: #457B9D;             /* 深蓝绿 - 沉稳点缀 */
		--blue-light: #A8DADC;      /* 浅蓝 - 背景/分隔 */
		--blue-soft: rgba(69, 123, 157, 0.08);    /* 蓝色透明背景 */
		
		/* 金黄点缀 */
		--gold: #E9C46A;             /* 图标盾牌金 - 奖励/高亮 */
		--gold-soft: rgba(233, 196, 106, 0.15);
		
		/* 中性色 */
		--bg: #FFF8F0;               /* 暖白背景 - 呼应橙色 */
		--paper: #FFFCF8;            /* 卡片底色 */
		--card: rgba(255, 252, 248, 0.94);
		--ink: #2D3436;              /* 深灰文字 */
		--subtle: rgba(45, 52, 54, 0.6);
		--line: rgba(231, 111, 81, 0.12);  /* 橙色细线 */
		
		/* 阴影与圆角 */
		--shadow: 0 20px 50px rgba(231, 111, 81, 0.12);
		--shadow-green: 0 8px 24px rgba(42, 157, 143, 0.18);
		--radius: 24px;

		/* 基础设置 */
		color: var(--ink);
		background:
			radial-gradient(circle at 10% 20%, rgba(244, 162, 97, 0.15), transparent 35%),
			radial-gradient(circle at 90% 80%, rgba(42, 157, 143, 0.12), transparent 30%),
			radial-gradient(circle at 50% 50%, rgba(69, 123, 157, 0.06), transparent 50%),
			linear-gradient(180deg, #FFF8F0 0%, #FFF0E6 100%);
		font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
		min-height: 100vh;
	}

	/* 强制覆盖所有页面的写死背景色 */
	.detail-container,
	.community-container,
	.profile-container,
	.publish-container,
	.edit-container,
	.form-container {
		background: transparent !important;
	}

	/* 全局标题排版 */
	.header-title,
	.cat-name,
	.title,
	.nickname {
		font-family: "Source Han Serif SC", "Songti SC", "STSong", serif !important;
		color: var(--ink) !important;
		font-weight: 600 !important;
	}

	/* 卡片容器 */
	.info-card,
	.post-card,
	.cat-item,
	.form-group,
	.stats-panel {
		background: var(--card) !important;
		border: 1px solid var(--line) !important;
		border-radius: var(--radius) !important;
		box-shadow: var(--shadow) !important;
		backdrop-filter: blur(12px);
		margin-bottom: 16px !important;
	}

	/* 表单输入框 */
	.input-box,
	.info-box,
	.text-box,
	.content-input,
	.image-uploader,
	.comment-input {
		background: rgba(255, 252, 247, 0.9) !important;
		border: 1px solid rgba(231, 111, 81, 0.15) !important;
		border-radius: 16px !important;
		color: var(--ink) !important;
		padding: 14px 16px !important;
		transition: border-color 0.3s ease;
	}
	
	.input-box:focus,
	.info-box:focus,
	.text-box:focus,
	.content-input:focus {
		border-color: var(--orange) !important;
		box-shadow: 0 0 0 3px var(--orange-soft) !important;
	}

	/* ========== 按钮体系 ========== */
	/* 主按钮 - 活力橙 */
	.submit-btn,
	.save-btn,
	.capture-btn,
	.btn-solid,
	.mark-btn {
		background: linear-gradient(135deg, var(--orange) 0%, var(--orange-light) 100%) !important;
		color: #FFFFFF !important;
		border-radius: 16px !important;
		border: none !important;
		font-weight: 700 !important;
		font-size: 15px !important;
		height: 48px !important;
		line-height: 48px !important;
		box-shadow: 0 8px 24px rgba(231, 111, 81, 0.3) !important;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}
	
	.submit-btn:active,
	.save-btn:active,
	.capture-btn:active,
	.btn-solid:active,
	.mark-btn:active {
		transform: translateY(1px);
		box-shadow: 0 4px 12px rgba(231, 111, 81, 0.25) !important;
	}

	/* 次级/描边按钮 - 青绿 */
	.btn-outline,
	.test-btn {
		background: rgba(255, 255, 255, 0.8) !important;
		color: var(--green) !important;
		border: 1.5px solid var(--green) !important;
		border-radius: 16px !important;
		font-weight: 700 !important;
		transition: all 0.2s ease;
	}
	
	.btn-outline:active,
	.test-btn:active {
		background: var(--green-soft) !important;
	}

	/* 发帖小按钮 - 蓝绿胶囊 */
	.publish-btn,
	.send-btn {
		background: linear-gradient(135deg, var(--green) 0%, var(--green-light) 100%) !important;
		color: #FFFFFF !important;
		border-radius: 999px !important;
		font-weight: 700 !important;
		box-shadow: var(--shadow-green) !important;
	}

	/* ========== 标签体系 ========== */
	/* 状态标签 - 橙色 */
	.cat-status,
	.location-tag,
	.stat-label.active {
		background: var(--orange-soft) !important;
		color: var(--orange) !important;
		border-radius: 999px !important;
		padding: 4px 12px !important;
		font-size: 12px !important;
		font-weight: 700 !important;
		display: inline-flex !important;
		align-items: center !important;
		border: none !important;
	}

	/* 积分/奖励标签 - 金黄 */
	.credit-tag,
	.reward-tag {
		background: var(--gold-soft) !important;
		color: #B8860B !important;
		border-radius: 999px !important;
		padding: 4px 12px !important;
		font-size: 12px !important;
		font-weight: 700 !important;
	}

	/* 健康/安全标签 - 青绿 */
	.health-tag,
	.safe-tag {
		background: var(--green-soft) !important;
		color: var(--green) !important;
		border-radius: 999px !important;
		padding: 4px 12px !important;
		font-size: 12px !important;
		font-weight: 700 !important;
	}

	/* 特殊标签：猫咪链接 */
	.linked-cat {
		background: var(--orange-soft) !important;
		border-radius: 16px !important;
		border: 1.5px dashed rgba(231, 111, 81, 0.25) !important;
	}

	.cat-link-text,
	.arrow {
		color: var(--orange) !important;
		font-weight: 600 !important;
	}

	/* ========== 图片与头像 ========== */
	.header-img,
	.post-image,
	.cover-img {
		border-radius: var(--radius) !important;
		box-shadow: 0 4px 16px rgba(231, 111, 81, 0.1) !important;
	}

	.avatar,
	.cat-cover,
	.avatar-img {
		border-radius: 18px !important;
		border: 2.5px solid rgba(255, 255, 255, 0.9) !important;
		box-shadow: 0 2px 8px rgba(42, 157, 143, 0.15) !important;
	}

	/* ========== 个人中心头部 ========== */
	.user-header {
		background: linear-gradient(135deg, rgba(244, 162, 97, 0.1) 0%, rgba(42, 157, 143, 0.08) 100%) !important;
		color: var(--ink) !important;
		border-bottom: 1px solid var(--line);
	}

	.user-header .nickname {
		color: var(--ink) !important;
	}

	.user-header .sub-text {
		color: var(--subtle) !important;
	}

	/* ========== 新增：导航/Tab栏 ========== */
	.nav-bar,
	.tab-bar {
		background: rgba(255, 248, 240, 0.95) !important;
		backdrop-filter: blur(20px);
		border-top: 1px solid var(--line) !important;
	}

	.nav-item.active,
	.tab-item.active {
		color: var(--orange) !important;
	}
	
	.nav-item.active::after,
	.tab-item.active::after {
		background: var(--orange) !important;
	}

	/* ========== 新增：进度条/滑块 ========== */
	.progress-bar,
	.slider-track {
		background: linear-gradient(90deg, var(--orange) 0%, var(--gold) 100%) !important;
	}

	/* ========== 新增：加载/空状态 ========== */
	.loading-spinner {
		border-color: var(--orange) !important;
		border-top-color: transparent !important;
	}
	
	.empty-icon {
		color: var(--blue-light) !important;
	}
	
	.empty-text {
		color: var(--subtle) !important;
	}
</style>