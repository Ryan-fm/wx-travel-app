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
  },
  
  globalData: {
    userInfo: null
  }
});