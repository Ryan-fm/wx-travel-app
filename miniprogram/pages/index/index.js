// pages/index/index.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    userInput: '',
    inputFocused: false,
    showAnalysis: false,
    analysisResult: null,
    isAnalyzing: false,
    isGenerating: false,
    routes: [],
    isEditMode: false,
    allPreferences: ['美食', '文化', '自然', '购物', '休闲', '探险', '历史', '艺术', '摄影', '运动'],
      isRecording: false,
      recorderManager: null
    },

    onLoad: function () {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }

    // 检查登录状态
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }

    // 加载用户路线
    this.loadUserRoutes()
  },

  onShow: function () {
    // 每次显示页面时检查登录状态
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
      // 重新加载路线数据
      this.loadUserRoutes()
    }
  },

  // 加载用户路线
  loadUserRoutes: function() {
    const that = this

    if (!app.globalData.isLoggedIn) {
      that.setData({ routes: [] })
      return
    }

    wx.cloud.callFunction({
      name: 'get-routes',
      data: {
        page: 1,
        limit: 10
      },
      success: (res) => {
        console.log('获取用户路线成功:', res)
        // 格式化日期
        let routes = res.result.routes || []
        routes = routes.map(route => {
          if (route.createTime) {
            const date = new Date(route.createTime)
            route.createTime = `${date.getMonth() + 1}月${date.getDate()}日`
          }
          return route
        })
        that.setData({
          routes: routes
        })
      },
      fail: (err) => {
        console.error('获取用户路线失败:', err)
        that.setData({ routes: [] })
      }
    })
  },

  // 处理登录
  handleLogin: function() {
    const that = this
    app.login(function(success) {
      if (success) {
        that.setData({
          userInfo: app.globalData.userInfo,
          hasUserInfo: true
        })
        // 重新加载数据
        that.loadUserRoutes()
      }
    })
  },

  // 用户输入
  onUserInput: function(e) {
    this.setData({
      userInput: e.detail.value
    })
  },

  // 清空输入
  clearInput: function() {
    this.setData({
      userInput: '',
      inputFocused: true
    })
  },

  onInputFocus: function() {
    this.setData({ inputFocused: true })
  },

  onInputBlur: function() {
    this.setData({ inputFocused: false })
  },

  // 切换语音输入
  toggleVoiceInput: function() {
    const that = this

    if (this.data.isRecording) {
      // 停止录音
      this.stopRecording()
    } else {
      // 开始录音
      this.startRecording()
    }
  },

  // 开始录音
  startRecording: function() {
    const that = this

    // 获取录音管理器
    if (!this.data.recorderManager) {
      this.setData({
        recorderManager: wx.getRecorderManager()
      })
    }

    const recorderManager = this.data.recorderManager

    // 监听录音结束事件
    recorderManager.onStop((res) => {
      console.log('录音结束', res)
      const { tempFilePath, duration } = res

      // 如果录音时间太短，提示用户
      if (duration < 1000) {
        wx.showToast({
          title: '录音时间太短',
          icon: 'none'
        })
        that.setData({ isRecording: false })
        return
      }

      // 识别语音
      that.recognizeVoice(tempFilePath)
    })

    // 监听录音错误事件
    recorderManager.onError((err) => {
      console.error('录音错误', err)
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      })
      that.setData({ isRecording: false })
    })

    // 开始录音
    recorderManager.start({
      format: 'mp3',
      duration: 60000 // 最长60秒
    })

    this.setData({ isRecording: true })

    wx.showToast({
      title: '开始录音',
      icon: 'none'
    })
  },

  // 停止录音
  stopRecording: function() {
    if (this.data.recorderManager) {
      this.data.recorderManager.stop()
    }
    this.setData({ isRecording: false })
  },

  // 识别语音
  recognizeVoice: function(filePath) {
    const that = this

    wx.showLoading({
      title: '识别中...',
      mask: true
    })

    // 使用微信同声传译插件或云函数进行语音识别
    // 这里使用云开发AI能力进行语音识别
    wx.cloud.callFunction({
      name: 'voice-recognition',
      data: {
        fileID: filePath
      },
      success: (res) => {
        wx.hideLoading()
        console.log('语音识别结果', res)

        if (res.result && res.result.text) {
          const recognizedText = res.result.text
          // 将识别结果添加到输入框
          const currentInput = that.data.userInput
          that.setData({
            userInput: currentInput + (currentInput ? '，' : '') + recognizedText
          })
          wx.showToast({
            title: '识别成功',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: '未识别到内容',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('语音识别失败', err)

        // 如果云函数失败，提示用户手动输入
        wx.showModal({
          title: '提示',
          content: '语音识别服务暂不可用，请手动输入或稍后再试',
          showCancel: false
        })
      }
    })
  },

  // 使用示例
  useExample: function(e) {
    const example = e.currentTarget.dataset.example
    this.setData({
      userInput: example
    })
  },

  // AI分析用户输入 - 使用 wx.cloud.extend.AI 前端直接调用
  analyzeInput: async function() {
    const that = this
    const { userInput } = this.data

    if (!userInput.trim()) {
      wx.showToast({
        title: '请输入您的旅行需求',
        icon: 'none'
      })
      return
    }

    this.setData({ isAnalyzing: true })
    wx.showLoading({ title: 'AI分析中...', mask: true })

    try {
      const prompt = `分析以下用户旅行需求，提取关键信息：

用户输入：${userInput.trim()}

请提取以下信息并以JSON格式返回：
{
  "destination": "目的地（城市或景点名称）",
  "days": 天数（数字），
  "budget": 预算（数字，如果没有提到则默认2000），
  "preferences": ["偏好1", "偏好2"]（可能的偏好包括：美食、文化、自然、购物、休闲、探险）
}

请确保返回的是有效的JSON格式，不要包含其他文本。`

      const model = wx.cloud.extend.AI.createModel('hunyuan-exp')
      const res = await model.generateText({
        model: 'hunyuan-t1-latest',
        messages: [
          {
            role: 'system',
            content: '你是一个旅行需求分析助手，请从用户的输入中提取旅行相关信息。返回格式必须是有效的JSON。'
          },
          { role: 'user', content: prompt }
        ]
      })

      const aiContent = res.choices[0].message.content
      const analysisResult = that._parseAIResponse(aiContent)

      wx.hideLoading()
      that.setData({
        isAnalyzing: false,
        showAnalysis: true,
        analysisResult,
        isEditMode: false
      })
    } catch (err) {
      console.error('AI分析失败:', err)
      wx.hideLoading()
      that.setData({ isAnalyzing: false })
      // Fallback to local parsing
      const localAnalysis = that.localAnalyze(userInput)
      that.setData({
        showAnalysis: true,
        analysisResult: localAnalysis,
        isEditMode: false
      })
    }
  },

  // Parse AI response JSON
  _parseAIResponse: function(content) {
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*}/)
      const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json\n|\n```/g, '') : content
      const parsed = JSON.parse(jsonStr)
      return {
        destination: parsed.destination || '',
        days: parseInt(parsed.days) || 3,
        budget: parseInt(parsed.budget) || 2000,
        preferences: Array.isArray(parsed.preferences) ? parsed.preferences : ['文化']
      }
    } catch (e) {
      throw new Error('AI响应格式错误')
    }
  },

  // 本地分析用户输入（备用方案）
  localAnalyze: function(input) {
    const analysis = {
      destination: '',
      days: 3,
      budget: 2000,
      preferences: []
    }

    // 提取目的地
    const cityMatch = input.match(/去(.+?)(玩|旅游|游|天|日)/)
    if (cityMatch) {
      analysis.destination = cityMatch[1].trim()
    }

    // 提取天数
    const daysMatch = input.match(/(\d+)[天日]/)
    if (daysMatch) {
      analysis.days = parseInt(daysMatch[1])
    }

    // 提取预算
    const budgetMatch = input.match(/(\d+)元/)
    if (budgetMatch) {
      analysis.budget = parseInt(budgetMatch[1])
    }

    // 提取偏好
    const preferences = []
    if (input.includes('美食') || input.includes('吃')) {
      preferences.push('美食')
    }
    if (input.includes('文化') || input.includes('历史') || input.includes('博物馆')) {
      preferences.push('文化')
    }
    if (input.includes('自然') || input.includes('风景') || input.includes('山水')) {
      preferences.push('自然')
    }
    if (input.includes('购物') || input.includes('逛街')) {
      preferences.push('购物')
    }
    if (input.includes('休闲') || input.includes('放松') || input.includes('度假')) {
      preferences.push('休闲')
    }
    if (input.includes('探险') || input.includes('冒险')) {
      preferences.push('探险')
    }

    analysis.preferences = preferences.length > 0 ? preferences : ['文化']

    // 如果没有提取到目的地，使用默认值
    if (!analysis.destination) {
      analysis.destination = '北京'
    }

    return analysis
  },

  // 切换编辑模式
  toggleEditMode: function() {
    this.setData({
      isEditMode: !this.data.isEditMode
    })
  },

  // 编辑目的地
  onEditDestination: function(e) {
    this.setData({
      'analysisResult.destination': e.detail.value
    })
  },

  // 编辑天数
  onEditDays: function(e) {
    this.setData({
      'analysisResult.days': parseInt(e.detail.value) || 1
    })
  },

  // 编辑预算
  onEditBudget: function(e) {
    this.setData({
      'analysisResult.budget': parseInt(e.detail.value) || 2000
    })
  },

  // 切换偏好
  togglePreference: function(e) {
    const preference = e.currentTarget.dataset.preference
    const preferences = this.data.analysisResult.preferences || []
    const index = preferences.indexOf(preference)

    if (index > -1) {
      // 移除偏好
      preferences.splice(index, 1)
    } else {
      // 添加偏好
      preferences.push(preference)
    }

    this.setData({
      'analysisResult.preferences': preferences
    })
  },

  // 重新分析
  reanalyze: function() {
    this.setData({
      showAnalysis: false,
      isEditMode: false,
      analysisResult: null
    })
  },

  // 确认分析结果并生成路线 - 跳转详情页，在详情页调用AI生成，完成后保存
  confirmAnalysis: function() {
    const { analysisResult, userInput } = this.data

    if (!analysisResult) {
      wx.showToast({ title: '请先分析需求', icon: 'none' })
      return
    }

    if (!app.checkAuth(this)) return

    const params = {
      destination: analysisResult.destination,
      days: analysisResult.days,
      budget: analysisResult.budget || 2000,
      tags: analysisResult.preferences || [],
      style: 'balanced',
      userInput: (userInput || '').trim()
    }
    app.globalData.pendingRouteParams = params
    wx.navigateTo({
      url: '/pages/route-detail/route-detail'
    })
    this.loadUserRoutes()
  },

  // 生成路线（直接生成，不经过分析）
  generateRoute: function() {
    this.confirmAnalysis()
  },

  // 查看路线详情
  viewRouteDetail: function(e) {
    const routeId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/route-detail/route-detail?id=${routeId}`
    })
  },

  // 查看历史路线
  viewHistory: function() {
    if (!app.checkAuth(this)) {
      return
    }

    wx.navigateTo({
      url: '/pages/my-routes/my-routes'
    })
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadUserRoutes()
    wx.stopPullDownRefresh()
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '旅行规划 - 智能生成个性化旅行路线',
      path: '/pages/index/index'
    }
  }
})