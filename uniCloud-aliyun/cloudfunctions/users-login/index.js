// uniCloud/cloudfunctions/users-login/index.js
const db = uniCloud.database();
const crypto = require('crypto'); // 引入Node原生加密模块

exports.main = async (event, context) => {
	console.log("收到登录请求:", event);
	const { mobile, password } = event;
	if (!mobile || !password) {
		return { code: 400, msg: '手机号或密码不能为空' };
	}
	
	try {
		// 通过手机号查用户
		const userRes = await db.collection('users-selfcreate').where({ mobile }).limit(1).get();
		
		if (userRes.data.length === 0) {
		    return { success: false, msg: '用户不存在或密码错误' };
		}
		const user = userRes.data[0];
		// 1. 使用与注册时完全一致的 SHA256 算法，将输入的明文密码加密
		const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
		const isPasswordValid = (hashedPassword === user.password);
		// 3. 如果密码不匹配，返回错误
		if(!isPasswordValid){
			return{code: 400, msg: '密码错误'};
		}
		
		// 4. 登录成功，把这条记录的主键 _id 返回给前端
		return {
			code: 0,
			msg: '登录成功',
			_id: user._id
		};
		
	} catch (err) {
		console.error("登录云函数崩溃:", err);
		return { code: 500, msg: err.message || '系统异常' };
	}
};