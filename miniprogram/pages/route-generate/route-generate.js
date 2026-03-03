// pages/route-generate/route-generate.js
const app = getApp()
const util = require('../../utils/util.js')
const aiRoute = require('../../utils/aiRoute.js')

Page({
  data: {
    // 表单数据
    destination: '',
    days: 3,
    budget: 2000,
    selectedTags: [],
    style: 'balanced',
    
    // 标签选项
    tagOptions: [
      { id: 'food', name: '美食', icon: '🍜' },
      { id: 'shopping', name: '购物', icon: '🛍️' },
      { id: 'nature', name: '自然', icon: '🌲' },
      { id: 'culture', name: '文化', icon: '🏛️' },
      { id: 'adventure', name: '冒险', icon: '🧗' },
      { id: 'relax', name: '休闲', icon: '☕' },
      { id: 'family', name: '家庭', icon: '👨‍👩‍👧' },
      { id: 'photography', name: '摄影', icon: '📷' }
    ],
    
    // 风格选项
    styleOptions: [
      { id: 'economical', name: '经济型', desc: '性价比最高' },
      { id: 'balanced', name: '平衡型', desc: '性价比与体验平衡' },
      { id: 'luxury', name: '豪华型', desc: '追求最佳体验' }
    ],
    
    // 天数选项
    dayOptions: [1, 2, 3, 4, 5, 6, 7],
    
    // 状态
    isGenerating: false,
    generateProgress: 0,
    currentStep: 1,
    streamingText: '',
    
    // 预算范围
    minBudget: 500,
    maxBudget: 10000,
    budgetStep: 100
  },

  onLoad: function (options) {
    // 从URL参数获取目的地
    if (options.destination) {
      this.setData({
        destination: decodeURIComponent(options.destination)
      })
    }
    
    // 检查登录状态
    if (!app.checkAuth(this)) {
      return
    }
  },

  // 输入目的地
  onDestinationInput: function(e) {
    this.setData({
      destination: e.detail.value
    })
  },

  // 选择天数
  onDaySelect: function(e) {
    const days = parseInt(e.currentTarget.dataset.days)
    this.setData({ days })
  },

  // 选择预算
  onBudgetChange: function(e) {
    this.setData({
      budget: e.detail.value
    })
  },

  // 选择标签
  onTagSelect: function(e) {
    const tagId = e.currentTarget.dataset.id
    const selectedTags = [...this.data.selectedTags]
    const index = selectedTags.indexOf(tagId)
    
    if (index > -1) {
      selectedTags.splice(index, 1)
    } else {
      if (selectedTags.length < 5) {
        selectedTags.push(tagId)
      } else {
        wx.showToast({
          title: '最多选择5个标签',
          icon: 'none'
        })
        return
      }
    }
    
    this.setData({ selectedTags })
  },

  // 选择风格
  onStyleSelect: function(e) {
    const style = e.currentTarget.dataset.id
    this.setData({ style })
  },

  // 下一步
  onNextStep: function() {
    const { destination, days, budget } = this.data
    
    if (!destination.trim()) {
      wx.showToast({
        title: '请输入目的地',
        icon: 'none'
      })
      return
    }
    
    if (days < 1 || days > 7) {
      wx.showToast({
        title: '请选择1-7天',
        icon: 'none'
      })
      return
    }
    
    if (budget < this.data.minBudget || budget > this.data.maxBudget) {
      wx.showToast({
        title: `预算范围：${this.data.minBudget}-${this.data.maxBudget}`,
        icon: 'none'
      })
      return
    }
    
    this.setData({
      currentStep: 2
    })
  },

  // 上一步
  onPrevStep: function() {
    this.setData({
      currentStep: 1
    })
  },

  // 生成路线 - 前端AI生成 + 云函数保存
  onGenerateRoute: async function() {
    const { destination, days, budget, selectedTags, style, tagOptions } = this.data

    if (selectedTags.length === 0) {
      wx.showToast({ title: '请至少选择一个兴趣标签', icon: 'none' })
      return
    }

    const tags = selectedTags.map(id => {
      const t = tagOptions.find(x => x.id === id)
      return t ? t.name : id
    })

    this.setData({ isGenerating: true, generateProgress: 20, streamingText: '' })

    try {
      const params = { destination, days, budget, tags, style }
      const that = this
      const itinerary = await aiRoute.generateItineraryWithAI(params, {
        onText: (text) => {
          that.setData({ streamingText: text })
        }
      })
      this.setData({ generateProgress: 80 })

      const imageUrl = await aiRoute.generateRouteImageWithAI(params)
      this.setData({ generateProgress: 90 })

      const res = await wx.cloud.callFunction({
        name: 'generate-route',
        data: { ...params, itinerary, imageUrl }
      })

      this.setData({ generateProgress: 100, isGenerating: false })

      if (res.result.success) {
        wx.navigateTo({
          url: `/pages/route-detail/route-detail?id=${res.result.data._id}`,
          success: () => wx.showToast({ title: '路线生成成功', icon: 'success' })
        })
      } else {
        wx.showToast({ title: res.result.error || '生成失败', icon: 'none' })
      }
    } catch (err) {
      console.error('生成路线失败:', err)
      this.setData({ isGenerating: false, generateProgress: 0 })
      wx.showToast({ title: err.message || '生成失败，请重试', icon: 'none' })
    }
  },

  // 使用当前位置
  onUseCurrentLocation: function() {
    const that = this
    wx.showLoading({
      title: '获取位置中',
    })
    
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        wx.hideLoading()
        
        // 这里可以调用逆地理编码API获取位置名称
        // 暂时使用模拟数据
        const locations = ['上海', '北京', '广州', '深圳', '杭州', '成都', '南京', '武汉']
        const randomLocation = locations[Math.floor(Math.random() * locations.length)]
        
        that.setData({
          destination: randomLocation
        })
        
        wx.showToast({
          title: `已定位到：${randomLocation}`,
          icon: 'success'
        })
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '获取位置失败',
          icon: 'error'
        })
      }
    })
  },

  // 格式化预算显示
  formatBudget: function(value) {
    return `¥${value}`
  },

  // 获取标签名称
  getTagName: function(tagId) {
    const tag = this.data.tagOptions.find(t => t.id === tagId)
    return tag ? tag.name : tagId
  },

  // 获取标签图标
  getTagIcon: function(tagId) {
    const tag = this.data.tagOptions.find(t => t.id === tagId)
    return tag ? tag.icon : '🏷️'
  },

  // 获取风格名称
  getStyleName: function(styleId) {
    const style = this.data.styleOptions.find(s => s.id === styleId)
    return style ? style.name : styleId
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: 'AI旅游路线规划 - 智能生成个性化旅行路线',
      path: '/pages/route-generate/route-generate'
    }
  }
})