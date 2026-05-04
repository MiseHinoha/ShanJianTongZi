let state = 'start'; // start, input, throwing, waiting, result
let canvas, ctx;
let canvasWidth, canvasHeight;
let isDrawing = false;
let bgmAudio, fallAudio;
let canvasImage = '';
let result = ['', ''];

function init() {
  resize();
  window.addEventListener('resize', resize);
  render();
}

function resize() {
  const app = document.getElementById('app');
  const container = document.getElementById('game-container');
  if (!app || !container) return;
  
  const appW = app.clientWidth;
  const appH = app.clientHeight;
  const scale = Math.min(appW / 375, appH / 667);
  container.style.transform = `scale(${scale})`;
}

function render() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const activeScreen = document.querySelector(`.screen[data-screen="${state}"]`);
  if (activeScreen) activeScreen.classList.add('active');
}

function setState(newState) {
  state = newState;
  render();
}

function initBGM() {
  if (!bgmAudio) {
    bgmAudio = new Audio('Assets/sound/Morning_in_the_Valley.mp3');
    bgmAudio.loop = true;
    bgmAudio.volume = 0.5;
  }
  bgmAudio.play().catch(() => {
    // 移动端可能阻止自动播放，忽略错误
  });
}

function playFallSound() {
  if (!fallAudio) {
    fallAudio = new Audio('Assets/sound/Lingpai_Fall.wav');
    fallAudio.volume = 0.8;
  }
  fallAudio.currentTime = 0;
  fallAudio.play().catch(() => {});
}

function initCanvas() {
  canvas = document.getElementById('writeCanvas');
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.strokeStyle = '#6B4423';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  canvasWidth = rect.width;
  canvasHeight = rect.height;
  
  // 绑定触摸事件
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  
  // 绑定鼠标事件（方便 PC 端调试和游玩）
  canvas.addEventListener('mousedown', onMouseDown);
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function onTouchStart(e) {
  e.preventDefault();
  if (!ctx) return;
  const pos = getPos(e);
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function onTouchMove(e) {
  e.preventDefault();
  if (!isDrawing || !ctx) return;
  const pos = getPos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function onTouchEnd() {
  isDrawing = false;
  if (ctx) {
    ctx.closePath();
  }
}

function onMouseDown(e) {
  if (!ctx) return;
  isDrawing = true;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  
  function onMouseMove(ev) {
    if (!isDrawing) return;
    const p = getPos(ev);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  
  function onMouseUp() {
    isDrawing = false;
    if (ctx) ctx.closePath();
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }
  
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onShowGuide() {
  const overlay = document.getElementById('guideOverlay');
  if (overlay) overlay.classList.add('active');
}

function onCloseGuide() {
  const overlay = document.getElementById('guideOverlay');
  if (overlay) overlay.classList.remove('active');
}

function onStartQuestion() {
  initBGM();
  setState('input');

  const wrapper = document.getElementById('lingpaiWrapper');
  if (wrapper) {
    wrapper.classList.remove('slide-up');
    void wrapper.offsetWidth; // 强制重排以重启动画
    wrapper.classList.add('slide-up');
  }

  // 延迟初始化 canvas 确保 DOM 已渲染
  setTimeout(() => {
    initCanvas();
  }, 100);
}

function onRewrite() {
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }
}

function onSubmitQuestion() {
  if (canvas) {
    canvasImage = canvas.toDataURL('image/png');
  } else {
    canvasImage = '';
  }
  
  setState('throwing');
  
  const lingpaiThrow = document.getElementById('lingpaiThrow');
  const tangbingWrapper = document.getElementById('tangbingWrapper');
  
  if (lingpaiThrow) {
    lingpaiThrow.classList.remove('throw-in');
    void lingpaiThrow.offsetWidth;
    lingpaiThrow.classList.add('throw-in');
  }
  
  if (tangbingWrapper) {
    tangbingWrapper.classList.remove('tangbing-throw');
    void tangbingWrapper.offsetWidth;
    tangbingWrapper.classList.add('tangbing-throw');
  }
  
  setTimeout(() => {
    setState('waiting');
    generateResult();
  }, 1200);
}

function generateResult() {
  const random = Math.floor(Math.random() * 3);
  let res;
  
  switch(random) {
    case 0: // 红红 - 是
      res = ['red', 'red'];
      break;
    case 1: // 红黑 - 不确定
      res = ['red', 'black'];
      break;
    case 2: // 黑黑 - 否
      res = ['black', 'black'];
      break;
  }
  
  result = res;
  
  setTimeout(() => {
    playFallSound();
    setState('result');
    
    const userDrawing = document.getElementById('userDrawing');
    if (userDrawing) userDrawing.src = canvasImage;
    
    const dot0 = document.getElementById('resultDot0');
    const dot1 = document.getElementById('resultDot1');
    if (dot0) dot0.className = 'result-dot ' + result[0];
    if (dot1) dot1.className = 'result-dot ' + result[1];
    
    const resultWrapper = document.getElementById('resultWrapper');
    if (resultWrapper) {
      resultWrapper.classList.remove('drop-down');
      void resultWrapper.offsetWidth;
      resultWrapper.classList.add('drop-down');
    }
  }, 1500);
}

function onPlayAgain() {
  setState('start');
  canvasImage = '';
  result = ['', ''];
  
  // 清空动画类
  const lingpaiWrapper = document.getElementById('lingpaiWrapper');
  const lingpaiThrow = document.getElementById('lingpaiThrow');
  const tangbingWrapper = document.getElementById('tangbingWrapper');
  const resultWrapper = document.getElementById('resultWrapper');
  
  if (lingpaiWrapper) lingpaiWrapper.classList.remove('slide-up');
  if (lingpaiThrow) lingpaiThrow.classList.remove('throw-in');
  if (tangbingWrapper) tangbingWrapper.classList.remove('tangbing-throw');
  if (resultWrapper) resultWrapper.classList.remove('drop-down');
  
  // 清空 canvas
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }
}

window.onload = init;
