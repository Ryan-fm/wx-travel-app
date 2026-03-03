// app.js
App({
  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-6grsi20q238e8402', // 需要替换为实际的云环境ID
        traceUser: true,
      });
    }

    // 检查登录状态
    this.checkLoginStatus();
  },

  globalData: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    isLoggedIn: false,
    openid: null,
    pendingRouteParams: null
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = userInfo;
      this.globalData.hasUserInfo = true;
    }
  },

  // 登录方法
  login: function(callback) {
    const that = this;
    
    // 获取用户信息
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        const userInfo = res.userInfo;
        
        // 调用云函数登录
        wx.cloud.callFunction({
          name: 'login',
          data: {
            userInfo: userInfo
          },
          success: (res) => {
            const result = res.result;
            
            // 保存用户信息
            that.globalData.userInfo = userInfo;
            that.globalData.hasUserInfo = true;
            that.globalData.isLoggedIn = true;
            that.globalData.openid = result.openid;
            
            // 保存到本地存储
            wx.setStorageSync('userInfo', userInfo);
            wx.setStorageSync('token', result.token);
            wx.setStorageSync('openid', result.openid);
            
            if (callback) callback(true);
          },
          fail: (err) => {
            console.error('登录失败:', err);
            if (callback) callback(false, err);
          }
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        if (callback) callback(false, err);
      }
    });
  },

  // 登出方法
  logout: function() {
    this.globalData.userInfo = null;
    this.globalData.hasUserInfo = false;
    this.globalData.isLoggedIn = false;
    this.globalData.openid = null;
    
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
    wx.removeStorageSync('openid');
  },

  // 检查是否登录，未登录则跳转到登录页
  checkAuth: function(page) {
    if (!this.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login',
            });
          }
        }
      });
      return false;
    }
    return true;
  }
});