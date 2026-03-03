// pages/my-routes/my-routes.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    // 路线列表
    routes: [],
    
    // 分页
    currentPage: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    
    // 筛选条件
    filterStatus: 'all', // all, completed, generating, failed
    filterDestination: '',
    
    // 排序
    sortBy: 'createdAt',
    sortOrder: 'desc',
    
    // 状态
    isLoading: false,
    isRefreshing: false,
    hasMore: true,
    
    // 搜索相关
    searchValue: '',
    showSearch: false
  },

  onLoad: function () {
    // 检查登录状态
    if (!app.checkAuth(this)) {
      return
    }
    
    this.loadRoutes()
  },

  onShow: function () {
    // 每次显示页面时刷新数据
    if (app.globalData.isLoggedIn) {
      this.refreshRoutes()
    }
  },

  // 加载路线列表
  loadRoutes: function(page = 1) {
    const that = this
    
    if (page === 1) {
      that.setData({ isLoading: true })
    } else {
      that.setData({ isRefreshing: true })
    }
    
    const filter = {}
    if (that.data.filterStatus !== 'all') {
      filter.status = that.data.filterStatus
    }
    
    if (that.data.filterDestination) {
      filter.destination = that.data.filterDestination
    }
    
    wx.cloud.callFunction({
      name: 'get-routes',
      data: {
        page: page,
        limit: that.data.pageSize,
        ...filter,
        sortBy: that.data.sortBy,
        sortOrder: that.data.sortOrder
      },
      success: (res) => {
        if (res.result.success) {
          const newRoutes = page === 1 ? res.result.data.routes : [...that.data.routes, ...res.result.data.routes]
          
          that.setData({
            routes: newRoutes,
            currentPage: page,
            total: res.result.data.total,
            totalPages: res.result.data.totalPages,
            hasMore: page < res.result.data.totalPages,
            isLoading: false,
            isRefreshing: false
          })
        } else {
          that.setData({
            isLoading: false,
            isRefreshing: false
          })
          wx.showToast({
            title: res.result.error || '加载失败',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        console.error('加载路线列表失败:', err)
        that.setData({
          isLoading: false,
          isRefreshing: false
        })
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'error'
        })
      }
    })
  },

  // 刷新路线列表
  refreshRoutes: function() {
    this.setData({
      currentPage: 1,
      routes: [],
      hasMore: true
    })
    this.loadRoutes(1)
  },

  // 加载更多
  loadMore: function() {
    if (this.data.isLoading || this.data.isRefreshing || !this.data.hasMore) {
      return
    }
    
    const nextPage = this.data.currentPage + 1
    this.loadRoutes(nextPage)
  },

  // 跳转到路线详情
  navigateToRouteDetail: function(e) {
    const routeId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/route-detail/route-detail?id=${routeId}`
    })
  },

  // 跳转到路线生成
  navigateToGenerate: function() {
    wx.navigateTo({
      url: '/pages/route-generate/route-generate'
    })
  },

  // 筛选状态
  onFilterStatusChange: function(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      filterStatus: status,
      currentPage: 1,
      routes: [],
      hasMore: true
    })
    this.loadRoutes(1)
  },

  // 搜索目的地
  onSearchInput: function(e) {
    this.setData({
      searchValue: e.detail.value
    })
  },

  // 执行搜索
  onSearchConfirm: function() {
    this.setData({
      filterDestination: this.data.searchValue,
      currentPage: 1,
      routes: [],
      hasMore: true,
      showSearch: false
    })
    this.loadRoutes(1)
  },

  // 清除搜索
  onClearSearch: function() {
    this.setData({
      searchValue: '',
      filterDestination: '',
      currentPage: 1,
      routes: [],
      hasMore: true,
      showSearch: false
    })
    this.loadRoutes(1)
  },

  // 切换搜索框显示
  toggleSearch: function() {
    this.setData({
      showSearch: !this.data.showSearch,
      searchValue: ''
    })
  },

  // 排序
  onSortChange: function(e) {
    const sortBy = e.currentTarget.dataset.sort
    let sortOrder = 'desc'
    
    if (this.data.sortBy === sortBy) {
      sortOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc'
    }
    
    this.setData({
      sortBy: sortBy,
      sortOrder: sortOrder,
      currentPage: 1,
      routes: [],
      hasMore: true
    })
    this.loadRoutes(1)
  },

  // 删除路线
  onDeleteRoute: function(e) {
    const routeId = e.currentTarget.dataset.id
    const routeIndex = e.currentTarget.dataset.index
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条路线吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteRoute(routeId, routeIndex)
        }
      }
    })
  },

  // 删除路线
  deleteRoute: function(routeId, routeIndex) {
    const that = this
    wx.showLoading({
      title: '删除中',
    })
    
    // 这里应该调用云函数删除路线
    // 暂时模拟删除
    setTimeout(() => {
      wx.hideLoading()
      
      const routes = [...that.data.routes]
      routes.splice(routeIndex, 1)
      
      that.setData({
        routes: routes,
        total: that.data.total - 1
      })
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
    }, 1000)
  },

  // 分享路线
  onShareRoute: function(e) {
    const routeId = e.currentTarget.dataset.id
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.refreshRoutes()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom: function() {
    this.loadMore()
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '我的旅游路线 - AI旅游路线规划',
      path: '/pages/my-routes/my-routes'
    }
  },

  // 格式化日期
  formatDate: function(date) {
    return util.formatDate(date, 'YYYY-MM-DD')
  },

  // 获取状态文本
  getStatusText: function(status) {
    const statusMap = {
      'generating': '生成中',
      'completed': '已完成',
      'failed': '失败'
    }
    return statusMap[status] || status
  },

  // 获取状态颜色
  getStatusColor: function(status) {
    const colorMap = {
      'generating': '#ff9800',
      'completed': '#4CAF50',
      'failed': '#f44336'
    }
    return colorMap[status] || '#999'
  }
})