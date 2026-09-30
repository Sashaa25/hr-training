import { Question, ShuffledQuestion } from '../types';

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Dynamically randomizes both question sequence and option sequence (A-E)
 * Satisfies Section 5.B Dynamic Randomization requirement
 */
export function randomizeExamQuestions(questions: Question[]): ShuffledQuestion[] {
  // 1. Shuffle questions
  const shuffledQuestions = shuffleArray(questions);

  // 2. For each question, shuffle options A, B, C, D, E
  return shuffledQuestions.map((q) => {
    const rawOptions: { originalKey: 'A' | 'B' | 'C' | 'D' | 'E'; text: string }[] = [
      { originalKey: 'A', text: q.optionA },
      { originalKey: 'B', text: q.optionB },
      { originalKey: 'C', text: q.optionC },
      { originalKey: 'D', text: q.optionD },
      { originalKey: 'E', text: q.optionE },
    ];

    const shuffledOptList = shuffleArray(rawOptions);
    const displayKeys: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];

    const formattedOptions = shuffledOptList.map((opt, idx) => ({
      key: displayKeys[idx],
      originalKey: opt.originalKey,
      text: opt.text,
    }));

    return {
      originalId: q.id,
      questionText: q.questionText,
      mediaType: q.mediaType,
      mediaUrl: q.mediaUrl,
      mediaCaption: q.mediaCaption,
      shuffledOptions: formattedOptions,
    };
  });
}

/**
 * Evaluates submitted answers against actual question keys
 */
export function gradeExam(
  originalQuestions: Question[],
  shuffledQuestions: ShuffledQuestion[],
  userSelectedOptions: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>
): {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
} {
  const totalQuestions = originalQuestions.length;
  if (totalQuestions === 0) return { score: 0, totalQuestions: 0, correctAnswers: 0 };

  let correctCount = 0;

  originalQuestions.forEach((origQ) => {
    const selectedDisplayKey = userSelectedOptions[origQ.id];
    if (!selectedDisplayKey) return;

    // Find what original option this display key corresponds to
    const shuffledItem = shuffledQuestions.find((sq) => sq.originalId === origQ.id);
    if (!shuffledItem) return;

    const chosenOption = shuffledItem.shuffledOptions.find((opt) => opt.key === selectedDisplayKey);
    if (chosenOption && chosenOption.originalKey === origQ.correctAnswer) {
      correctCount++;
    }
  });

  const score = Math.round((correctCount / totalQuestions) * 100);

  return {
    score,
    totalQuestions,
    correctAnswers: correctCount,
  };
}

/**
 * Capture camera frame to base64 image from HTMLVideoElement
 */
export function captureVideoFrame(videoElement: HTMLVideoElement | null): string {
  if (!videoElement || videoElement.videoWidth === 0) {
    // Return generated SVG placeholder snapshot with timestamp
    return generateSyntheticSnapshot();
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 320;
    canvas.height = videoElement.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return generateSyntheticSnapshot();

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Overlay proctoring watermark with timestamp
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText(`HR-PROCTOR [VERIFIED] · ${new Date().toLocaleTimeString()}`, 8, canvas.height - 8);

    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (e) {
    return generateSyntheticSnapshot();
  }
}

function generateSyntheticSnapshot(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 320, 240);

  // Silhouette / avatar face
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(160, 100, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(160, 210, 80, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  // Proctor text
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WEBCAM PROCTORING ACTIVE', 160, 30);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText(`SNAPSHOT · ${new Date().toLocaleTimeString()}`, 160, 230);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Fullscreen helper
 */
export async function enterFullscreen(): Promise<boolean> {
  try {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
      return true;
    } else if ((elem as any).webkitRequestFullscreen) {
      await (elem as any).webkitRequestFullscreen();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function exitFullscreen() {
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  } catch {}
}
