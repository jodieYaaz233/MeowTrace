'use strict';
const db = uniCloud.database();
const _ = db.command;

exports.main = async (event, context) => {
	console.log('云函数收到的原始 event:', JSON.stringify(event));
	
	//event为客户端上传的参数
	//返回数据给客户端
	const {catId,lastStatus} = event;
	if(!catId || typeof catId !== 'string'){
		return {success:false,msg:'docId 必须为字符串'};
	}
		const res = await db.collection('cats').doc(catId).update({
			latest_status:lastStatus,
			last_update_time:Date.now(),
			status:_.push({
				each:[lastStatus],
				slice:-3
			})
		});
		return res;
};