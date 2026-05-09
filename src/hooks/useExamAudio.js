import { useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';

const sfxFiles = [
  '/sounds/chair1.mp3', '/sounds/paper1.mp3', '/sounds/paper2.mp3',
  '/sounds/paper3.mp3', '/sounds/paper4.mp3', '/sounds/paper5.mp3',
  '/sounds/paper6.mp3', '/sounds/eraser1.mp3', '/sounds/eraser2.mp3',
  '/sounds/pendrop.mp3'
];

export default function useExamAudio({ timeLeft, totalTime, isRunning, ambientOn, mode }) {
  const flags = useRef({ start: false, thirty: false, fiveMin: false, finished: false });

  // 1. หยุดทุกเสียงทันทีเมื่อปิดปุ่ม Ambient หรือเปลี่ยนไปโหมดอื่น
  useEffect(() => {
    if (!ambientOn || !isRunning || mode !== 'full') {
      Howler.stop();
    }
  }, [ambientOn, isRunning, mode]);

  // 2. รีเซ็ตสถานะเสียงเมื่อเริ่มสอบใหม่
  useEffect(() => {
    if (timeLeft === totalTime) {
      flags.current = { start: false, thirty: false, fiveMin: false, finished: false };
    }
  }, [timeLeft, totalTime]);

  // 3. ระบบประกาศลำโพงโรงเรียน (PA System)
  useEffect(() => {
    if (!ambientOn || mode !== 'full') return;

    const playSound = (src) => {
      const sound = new Howl({ src: [src], volume: 0.8 });
      sound.play();
    };

    const elapsed = totalTime - timeLeft;

    // ประกาศตอนเริ่ม (วินาทีแรกๆ ที่เวลาเดิน)
    if (isRunning && elapsed > 0 && elapsed < 5 && !flags.current.start) {
      playSound('/sounds/start.mp3');
      flags.current.start = true;
    }

    // ประกาศ 30 นาทีแรก (ผ่านไป 1800 วินาที)
    if (isRunning && elapsed >= 1800 && elapsed < 1805 && !flags.current.thirty) {
      playSound('/sounds/30t.mp3');
      flags.current.thirty = true;
    }

    // ประกาศ 5 นาทีสุดท้าย (เหลือ 300 วินาที)
    if (isRunning && timeLeft <= 300 && timeLeft > 295 && !flags.current.fiveMin) {
      playSound('/sounds/05.mp3');
      flags.current.fiveMin = true;
    }

    // ประกาศหมดเวลา
    if (timeLeft === 0 && !flags.current.finished) {
      playSound('/sounds/finished.mp3');
      flags.current.finished = true;
    }
  }, [timeLeft, totalTime, isRunning, ambientOn, mode]);

  // 4. ระบบ Random SFX บรรยากาศ
  useEffect(() => {
    let timeoutId;

    const playRandomSfx = () => {
      if (!ambientOn || !isRunning || mode !== 'full') return;

      const randomFile = sfxFiles[Math.floor(Math.random() * sfxFiles.length)];
      const sound = new Howl({ src: [randomFile], volume: 0.4 });
      sound.play();

      // สุ่มให้เสียงต่อไปดังในอีก 8 ถึง 25 วินาทีข้างหน้า
      const nextTime = Math.floor(Math.random() * (25000 - 8000 + 1)) + 8000;
      timeoutId = setTimeout(playRandomSfx, nextTime);
    };

    if (ambientOn && isRunning && mode === 'full') {
      timeoutId = setTimeout(playRandomSfx, 3000); // เริ่มสุ่มเสียงแรกหลังเปิด 3 วิ
    }

    return () => clearTimeout(timeoutId);
  }, [ambientOn, isRunning, mode]);
}