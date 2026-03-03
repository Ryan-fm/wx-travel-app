// cloudfunctions/generate-route/index.js
// DB only - itinerary and imageUrl from frontend AI
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { destination, days, budget, tags, style, itinerary, imageUrl } = event

  try {
    if (!destination || !days || !budget) {
      return {
        success: false,
        error: '缺少必要参数：目的地、天数、预算'
      }
    }

    if (!itinerary) {
      return {
        success: false,
        error: '缺少路线数据，请先完成AI生成'
      }
    }

    const openid = wxContext.OPENID
    if (!openid) {
      return {
        success: false,
        error: '用户未登录'
      }
    }

    const routeData = {
      _openid: openid,
      title: `${destination} ${days}日游`,
      destination,
      days: parseInt(days),
      budget: parseFloat(budget),
      tags: tags || [],
      style: style || 'balanced',
      status: 'completed',
      itinerary: itinerary.itinerary,
      totalBudget: itinerary.totalBudget,
      tips: itinerary.tips,
      transportation: itinerary.transportation,
      imageUrl: imageUrl || null,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }

    const routeRef = await db.collection('routes').add({
      data: routeData
    })

    const doc = await db.collection('routes').doc(routeRef._id).get()
    return {
      success: true,
      data: doc.data,
      message: '路线生成成功'
    }
  } catch (error) {
    console.error('路线保存失败:', error)
    return {
      success: false,
      error: error.message || '路线保存失败，请稍后重试'
    }
  }
}
