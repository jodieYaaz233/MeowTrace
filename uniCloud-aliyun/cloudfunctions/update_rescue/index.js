'use strict';
const db = uniCloud.database();
const _ = db.command;
 
exports.main = async (event, context) => {
	//event为客户端上传的参数
	const{catId,rescueItem,userId} = event;
	if(!catId || typeof catId !== 'string'){
		return {success:false,msg:'docId 必须为字符串'};
	}
	if(!userId){
			return { success: false, msg: 'userId 不能为空' };
		}
		try{
			// 先把猫咪的基础信息查出来，用于冗余存储到救助记录表中
					const catInfoRes = await db.collection('cats').doc(catId).field({ name: true, cover_image: true,latest_status:true}).get();
					let catName = '未知猫咪';
					let coverImage = '';
					let latest = '';
					if(catInfoRes.data && catInfoRes.data.length > 0) {
						catName = catInfoRes.data[0].name;
						coverImage = catInfoRes.data[0].cover_image;
						latest = catInfoRes.data[0].latest_status;
					}
		console.log("latest",latest);
		await db.collection('cats').doc(catId).update({
			rescue_history:_.push({
				each:[{
					action_type:rescueItem.action,
					note:rescueItem.memo,
					helper_id:userId,
					create_time:Date.now()
				}],
				slice:-10
			}),
			last_update_time:Date.now()
		});
		
		await db.collection('rescue_records').add({
			cat_id:catId,
			cat_name:catName,
			cover_image:coverImage,
			user_id:userId,
			action_type:rescueItem.action,
			note:rescueItem.memo,
			latest_status:latest,
			create_time:Date.now()
		});
		return {success:true,msg:'更新成功'};
		}catch(e){
			return {success:false,msg:e.message};}

};