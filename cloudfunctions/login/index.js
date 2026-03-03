// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 登录云函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { userInfo } = event
  
  try {
    // 获取用户openid
    const openid = wxContext.OPENID
    
    if (!openid) {
      return {
        success: false,
        error: '获取用户信息失败'
      }
    }
    
    // 检查用户是否已存在
    const userQuery = await db.collection('users')
      .where({
        _openid: openid
      })
      .get()
    
    let userData = null
    
    if (userQuery.data.length === 0) {
      // 新用户，创建用户记录
      const newUser = {
        _openid: openid,
        nickName: userInfo.nickName || '微信用户',
        avatarUrl: userInfo.avatarUrl || '',
        gender: userInfo.gender || 0,
        country: userInfo.country || '',
        province: userInfo.province || '',
        city: userInfo.city || '',
        language: userInfo.language || 'zh_CN',
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
        lastLogin: db.serverDate()
      }
      
      const addResult = await db.collection('users').add({
        data: newUser
      })
      
      userData = {
        ...newUser,
        _id: addResult._id
      }
    } else {
      // 老用户，更新最后登录时间
      const existingUser = userQuery.data[0]
      await db.collection('users').doc(existingUser._id).update({
        data: {
          lastLogin: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
      
      userData = {
        ...existingUser,
        lastLogin: new Date()
      }
    }
    
    // 生成自定义登录态（这里使用简单的token，实际生产环境应该使用更安全的方案）
    const token = generateToken(openid)
    
    return {
      success: true,
      openid: openid,
      userInfo: {
        nickName: userData.nickName,
        avatarUrl: userData.avatarUrl,
        gender: userData.gender,
        country: userData.country,
        province: userData.province,
        city: userData.city
      },
      token: token,
      isNewUser: userQuery.data.length === 0
    }
    
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 生成简单的token（实际生产环境应该使用更安全的方案）
function generateToken(openid) {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  return Buffer.from(`${openid}:${timestamp}:${randomStr}`).toString('base64')
}