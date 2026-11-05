// uniCloud/cloudfunctions/users-register/index.obj.js
const db = uniCloud.database();
const crypto = require('crypto');
const uniIdCommon = require('uni-id-common');

async function registerUser(params) {
	const {name, password, mobile, quizscore, credit_score } = params;
	if (!mobile || !password || !name) {
		throw new Error('提交的信息不完整');
	}
	// 检查手机号是否已被注册
	const userExist = await db.collection('users-selfcreate').where({
		mobile: mobile
	}).count();
	if (userExist.total > 0) {
		throw new Error('该手机号已被注册');
	}
	// //密码加密
	// const uniIdCommon = require('uni-id-common');
	// const uniIdIns = uniIdCommon.createInstance({
	// 	clientInfo: clientInfo
	// });
	// console.log('uniIdIns methods:',Object.keys(uniIdIns));
	// console.log('uniIdCommon keys:',Object.keys(uniIdCommon));
	// const { passwordHash } = uniIdIns.encryptPassword({
	// 	password: password
	// });
	// 自定义安全加密：使用标准的 SHA256 算法将明文密码转化为密文
	const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
	const userPayload = {
		username: 'u_' + mobile,
		nickname: name,
		password: hashedPassword,
		mobile: mobile,
		quizscore: quizscore || 100,
		credit_score: credit_score,
		register_date: Date.now()
	};
	
	const result = await db.collection('users-selfcreate').add(userPayload);
	
	// const uniIdIns = uniIdCommon.createInstance({
	// 	clientInfo: clientInfo
	// });
	// const tokenRes = await uniIdIns.createToken({
	// 	uid: result.id,
	// 	role: ['user']
	// });
	// console.log('tokenRes:',tokenRes);
	return {
		code: 0,
		msg: '建立档案成功',
		uid: result.id
		// token:tokenRes.token,
		// tokenExpired: tokenRes.tokenExpired,
		// userInfo:{
		// 	nickname:name,
		// 	credit_score:credit_score || 100
		// }
	};
}

module.exports = {
	main: async function(event, context){
			const {action} = event;
			const params = event.params || event;
			
			if (action === 'registerUser') {
				return await registerUser(params);
			}
			
			throw new Error('未知操作：' + action);
}
};