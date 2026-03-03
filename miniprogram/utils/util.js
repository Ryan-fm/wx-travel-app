// utils/util.js
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 显示成功提示
const showSuccess = (title, duration = 1500) => {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: duration
  })
}

// 显示错误提示
const showError = (title, duration = 1500) => {
  wx.showToast({
    title: title,
    icon: 'error',
    duration: duration
  })
}

// 显示加载中
const showLoading = (title = '加载中') => {
  wx.showLoading({
    title: title,
    mask: true
  })
}

// 隐藏加载中
const hideLoading = () => {
  wx.hideLoading()
}

// 显示确认对话框
const showConfirm = (title, content) => {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: title,
      content: content,
      success: (res) => {
        if (res.confirm) {
          resolve(true)
        } else {
          resolve(false)
        }
      },
      fail: reject
    })
  })
}

// 格式化日期
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours()
  const minute = d.getMinutes()
  const second = d.getSeconds()
  
  const map = {
    'YYYY': year,
    'MM': formatNumber(month),
    'DD': formatNumber(day),
    'HH': formatNumber(hour),
    'mm': formatNumber(minute),
    'ss': formatNumber(second)
  }
  
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, matched => map[matched])
}

// 计算两个日期之间的天数
const getDaysBetween = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2 - d1)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// 格式化金额
const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return '0.00'
  return parseFloat(amount).toFixed(2)
}

// 深拷贝
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 防抖函数
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 生成随机ID
const generateId = () => {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 验证手机号
const validatePhone = (phone) => {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

// 验证邮箱
const validateEmail = (email) => {
  const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return reg.test(email)
}

// 获取当前位置
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: resolve,
      fail: reject
    })
  })
}

module.exports = {
  formatTime,
  formatNumber,
  showSuccess,
  showError,
  showLoading,
  hideLoading,
  showConfirm,
  formatDate,
  getDaysBetween,
  formatMoney,
  deepClone,
  debounce,
  throttle,
  generateId,
  validatePhone,
  validateEmail,
  getCurrentLocation
}