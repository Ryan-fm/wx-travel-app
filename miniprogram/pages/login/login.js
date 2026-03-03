// pages/login/login.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    canIUseGetUserProfile: false,
    isLoggingIn: false,
    loginError: null
  },

  onLoad: function () {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    
    // 如果已经登录，跳转到首页
    if (app.globalData.isLoggedIn) {
      this.navigateBack()
    }
  },

  onShow: function () {
    // 每次显示页面时检查登录状态
    if (app.globalData.isLoggedIn) {
      this.navigateBack()
    }
  },

  // 微信登录
  onWechatLogin: function() {
    const that = this
    that.setData({
      isLoggingIn: true,
      loginError: null
    })
    
    app.login(function(success, error) {
      that.setData({ isLoggingIn: false })
      
      if (success) {
        util.showSuccess('登录成功')
        setTimeout(() => {
          that.navigateBack()
        }, 1500)
      } else {
        that.setData({
          loginError: error?.errMsg || '登录失败，请重试'
        })
        util.showError('登录失败')
      }
    })
  },

  // 手机号登录（预留功能）
  onPhoneLogin: function() {
    wx.showModal({
      title: '提示',
      content: '手机号登录功能正在开发中，请使用微信登录',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 跳转回上一页或首页
  navigateBack: function() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.navigateTo({
        url: '/pages/index/index'
      })
    }
  },

  // 跳转到注册页（预留功能）
  navigateToRegister: function() {
    wx.showModal({
      title: '提示',
      content: '注册功能正在开发中，请使用微信登录',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 用户协议
  onAgreementTap: function() {
    wx.showModal({
      title: '用户协议',
      content: '1. 本小程序会收集必要的用户信息以提供个性化服务\n2. 您的数据将安全存储，不会泄露给第三方\n3. 您可以随时删除您的账户和数据\n4. 使用本服务即表示您同意以上条款',
      showCancel: false,
      confirmText: '同意'
    })
  },

  // 隐私政策
  onPrivacyTap: function() {
    wx.showModal({
      title: '隐私政策',
      content: '1. 我们尊重并保护您的个人隐私\n2. 仅收集必要的服务数据\n3. 数据用于路线推荐和个性化服务\n4. 您可以随时查看和管理您的数据',
      showCancel: false,
      confirmText: '了解'
    })
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: 'AI旅游路线规划 - 智能生成个性化旅行路线',
      path: '/pages/login/login'
    }
  }
})