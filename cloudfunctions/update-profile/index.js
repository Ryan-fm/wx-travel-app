// cloudfunctions/update-profile/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 更新用户资料云函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { updates } = event
  
  try {
    const openid = wxContext.OPENID
    if (!openid) {
      return {
        success: false,
        error: '用户未登录'
      }
    }
    
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return {
        success: false,
        error: '没有要更新的数据'
      }
    }
    
    // 允许更新的字段
    const allowedFields = ['nickName', 'avatarUrl', 'phone', 'gender', 'country', 'province', 'city']
    const updateData = {}
    
    // 过滤允许更新的字段
    for (const key in updates) {
      if (allowedFields.includes(key)) {
        updateData[key] = updates[key]
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: '没有有效的更新字段'
      }
    }
    
    // 添加更新时间
    updateData.updatedAt = db.serverDate()
    
    // 查找用户
    const userQuery = await db.collection('users')
      .where({
        _openid: openid
      })
      .get()
    
    if (userQuery.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      }
    }
    
    const userId = userQuery.data[0]._id
    
    // 更新用户信息
    await db.collection('users').doc(userId).update({
      data: updateData
    })
    
    // 获取更新后的用户信息
    const updatedUser = await db.collection('users').doc(userId).get()
    
    return {
      success: true,
      data: {
        nickName: updatedUser.data.nickName,
        avatarUrl: updatedUser.data.avatarUrl,
        phone: updatedUser.data.phone,
        gender: updatedUser.data.gender,
        country: updatedUser.data.country,
        province: updatedUser.data.province,
        city: updatedUser.data.city,
        updatedAt: updatedUser.data.updatedAt
      },
      message: '资料更新成功'
    }
    
  } catch (error) {
    console.error('更新用户资料失败:', error)
    return {
      success: false,
      error: error.message || '更新用户资料失败'
    }
  }
}