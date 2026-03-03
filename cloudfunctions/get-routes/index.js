// cloudfunctions/get-routes/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 获取路线列表云函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { page = 1, limit = 10, status, destination, sortBy = 'createdAt', sortOrder = 'desc' } = event
  
  try {
    const openid = wxContext.OPENID
    if (!openid) {
      return {
        success: false,
        error: '用户未登录'
      }
    }
    
    // 构建查询条件
    const query = {
      _openid: openid
    }
    
    // 添加状态筛选
    if (status) {
      query.status = status
    }
    
    // 添加目的地筛选
    if (destination) {
      query.destination = db.RegExp({
        regexp: destination,
        options: 'i'
      })
    }
    
    // 计算分页
    const skip = (page - 1) * limit
    
    // 查询路线列表
    const routesQuery = db.collection('routes')
      .where(query)
      .orderBy(sortBy, sortOrder)
      .skip(skip)
      .limit(limit)
      .get()
    
    // 查询总数
    const countQuery = db.collection('routes')
      .where(query)
      .count()
    
    const [routesResult, countResult] = await Promise.all([routesQuery, countQuery])
    
    // 格式化日期
    const formattedRoutes = routesResult.data.map(route => {
      return {
        ...route,
        createdAt: formatDate(route.createdAt),
        updatedAt: formatDate(route.updatedAt)
      }
    })
    
    return {
      success: true,
      data: {
        routes: formattedRoutes,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.total / limit)
      }
    }
    
  } catch (error) {
    console.error('获取路线列表失败:', error)
    return {
      success: false,
      error: error.message || '获取路线列表失败'
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