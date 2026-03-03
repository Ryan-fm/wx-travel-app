// pages/route-detail/route-detail.js
const app = getApp()
const util = require('../../utils/util.js')
const aiRoute = require('../../utils/aiRoute.js')

Page({
  data: {
    route: null,
    routeId: null,
    isLoading: true,
    isError: false,
    errorMessage: '',
    isGenerating: false,
    streamingText: '',
    streamScrollTop: 0,
    expandedDay: 0,
    markers: [],
    polyline: [],
    latitude: 31.2304,
    longitude: 121.4737,
    scale: 14,
    isSharing: false,
    shareImagePath: '',
    showAdjustSheet: false,
    showMapExpanded: false,
    adjustForm: {
      destination: '',
      days: 3,
      budget: 2000,
      selectedTags: []
    },
    allPreferences: ['美食', '文化', '自然', '购物', '休闲', '探险', '历史', '艺术', '摄影', '运动']
  },

  onLoad: function (options) {
    const params = app.globalData.pendingRouteParams
    if (options.id) {
      this.setData({ routeId: options.id })
      this.loadRouteDetail(options.id)
    } else if (params) {
      app.globalData.pendingRouteParams = null
      this.setData({
        isLoading: false,
        route: {
          title: `${params.destination} ${params.days}日游`,
          destination: params.destination,
          days: params.days,
          budget: params.budget,
          tags: params.tags,
          status: 'generating'
        }
      })
      this.startAIGeneration(params)
    } else {
      this.setData({
        isError: true,
        errorMessage: '缺少路线参数',
        isLoading: false
      })
    }
  },

  loadRouteDetail: function(routeId) {
    const that = this
    that.setData({ isLoading: true, isError: false })

    wx.cloud.callFunction({
      name: 'get-route-detail',
      data: { routeId }
    }).then(res => {
      if (res.result.success) {
        const route = res.result.data
        that.setData({
          route,
          isLoading: false,
          streamingText: ''
        })
        that.generateMapData(route)
        if (route.itinerary && route.itinerary.length > 0) {
          that.setData({ expandedDay: 0 })
        }
      } else {
        that.setData({
          isError: true,
          errorMessage: res.result.error || '加载失败',
          isLoading: false
        })
      }
    }).catch(err => {
      console.error('加载路线详情失败:', err)
      that.setData({
        isError: true,
        errorMessage: '网络错误，请重试',
        isLoading: false
      })
    })
  },

  startAIGeneration: function(params) {
    const that = this
    this.setData({ isGenerating: true })

    aiRoute.generateItineraryWithAI(params, {
      onText: (html) => {
        that.setData({
          streamingText: html,
          streamScrollTop: 99999 + Math.random()
        })
      }
    }).then(async (itinerary) => {
      const imageUrl = await aiRoute.generateRouteImageWithAI(params)
      wx.showLoading({ title: '生成行程图片中...', mask: true })
      const enrichedItinerary = await aiRoute.generateActivityImages(itinerary, params.destination)
      wx.hideLoading()
      return wx.cloud.callFunction({
        name: 'generate-route',
        data: { ...params, itinerary: enrichedItinerary, imageUrl }
      })
    }).then(res => {
      that.setData({ isGenerating: false, streamingText: '' })
      if (res.result.success) {
        const route = res.result.data
        that.setData({
          route,
          routeId: route._id
        })
        that.generateMapData(route)
        if (route.itinerary && route.itinerary.length > 0) {
          that.setData({ expandedDay: 0 })
        }
      } else {
        wx.showToast({ title: res.result.error || '保存失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('AI生成失败:', err)
      that.setData({ isGenerating: false })
      wx.showToast({ title: err.message || '生成失败', icon: 'none' })
    })
  },

  // 生成地图数据
  generateMapData: function(route) {
    if (!route.itinerary || route.itinerary.length === 0) {
      return
    }
    
    const markers = []
    const polylinePoints = []
    
    // 提取所有地点的坐标
    route.itinerary.forEach((day, dayIndex) => {
      day.items.forEach((item, itemIndex) => {
        if (item.coordinates && item.coordinates.lat && item.coordinates.lng) {
          const marker = {
            id: markers.length,
            latitude: item.coordinates.lat,
            longitude: item.coordinates.lng,
            title: item.location,
            iconPath: '/images/marker.png',
            width: 30,
            height: 30,
            callout: {
              content: `第${day.day}天: ${item.location}`,
              color: '#333',
              fontSize: 14,
              borderRadius: 4,
              bgColor: '#ffffff',
              padding: 8,
              display: 'ALWAYS'
            }
          }
          markers.push(marker)
          polylinePoints.push({
            latitude: item.coordinates.lat,
            longitude: item.coordinates.lng
          })
        }
      })
    })
    
    // 如果有多个点，生成路线
    let polyline = []
    if (polylinePoints.length > 1) {
      polyline = [{
        points: polylinePoints,
        color: '#4CAF50',
        width: 4,
        dottedLine: false
      }]
    }
    
    // 设置地图中心点为第一个点
    if (polylinePoints.length > 0) {
      this.setData({
        markers: markers,
        polyline: polyline,
        latitude: polylinePoints[0].latitude,
        longitude: polylinePoints[0].longitude
      })
    }
  },

  // 切换日期展开/收起
  toggleDay: function(e) {
    const dayIndex = e.currentTarget.dataset.index
    if (this.data.expandedDay === dayIndex) {
      this.setData({ expandedDay: -1 })
    } else {
      this.setData({ expandedDay: dayIndex })
    }
  },

  openAdjustSheet: function() {
    const route = this.data.route
    if (!route) return
    this.setData({
      showAdjustSheet: true,
      adjustForm: {
        destination: route.destination || '',
        days: route.days || 3,
        budget: route.budget || 2000,
        selectedTags: route.tags || []
      }
    })
  },

  closeAdjustSheet: function() {
    this.setData({ showAdjustSheet: false })
  },

  onAdjustDestination: function(e) {
    this.setData({ 'adjustForm.destination': e.detail.value })
  },

  onAdjustDays: function(e) {
    this.setData({ 'adjustForm.days': parseInt(e.currentTarget.dataset.days) || 3 })
  },

  onAdjustBudget: function(e) {
    this.setData({ 'adjustForm.budget': parseInt(e.detail.value) || 2000 })
  },

  onAdjustTag: function(e) {
    const tag = e.currentTarget.dataset.tag
    const selectedTags = [...(this.data.adjustForm.selectedTags || [])]
    const idx = selectedTags.indexOf(tag)
    if (idx > -1) selectedTags.splice(idx, 1)
    else if (selectedTags.length < 5) selectedTags.push(tag)
    this.setData({ 'adjustForm.selectedTags': selectedTags })
  },

  confirmAdjust: function() {
    const { destination, days, budget, selectedTags } = this.data.adjustForm
    if (!destination || !destination.trim()) {
      wx.showToast({ title: '请输入目的地', icon: 'none' })
      return
    }
    this.closeAdjustSheet()
    const params = {
      destination: destination.trim(),
      days: days || 3,
      budget: budget || 2000,
      tags: selectedTags.length > 0 ? selectedTags : ['文化'],
      style: 'balanced'
    }
    this.setData({
      route: {
        title: `${params.destination} ${params.days}日游`,
        destination: params.destination,
        days: params.days,
        budget: params.budget,
        tags: params.tags,
        status: 'generating'
      }
    })
    this.startAIGeneration(params)
  },

  // 复制路线
  copyRoute: function() {
    const that = this
    wx.showModal({
      title: '复制路线',
      content: '是否要复制此路线并创建新的行程？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/route-generate/route-generate?destination=${encodeURIComponent(that.data.route.destination)}`
          })
        }
      }
    })
  },

  // 分享路线
  shareRoute: function() {
    const that = this
    that.setData({ isSharing: true })
    
    // 这里可以生成分享图片
    // 暂时使用简单的分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    that.setData({ isSharing: false })
  },

  // 保存路线
  saveRoute: function() {
    const route = this.data.route
    if (!route) return
    
    wx.showModal({
      title: '保存路线',
      content: '是否将路线保存到"我的路线"？',
      success: (res) => {
        if (res.confirm) {
          // 这里可以调用云函数保存路线
          wx.showToast({
            title: '已保存',
            icon: 'success'
          })
        }
      }
    })
  },

  // 导出路线
  exportRoute: function() {
    const route = this.data.route
    if (!route) return
    
    wx.showActionSheet({
      itemList: ['保存为图片', '分享给好友', '复制链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.exportAsImage()
        } else if (res.tapIndex === 1) {
          this.shareRoute()
        } else if (res.tapIndex === 2) {
          this.copyRouteLink()
        }
      }
    })
  },

  // 导出为图片
  exportAsImage: function() {
    wx.showLoading({
      title: '生成图片中',
    })
    
    // 这里可以实现生成图片的功能
    // 暂时模拟生成
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '图片已保存到相册',
        icon: 'success'
      })
    }, 1500)
  },

  // 复制链接
  copyRouteLink: function() {
    const routeId = this.data.routeId
    const link = `pages/route-detail/route-detail?id=${routeId}`
    
    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        })
      }
    })
  },

  // 图片预览
  previewImage: function(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.previewImage({
      current: url,
      urls: [url]
    })
  },

  openMapExpand: function() {
    this.setData({ showMapExpanded: true })
  },

  closeMapExpand: function() {
    this.setData({ showMapExpanded: false })
  },

  preventClose: function() {},

  onMapMarkerTap: function(e) {
    const markerId = e.detail.markerId
    const marker = this.data.markers.find(m => m.id === markerId)
    if (marker) {
      wx.openLocation({
        latitude: marker.latitude,
        longitude: marker.longitude,
        name: marker.title || '',
        scale: 18
      })
    }
  },

  // 导航到地点
  navigateToLocation: function(e) {
    const location = e.currentTarget.dataset.location
    const coordinates = e.currentTarget.dataset.coordinates
    
    if (coordinates && coordinates.lat && coordinates.lng) {
      wx.openLocation({
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        name: location,
        scale: 18
      })
    } else {
      wx.showModal({
        title: '提示',
        content: `是否要在地图中搜索"${location}"？`,
        success: (res) => {
          if (res.confirm) {
            wx.openLocation({
              latitude: this.data.latitude,
              longitude: this.data.longitude,
              name: location,
              scale: 18
            })
          }
        }
      })
    }
  },

  // 计算总花费
  calculateTotalCost: function() {
    const route = this.data.route
    if (!route || !route.itinerary) return 0
    
    return route.itinerary.reduce((total, day) => {
      return total + (day.totalCost || 0)
    }, 0)
  },

  // 格式化时间
  formatTime: function(time) {
    if (!time) return ''
    return time.replace('-', ' - ')
  },

  // 分享给好友
  onShareAppMessage: function() {
    const route = this.data.route
    return {
      title: route ? `${route.title} - AI旅游路线规划` : 'AI旅游路线规划',
      path: `/pages/route-detail/route-detail?id=${this.data.routeId}`,
      imageUrl: '/images/share-cover.jpg'
    }
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    const route = this.data.route
    return {
      title: route ? route.title : 'AI旅游路线规划',
      query: `id=${this.data.routeId}`
    }
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    if (this.data.routeId) {
      this.loadRouteDetail(this.data.routeId)
    }
    wx.stopPullDownRefresh()
  },

  // 错误重试
  onRetry: function() {
    if (this.data.routeId) {
      this.loadRouteDetail(this.data.routeId)
    } else {
      wx.navigateBack()
    }
  }
})