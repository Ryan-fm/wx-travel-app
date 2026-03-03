// cloudfunctions/get-route-detail/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 获取路线详情云函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { routeId } = event
  
  try {
    if (!routeId) {
      return {
        success: false,
        error: '缺少路线ID'
      }
    }
    
    const openid = wxContext.OPENID
    if (!openid) {
      return {
        success: false,
        error: '用户未登录'
      }
    }
    
    // 查询路线详情
    const routeResult = await db.collection('routes')
      .doc(routeId)
      .get()
    
    if (!routeResult.data) {
      return {
        success: false,
        error: '路线不存在'
      }
    }
    
    const route = routeResult.data
    
    // 检查权限：只能查看自己的路线或公开路线
    if (route._openid !== openid && !route.isPublic) {
      return {
        success: false,
        error: '没有权限查看此路线'
      }
    }
    
    // 格式化日期
    const formattedRoute = {
      ...route,
      createdAt: formatDate(route.createdAt),
      updatedAt: formatDate(route.updatedAt)
    }
    
    return {
      success: true,
      data: formattedRoute
    }
    
  } catch (error) {
    console.error('获取路线详情失败:', error)
    
    if (error.errCode === -502002) {
      return {
        success: false,
        error: '路线不存在'
      }
    }
    
    return {
      success: false,
      error: error.message || '获取路线详情失败'
    }
  }
}

// 格式化日期
function formatDate(date) {
  if (!date) return ''
  
  if (date instanceof Date) {
    return date.toLocaleDateString('zh-CN')
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN')
  }
  
  return ''
}