import { useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';

const sfxFiles = [
  '/sounds/chair1.mp3', '/sounds/paper1.mp3', '/sounds/paper2.mp3',
  '/sounds/paper3.mp3', '/sounds/paper4.mp3', '/sounds/paper5.mp3',
  '/sounds/paper6.mp3', '/sounds/eraser1.mp3', '/sounds/eraser2.mp3',
  '/sounds/pendrop.mp3'
];

export default function useExamAudio({ timeLeft, totalTime, isRunning, ambientOn, mode, sfxEnabled }) {
  const flags = useRef({ start: false, thirty: false, fiveMin: false, finished: false });
  const soundsRef = useRef({});

  // 1. โหลดไฟล์เสียงทั้งหมดรอไว้ล่วงหน้า และปลดล็อก Safari
  useEffect(() => {
    soundsRef.current['start'] = new Howl({ src: ['/sounds/start.mp3'], volume: 0.8 });
    soundsRef.current['30t'] = new Howl({ src: ['/sounds/30t.mp3'], volume: 0.8 });
    soundsRef.current['05'] = new Howl({ src: ['/sounds/05.mp3'], volume: 0.8 });
    soundsRef.current['finished'] = new Howl({ src: ['/sounds/finished.mp3'], volume: 0.8 });

    sfxFiles.forEach(file => {
      soundsRef.current[file] = new Howl({ src: [file], volume: 0.4 });
    });

    const unlockSafariAudio = () => {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
      document.removeEventListener('click', unlockSafariAudio);
      document.removeEventListener('touchstart', unlockSafariAudio);
    };
    
    document.addEventListener('click', unlockSafariAudio);
    document.addEventListener('touchstart', unlockSafariAudio);

    return () => {
      Howler.unload();
      document.removeEventListener('click', unlockSafariAudio);
      document.removeEventListener('touchstart', unlockSafariAudio);
    };
  }, []);

  // 2. หยุดทุกเสียงทันทีเมื่อปิดปุ่ม Ambient หรือหยุดเวลา
  useEffect(() => {
    if (!ambientOn || mode !== 'full') {
      Howler.stop();
    } else if (!isRunning && timeLeft > 0) {
      Howler.stop();
    }
  }, [ambientOn, isRunning, mode, timeLeft]);

  // 3. รีเซ็ตสถานะเสียงเมื่อเริ่มสอบใหม่
  useEffect(() => {
    if (timeLeft === totalTime) {
      flags.current = { start: false, thirty: false, fiveMin: false, finished: false };
    }
  }, [timeLeft, totalTime]);

  // 4. ระบบประกาศลำโพงโรงเรียน (PA System)
  useEffect(() => {
    if (!ambientOn || mode !== 'full') return;

    const elapsed = totalTime - timeLeft;

    if (isRunning && elapsed > 0 && elapsed < 5 && !flags.current.start) {
      soundsRef.current['start']?.play();
      flags.current.start = true;
    }

    if (isRunning && elapsed >= 1800 && elapsed < 1805 && !flags.current.thirty) {
      soundsRef.current['30t']?.play();
      flags.current.thirty = true;
    }

    if (isRunning && timeLeft <= 300 && timeLeft > 295 && !flags.current.fiveMin) {
      soundsRef.current['05']?.play();
      flags.current.fiveMin = true;
    }

    if (timeLeft === 0 && !flags.current.finished) {
      soundsRef.current['finished']?.play();
      flags.current.finished = true;
    }
  }, [timeLeft, totalTime, isRunning, ambientOn, mode]);

  // 5. ระบบ Random SFX บรรยากาศ
  useEffect(() => {
    let timeoutId;

    const playRandomSfx = () => {
      if (!ambientOn || !sfxEnabled || !isRunning || mode !== 'full') return;

      const randomFile = sfxFiles[Math.floor(Math.random() * sfxFiles.length)];
      soundsRef.current[randomFile]?.play();

      const nextTime = Math.floor(Math.random() * (25000 - 8000 + 1)) + 8000;
      timeoutId = setTimeout(playRandomSfx, nextTime);
    };

    if (ambientOn && isRunning && mode === 'full') {
      timeoutId = setTimeout(playRandomSfx, 3000);
    }

    return () => clearTimeout(timeoutId);
  }, [ambientOn, isRunning, mode, sfxEnabled]);
  useEffect(() => {
    if (!sfxEnabled) {
      sfxFiles.forEach(file => soundsRef.current[file]?.stop());
    }
  }, [sfxEnabled]);
}