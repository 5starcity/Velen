// lib/videoThumbnail.js
export function extractVideoThumbnail(videoFile) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      video.muted = true;
      video.playsInline = true;
      video.src = URL.createObjectURL(videoFile);
  
      video.addEventListener("loadeddata", () => {
        video.currentTime = 1; // grab frame at 1s
      });
  
      video.addEventListener("seeked", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Thumbnail extraction failed"));
        }, "image/jpeg", 0.85);
      });
  
      video.addEventListener("error", reject);
    });
  }