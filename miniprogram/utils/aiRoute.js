// utils/aiRoute.js - 智能路线生成工具

function buildPrompt(params) {
  const { destination, days, budget, tags, style, userInput } = params
  const tagsStr = Array.isArray(tags) ? tags.join('、') : (tags || '')
  const extraReq = (userInput || '').trim()
  const extraSection = extraReq ? `\n用户原始描述/其他需求：${extraReq}\n（请尽量满足用户描述中的其他期望，如特定景点、住宿偏好、出行方式等）` : ''
  return `请为${destination}设计一个${days}天的旅游路线。

预算范围：${budget}元
兴趣标签：${tagsStr}
旅行风格：${style || 'balanced'}${extraSection}

请用Markdown格式输出，使用 ## 作为每天标题，- 作为行程项，便于阅读。内容请保持精简，每个行程项description控制在50字内。在内容最后，用\`\`\`json 代码块包含以下结构化数据供系统使用：
{
  "itinerary": [{"day":1,"title":"第一天","items":[{"time":"09:00-10:00","location":"地点","activity":"活动","description":"说明","estimatedCost":100,"coordinates":{"lat":31.23,"lng":121.47}}],"totalCost":500}],
  "totalBudget": ${budget},
  "tips": ["建议1","建议2"],
  "transportation": "交通建议"
}
注意：控制总输出在3000字以内，务必输出完整可解析的json代码块。`
}

// 移除JSON代码块 - 用于显示优化
function stripJsonBlock(text) {
  const jsonStart = text.indexOf('```json')
  if (jsonStart === -1) return text.trim()
  return text.substring(0, jsonStart).trim()
}

function mdToHtml(md) {
  if (!md) return ''
  const style = 'color:rgba(255,255,255,0.9);font-size:24rpx'
  let html = md
    .replace(/^### (.+)$/gm, `<h3 style="font-size:28rpx;font-weight:bold;margin:12rpx 0;${style}">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="font-size:32rpx;font-weight:bold;margin:16rpx 0;${style}">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h1 style="font-size:36rpx;font-weight:bold;margin:20rpx 0;${style}">$1</h1>`)
    .replace(/^- (.+)$/gm, `<div style="margin:8rpx 0;padding-left:24rpx;${style}">&#8226; $1</div>`)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\n/g, '<br/>')
  return `<div style="${style};line-height:1.6">${html}</div>`
}

function tryParseJson(str) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}

function repairJson(str) {
  return str
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '')
}

// 尝试修复截断的JSON
function fixTruncatedJson(str) {
  let fixed = str.trim()
  // Remove trailing comma before } or ]
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1')
  // Remove trailing incomplete string (e.g. "descrip or "key":"val)
  fixed = fixed.replace(/,?\s*"[^"]*$/, '')
  fixed = fixed.replace(/,?\s*$/, '')
  const openBraces = (fixed.match(/\{/g) || []).length
  const closeBraces = (fixed.match(/\}/g) || []).length
  const openBrackets = (fixed.match(/\[/g) || []).length
  const closeBrackets = (fixed.match(/\]/g) || []).length
  for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']'
  for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}'
  return fixed
}

// 提取JSON代码块
function extractJsonBlock(content) {
  const jsonStart = content.indexOf('```json')
  if (jsonStart === -1) {
    const objMatch = content.match(/\{[\s\S]*\}/)
    return objMatch ? objMatch[0] : null
  }
  const blockStart = jsonStart + 7
  const blockEnd = content.indexOf('```', blockStart)
  if (blockEnd > -1) {
    return content.substring(blockStart, blockEnd).trim()
  }
  // Truncated: no closing ```, take from start to end
  return content.substring(blockStart).trim()
}

function parseItineraryResponse(content) {
  const jsonStr = extractJsonBlock(content)
  if (!jsonStr || jsonStr.length < 10) throw new Error('路线格式解析失败')

  let result = tryParseJson(jsonStr)
  if (result) return normalizeItinerary(result)

  const repaired = repairJson(jsonStr)
  result = tryParseJson(repaired)
  if (result) return normalizeItinerary(result)

  // Try fix truncated JSON
  const fixed = fixTruncatedJson(repaired)
  result = tryParseJson(fixed)
  if (result) return normalizeItinerary(result)

  // Last resort: extract itinerary array by bracket matching
  const itineraryIdx = jsonStr.indexOf('"itinerary"')
  if (itineraryIdx > -1) {
    const arrStart = jsonStr.indexOf('[', itineraryIdx)
    if (arrStart > -1) {
      let depth = 0
      let arrEnd = -1
      for (let i = arrStart; i < jsonStr.length; i++) {
        const c = jsonStr[i]
        if (c === '[' || c === '{') depth++
        else if (c === ']' || c === '}') {
          depth--
          if (depth === 0 && c === ']') {
            arrEnd = i
            break
          }
        }
      }
      if (arrEnd > -1) {
        const arrStr = repairJson(jsonStr.substring(arrStart, arrEnd + 1))
        const arr = tryParseJson(arrStr)
        if (Array.isArray(arr) && arr.length > 0) {
          return normalizeItinerary({ itinerary: arr, totalBudget: 0, tips: [], transportation: '' })
        }
      }
    }
  }

  throw new Error('路线格式解析失败')
}

function normalizeItinerary(obj) {
  const itinerary = Array.isArray(obj.itinerary) ? obj.itinerary : []
  const normalized = itinerary.map(day => ({
    day: day.day || 0,
    title: day.title || '',
    items: Array.isArray(day.items) ? day.items.map(item => ({
      time: item.time || '',
      location: item.location || '',
      activity: item.activity || '',
      description: item.description || '',
      estimatedCost: item.estimatedCost || 0,
      coordinates: item.coordinates || {},
      imageUrl: item.imageUrl || ''
    })) : [],
    totalCost: day.totalCost || 0
  }))
  return {
    itinerary: normalized,
    totalBudget: obj.totalBudget || 0,
    tips: Array.isArray(obj.tips) ? obj.tips : [],
    transportation: obj.transportation || ''
  }
}

/**
 * 生成行程路线
 * @param {Object} params - destination, days, budget, tags, style
 * @param {Object} options - { onText: (fullText) => void } 回调函数
 * @returns {Promise<Object>} 解析后的行程数据
 */
async function generateItineraryWithAI(params, options = {}) {
  const model = wx.cloud.extend.AI.createModel('hunyuan-exp')
  let fullText = ''
  const res = await model.streamText({
    data: {
      model: 'hunyuan-t1-latest',
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的旅游规划师。请用Markdown格式输出路线（## 每天标题，- 行程列表），最后用 ```json 代码块输出结构化数据（itinerary、totalBudget、tips、transportation）。输出务必精简，总长度控制在3000字以内，每个description不超过50字。'
        },
        { role: 'user', content: buildPrompt(params) }
      ]
    }
  })
  for await (const chunk of res.textStream) {
    fullText += chunk
    if (options.onText) {
      const displayContent = stripJsonBlock(fullText)
      options.onText(mdToHtml(displayContent))
    }
  }
  return parseItineraryResponse(fullText)
}

// 生成真实照片提示词
function buildRealisticPhotoPrompt(desc) {
  return `${desc}。真实实景照片、自然光线、实拍质感、手机/相机拍摄效果、无过度修饰、真实旅游场景`
}

async function generateRouteImageWithAI(params) {
  try {
    const { destination, days, tags, style } = params
    const tagsStr = Array.isArray(tags) ? tags.join('、') : (tags || '')
    const desc = `${destination}${days}日游旅行实景，包含${tagsStr || '当地风光'}，游客视角`
    const prompt = buildRealisticPhotoPrompt(desc)

    const res = await wx.cloud.callFunction({
      name: 'generateImage-vBVdzC',
      data: { prompt }
    })
    const result = res.result
    return result && result.success ? result.imageUrl : null
  } catch (e) {
    console.warn('Image generation failed:', e)
    return null
  }
}

// 为单个活动生成图片
async function generateActivityImageWithAI(location, activity, destination) {
  if (!location && !activity) return null
  try {
    const place = location || destination || '旅游景点'
    const desc = `${place}${activity ? '的' + activity : ''}实景照片`
    const prompt = buildRealisticPhotoPrompt(desc)

    const res = await wx.cloud.callFunction({
      name: 'generateImage-vBVdzC',
      data: { prompt }
    })
    const result = res.result
    return result && result.success ? result.imageUrl : null
  } catch (e) {
    console.warn('Activity image failed:', e)
    return null
  }
}

// 为行程中的所有活动生成图片(批量并行)
async function generateActivityImages(itinerary, destination) {
  const items = []
  itinerary.itinerary.forEach((day, dayIdx) => {
    (day.items || []).forEach((item, itemIdx) => {
      items.push({ ...item, dayIdx, itemIdx })
    })
  })
  if (items.length === 0) return itinerary

  const BATCH = 4
  const enriched = { ...itinerary }
  enriched.itinerary = JSON.parse(JSON.stringify(itinerary.itinerary))

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH)
    const urls = await Promise.all(
      batch.map(item => generateActivityImageWithAI(item.location, item.activity, destination))
    )
    batch.forEach((item, j) => {
      if (urls[j]) {
        enriched.itinerary[item.dayIdx].items[item.itemIdx].imageUrl = urls[j]
      }
    })
  }
  return enriched
}

module.exports = {
  generateItineraryWithAI,
  generateRouteImageWithAI,
  generateActivityImages
}
