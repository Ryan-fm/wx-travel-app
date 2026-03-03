// cloudfunctions/update-route/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { routeId, itinerary, imageUrl } = event

  try {
    if (!routeId || !itinerary) {
      return { success: false, error: '缺少routeId或itinerary' }
    }

    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    if (!openid) {
      return { success: false, error: '用户未登录' }
    }

    const doc = await db.collection('routes').doc(routeId).get()
    if (!doc.data || doc.data._openid !== openid) {
      return { success: false, error: '无权限或路线不存在' }
    }

    await db.collection('routes').doc(routeId).update({
      data: {
        itinerary: itinerary.itinerary,
        totalBudget: itinerary.totalBudget,
        tips: itinerary.tips,
        transportation: itinerary.transportation,
        imageUrl: imageUrl || null,
        status: 'completed',
        updatedAt: db.serverDate()
      }
    })

    const updated = await db.collection('routes').doc(routeId).get()
    return {
      success: true,
      data: updated.data,
      message: '路线更新成功'
    }
  } catch (error) {
    console.error('更新路线失败:', error)
    return {
      success: false,
      error: error.message || '更新失败'
    }
  }
}
