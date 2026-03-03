// pages/profile/profile.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    stats: {
      totalRoutes: 0,
      completedRoutes: 0,
      totalBudget: 0,
      favoriteDestinations: []
    },
    menuItems: [
      { id: 'settings', name: '设置', icon: '⚙️', color: '#2196F3' },
      { id: 'help', name: '帮助与反馈', icon: '❓', color: '#FF9800' },
      { id: 'about', name: '关于我们', icon: 'ℹ️', color: '#9C27B0' },
      { id: 'privacy', name: '隐私政策', icon: '🔒', color: '#607D8B' }
    ],
    version: '1.0.0'
  },

  onLoad: function () {
    this.loadUserInfo()
    this.loadUserStats()
  },

  onShow: function () {
    // 每次显示页面时刷新用户信息
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
  },

  // 加载用户信息
  loadUserInfo: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
  },

  // 加载用户统计
  loadUserStats: function() {
    // 这里可以调用云函数获取用户统计信息
    // 暂时使用模拟数据
    setTimeout(() => {
      this.setData({
        stats: {
          totalRoutes: 12,
          completedRoutes: 8,
          totalBudget: 25600,
          favoriteDestinations: ['上海', '北京', '杭州', '成都']
        }
      })
    }, 500)
  },

  // 跳转到我的路线
  navigateToMyRoutes: function() {
    wx.switchTab({
      url: '/pages/my-routes/my-routes'
    })
  },

  // 跳转到路线生成
  navigateToGenerate: function() {
    wx.navigateTo({
      url: '/pages/route-generate/route-generate'
    })
  },

  // 菜单项点击
  onMenuItemTap: function(e) {
    const itemId = e.currentTarget.dataset.id
    
    switch (itemId) {
      case 'settings':
        this.navigateToSettings()
        break
      case 'help':
        this.navigateToHelp()
        break
      case 'about':
        this.navigateToAbout()
        break
      case 'privacy':
        this.navigateToPrivacy()
        break
    }
  },

  // 跳转到设置
  navigateToSettings: function() {
    wx.showModal({
      title: '设置',
      content: '设置功能正在开发中',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 跳转到帮助
  navigateToHelp: function() {
    wx.showModal({
      title: '帮助与反馈',
      content: '如有问题或建议，请联系我们：\n\n邮箱：support@travel-ai.com\n\n我们将尽快回复您的问题。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 跳转到关于
  navigateToAbout: function() {
    wx.showModal({
      title: '关于我们',
      content: 'AI旅游路线规划 v1.0.0\n\n基于AI技术，为您提供个性化的旅游路线规划服务。\n\n让每一次旅行都更加精彩！',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 跳转到隐私政策
  navigateToPrivacy: function() {
    wx.showModal({
      title: '隐私政策',
      content: '1. 我们尊重并保护您的个人隐私\n2. 仅收集必要的服务数据\n3. 数据用于路线推荐和个性化服务\n4. 您可以随时查看和管理您的数据\n5. 我们不会将您的数据分享给第三方',
      showCancel: false,
      confirmText: '同意'
    })
  },

  // 退出登录
  onLogout: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }, 1500)
        }
      }
    })
  },

  // 清除缓存
  onClearCache: function() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({
                title: '缓存已清除',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 检查更新
  onCheckUpdate: function() {
    wx.showLoading({
      title: '检查中',
    })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '检查更新',
        content: '当前已是最新版本',
        showCancel: false,
        confirmText: '知道了'
      })
    }, 1000)
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: 'AI旅游路线规划 - 智能生成个性化旅行路线',
      path: '/pages/profile/profile'
    }
  },

  // 格式化金额
  formatMoney: function(amount) {
    return util.formatMoney(amount)
  }
})