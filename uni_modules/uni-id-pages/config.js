export default {
  debug: false,
  isAdmin: true,
  loginTypes: [
    // #ifdef APP
    'univerify',
    // #endif
    // #ifndef MP-HARMONY
    'weixin',
    // #endif
    'username',
    // #ifdef APP
    'apple',
    // #endif
    'smsCode',
    // #ifdef APP-HARMONY || MP-HARMONY
    'huawei',
    'huaweiMobile'
    // #endif
  ],
  agreements: {
    serviceUrl: 'https://static-mp-8f01bc88-7154-496b-95ea-f2a5e00a4821.next.bspapp.com/markdown-share-docs/9a2e7d4ca367b579011d887939be393c/index.html',
    privacyUrl: 'https://static-mp-8f01bc88-7154-496b-95ea-f2a5e00a4821.next.bspapp.com/markdown-share-docs/9a2e7d4ca367b579011d887939be393c/index.html', // 隐私政策条款链接
    huaweiConsumerPrivacyUrl: 'https://privacy.consumer.huawei.com/legal/id/authentication-terms.htm?code=CN&language=zh-CN', 
    scope: [
      'register', 'login', 'realNameVerify'
    ]
  },
  appid: {
    weixin: {
      h5: 'xxxxxx',
      web: 'xxxxxx'
    }
  },
  passwordStrength: 'medium',
	"setPasswordAfterLogin":true
}
