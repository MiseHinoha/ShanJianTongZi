Page({
  data: {
    gameState: 'start', // start, input, throwing, waiting, result
    canvasImage: '', // 用户绘制的内容图片
    result: ['', ''], // 存储红红/红黑/黑黑结果
    lingpaiAnim: '',
    throwAnim: '',
    tangbingAnim: '',
    resultAnim: '',
    canvasContext: null,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    showGuide: false, // 是否显示玩法说明弹窗
    guideAnim: '' // 弹窗动画状态：in / out
  },

  onLoad() {
    this.initBGM()
    this.loadCustomFont()
  },

  // 加载自定义字体
  loadCustomFont() {
    wx.loadFontFace({
      family: 'FZGCustom',
      source: 'url("/Assets/font/FZG_CN.ttf")',
      success: (res) => {
        console.log('字体加载成功', res)
      },
      fail: (err) => {
        console.log('字体加载失败', err)
      }
    })
  },

  onReady() {
    this.initCanvas()
  },

  // 初始化背景音乐
  initBGM() {
    const bgm = wx.createInnerAudioContext()
    bgm.src = '/Assets/sound/Morning_in_the_Valley.mp3'
    bgm.loop = true
    bgm.volume = 0.5
    bgm.play()
    this.bgm = bgm
  },

  // 播放掉落音效
  playFallSound() {
    const fallSound = wx.createInnerAudioContext()
    fallSound.src = '/Assets/sound/Lingpai_Fall.wav'
    fallSound.volume = 0.8
    fallSound.play()
  },

  // 初始化Canvas
  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#writeCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        
        // 设置Canvas尺寸 - 适配放大后的书写区域
        const dpr = wx.getSystemInfoSync().pixelRatio
        const width = res[0].width
        const height = res[0].height
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
        
        // 设置画笔样式 - 加粗以适应更大的书写区域
        ctx.strokeStyle = '#6B4423'
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        this.canvas = canvas
        this.ctx = ctx
        this.canvasWidth = width
        this.canvasHeight = height
      })
  },

  // 显示玩法说明弹窗
  onShowGuide() {
    this.setData({ showGuide: true, guideAnim: 'in' })
  },

  // 关闭玩法说明弹窗（点击遮罩时关闭）
  onCloseGuide() {
    if (this.data.guideAnim === 'out') return
    this.setData({ guideAnim: 'out' })
    setTimeout(() => {
      this.setData({ showGuide: false, guideAnim: '' })
    }, 300)
  },

  // 阻止弹窗内容区域点击事件冒泡到遮罩层
  onPopupTap() {
    // 点击弹窗内容时不关闭
  },

  // 开始提问
  onStartQuestion() {
    this.setData({
      gameState: 'input',
      lingpaiAnim: 'slide-up'
    })
    // 延迟初始化canvas确保DOM已渲染
    setTimeout(() => {
      this.initCanvas()
    }, 100)
  },

  // 触摸开始
  onTouchStart(e) {
    if (!this.ctx) return
    const { x, y } = e.touches[0]
    this.setData({ 
      isDrawing: true,
      lastX: x,
      lastY: y
    })
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
  },

  // 触摸移动
  onTouchMove(e) {
    if (!this.data.isDrawing || !this.ctx) return
    const { x, y } = e.touches[0]
    this.ctx.lineTo(x, y)
    this.ctx.stroke()
    this.setData({
      lastX: x,
      lastY: y
    })
  },

  // 触摸结束
  onTouchEnd() {
    this.setData({ isDrawing: false })
    if (this.ctx) {
      this.ctx.closePath()
    }
  },

  // 重写
  onRewrite() {
    if (!this.ctx || !this.canvas) return
    this.ctx.clearRect(0, 0, this.canvasWidth || this.canvas.width, this.canvasHeight || this.canvas.height)
  },

  // 提交问题
  onSubmitQuestion() {
    // 将canvas内容导出为图片
    if (this.canvas) {
      wx.canvasToTempFilePath({
        canvas: this.canvas,
        success: (res) => {
          this.setData({ 
            canvasImage: res.tempFilePath,
            gameState: 'throwing',
            throwAnim: 'throw-in',
            tangbingAnim: 'tangbing-throw'
          })
          
          // 动画结束后进入等待状态
          setTimeout(() => {
            this.setData({ gameState: 'waiting' })
            this.generateResult()
          }, 1200)
        },
        fail: () => {
          // 导出失败也继续流程
          this.setData({ 
            canvasImage: '',
            gameState: 'throwing',
            throwAnim: 'throw-in',
            tangbingAnim: 'tangbing-throw'
          })
          setTimeout(() => {
            this.setData({ gameState: 'waiting' })
            this.generateResult()
          }, 1200)
        }
      })
    } else {
      this.setData({ 
        gameState: 'throwing',
        throwAnim: 'throw-in',
        tangbingAnim: 'tangbing-throw'
      })
      setTimeout(() => {
        this.setData({ gameState: 'waiting' })
        this.generateResult()
      }, 1200)
    }
  },

  // 生成圣杯结果
  generateResult() {
    // 随机生成 0-2
    const random = Math.floor(Math.random() * 3)
    let result
    
    switch(random) {
      case 0: // 红红 - 是
        result = ['red', 'red']
        break
      case 1: // 红黑 - 不确定
        result = ['red', 'black']
        break
      case 2: // 黑黑 - 否
        result = ['black', 'black']
        break
    }

    // 模拟等待时间后显示结果
    setTimeout(() => {
      this.playFallSound()
      this.setData({
        gameState: 'result',
        result: result,
        resultAnim: 'drop-down'
      })
    }, 1500)
  },

  // 再来一次
  onPlayAgain() {
    this.setData({
      gameState: 'start',
      canvasImage: '',
      result: ['', ''],
      lingpaiAnim: '',
      throwAnim: '',
      tangbingAnim: '',
      resultAnim: ''
    })
    // 清空canvas
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvasWidth || this.canvas.width, this.canvasHeight || this.canvas.height)
    }
  },

  onUnload() {
    if (this.bgm) {
      this.bgm.stop()
      this.bgm.destroy()
    }
  }
})
