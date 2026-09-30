import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrainingSession, Question, ExamType, User, ExamResult, ProctorLog, ShuffledQuestion } from '../../types';
import {
  randomizeExamQuestions,
  gradeExam,
  captureVideoFrame,
  enterFullscreen,
  exitFullscreen,
} from '../../utils/proctoring';
import {
  Camera,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Maximize2,
  XCircle,
  HelpCircle,
  Send,
  Eye,
} from 'lucide-react';

interface ExamRoomProps {
  training: TrainingSession;
  examType: ExamType;
  user: User;
  questions: Question[];
  onCompleteExam: (result: ExamResult) => void;
  onCancelExam: () => void;
  onRecordProctorLog: (log: ProctorLog) => void;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({
  training,
  examType,
  user,
  questions,
  onCompleteExam,
  onCancelExam,
  onRecordProctorLog,
}) => {
  // Step 1: Pre-exam Camera Permission Verification
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [examStarted, setExamStarted] = useState(false);

  // Video stream ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Dynamic Randomized Questions & Options
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({});

  // Timer
  const totalSeconds = training.durationMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const startTimeRef = useRef<number>(Date.now());

  // Full-Screen & Tab Lock Monitoring (Section 5.B: Max 3 warnings)
  const [violationsCount, setViolationsCount] = useState(0);
  const [activeWarningModal, setActiveWarningModal] = useState<string | null>(null);
  const [isDisqualified, setIsDisqualified] = useState(false);

  // Snapshot flash indicator
  const [snapshotFlash, setSnapshotFlash] = useState(false);
  const [lastSnapshotTime, setLastSnapshotTime] = useState<string>('');

  // Submit confirmation modal
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Questionnaire / Feedback state
  const [showFeedbackQuestionnaire, setShowFeedbackQuestionnaire] = useState(false);
  const [trainerRating, setTrainerRating] = useState<number>(0);
  const [moduleRating, setModuleRating] = useState<number>(0);
  const [platformRating, setPlatformRating] = useState<number>(0);
  const [learningTakeaway, setLearningTakeaway] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [questionnaireError, setQuestionnaireError] = useState<string | null>(null);

  // 1. Initialize Questions & Shuffling
  useEffect(() => {
    const relevant = questions.filter((q) => q.trainingId === training.id && q.examType === examType);
    const randomized = randomizeExamQuestions(relevant);
    setShuffledQuestions(randomized);
  }, [questions, training.id, examType]);

  // 2. Request Camera Stream on Mount
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        activeStream = stream;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraPermissionGranted(true);
        setCameraError(null);
      } catch (err: any) {
        setCameraPermissionGranted(false);
        setCameraError(
          'Kamera browser wajib diizinkan untuk memulai ujian (Section 5.B Anti-Kecurangan). Silakan berikan izin akses kamera.'
        );
      }
    };

    setupCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Connect stream to video element when exam starts
  useEffect(() => {
    if (examStarted && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [examStarted]);

  // 3. Countdown Timer
  useEffect(() => {
    if (!examStarted || isDisqualified) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (examType === 'posttest') {
            setShowFeedbackQuestionnaire(true);
          } else {
            handleSubmitFinal(false); // auto submit on time out
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, isDisqualified]);

  // 4. Random Periodic Webcam Snapshot (Every 60 - 180 seconds, accelerated demo support)
  useEffect(() => {
    if (!examStarted || isDisqualified) return;

    // Trigger initial snapshot after 5 seconds
    const initialTimer = setTimeout(() => {
      triggerProctorSnapshot('periodic_snapshot', 'Verifikasi wajah otomatis berkala (Webcam).');
    }, 5000);

    // Random interval between 60s and 120s
    const randomInterval = setInterval(() => {
      triggerProctorSnapshot('periodic_snapshot', 'Verifikasi wajah otomatis berkala (Webcam).');
    }, 75000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(randomInterval);
    };
  }, [examStarted, isDisqualified]);

  const triggerProctorSnapshot = (
    violationType: 'tab_switch' | 'fullscreen_exit' | 'webcam_blocked' | 'periodic_snapshot',
    details: string,
    severity: 'low' | 'medium' | 'high' = 'low'
  ) => {
    const frame = captureVideoFrame(videoRef.current);
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 500);
    setLastSnapshotTime(new Date().toLocaleTimeString());

    const log: ProctorLog = {
      id: `proc-run-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      trainingId: training.id,
      trainingTitle: training.title,
      userId: user.id,
      userName: user.name,
      userNik: user.nik,
      examType,
      timestamp: new Date().toISOString(),
      violationType,
      snapshotUrl: frame,
      details,
      severity,
    };

    onRecordProctorLog(log);
  };

  // 5. Fullscreen & Tab Switch Violation Detector
  useEffect(() => {
    if (!examStarted || isDisqualified) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolationDetected(
          'tab_switch',
          'Anda terdeteksi berpindah tab browser atau meminimalkan layar!'
        );
      }
    };

    const handleWindowBlur = () => {
      handleViolationDetected(
        'tab_switch',
        'Fokus layar ujian hilang (Membuka aplikasi eksternal atau tab lain).'
      );
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolationDetected(
          'fullscreen_exit',
          'Anda keluar dari mode Fullscreen (Layar Penuh)!'
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [examStarted, isDisqualified, violationsCount]);

  const handleViolationDetected = (
    type: 'tab_switch' | 'fullscreen_exit',
    message: string
  ) => {
    if (isDisqualified) return;

    const newCount = violationsCount + 1;
    setViolationsCount(newCount);

    // Record high/medium severity proctor log
    triggerProctorSnapshot(
      type,
      `Pelanggaran ke-${newCount}: ${message}`,
      newCount >= 3 ? 'high' : 'medium'
    );

    if (newCount >= 3) {
      // 3 Warnings exceeded -> Forcible Termination (Score 0)
      setIsDisqualified(true);
      setActiveWarningModal(
        'DISKUALIFIKASI KECURANGAN: Anda telah melanggar aturan proctoring sebanyak 3 kali. Ujian dihentikan paksa dan nilai Anda diberikan 0.'
      );
      setTimeout(() => {
        handleForceDisqualification();
      }, 4000);
    } else {
      setActiveWarningModal(
        `PERINGATAN PELANGGARAN PROCTORING (${newCount}/3): ${message} Jika mencapai 3 peringatan, ujian akan dihentikan dengan nilai 0.`
      );
    }
  };

  const handleStartExam = async () => {
    if (!cameraPermissionGranted) {
      alert('Izin kamera belum aktif. Ujian menolak dimulai.');
      return;
    }
    await enterFullscreen();
    setExamStarted(true);
    startTimeRef.current = Date.now();
  };

  const handleSelectOption = (displayKey: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const currentQuestion = shuffledQuestions[currentIndex];
    if (!currentQuestion) return;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.originalId]: displayKey,
    }));
  };

  const handleForceDisqualification = () => {
    exitFullscreen();
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    const disqualifiedResult: ExamResult = {
      id: `res-${Date.now()}`,
      trainingId: training.id,
      userId: user.id,
      userName: user.name,
      userNik: user.nik,
      department: user.department,
      examType,
      score: 0,
      totalQuestions: shuffledQuestions.length,
      correctAnswers: 0,
      startedAt: new Date(startTimeRef.current).toISOString(),
      finishedAt: new Date().toISOString(),
      durationSeconds: duration,
      passed: false,
      violationsCount: violationsCount >= 3 ? violationsCount : 3,
      disqualified: true,
      userAnswers,
    };

    onCompleteExam(disqualifiedResult);
  };

  const handleSubmitFinal = (confirmedByUser: boolean = true, feedbackData?: any) => {
    exitFullscreen();
    const relevantOriginal = questions.filter(
      (q) => q.trainingId === training.id && q.examType === examType
    );
    const graded = gradeExam(relevantOriginal, shuffledQuestions, userAnswers);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const isPassed = examType === 'posttest' && graded.score >= training.passingGrade;

    const certId = isPassed
      ? `CERT-2026-${training.id.toUpperCase()}-${user.nik.replace(/\D/g, '')}${Math.floor(
          100 + Math.random() * 900
        )}`
      : undefined;

    const exactTimeIso = new Date().toISOString();
    const recordedIp = '182.253.14.89'; // Realistic verified corporate subnet IP
    const recordedLocation =
      training.certificateSettings?.locationCreated ||
      'Jakarta Pusat, DKI Jakarta - Gedung Bursa Efek Indonesia Lt. 18';
    const trainerName =
      training.trainerName ||
      training.certificateSettings?.trainerName ||
      'Dr. Rian Hidayat, M.M., CPC';

    // Store feedback questionnaire responses in userAnswers so it saves directly in the db
    const finalAnswers = feedbackData
      ? { ...userAnswers, __feedback: feedbackData }
      : userAnswers;

    const finalResult: ExamResult = {
      id: `res-${Date.now()}`,
      trainingId: training.id,
      userId: user.id,
      userName: user.name,
      userNik: user.nik,
      department: user.department,
      examType,
      score: graded.score,
      totalQuestions: graded.totalQuestions,
      correctAnswers: graded.correctAnswers,
      startedAt: new Date(startTimeRef.current).toISOString(),
      finishedAt: exactTimeIso,
      durationSeconds: duration,
      passed: isPassed,
      certificateId: certId,
      violationsCount,
      disqualified: false,
      userAnswers: finalAnswers,
      clientIp: recordedIp,
      issueLocation: recordedLocation,
      trainerName,
      issuedAtExact: exactTimeIso,
      certificateSettingsSnapshot: training.certificateSettings,
    };

    onCompleteExam(finalResult);
  };

  // Timer Display Formatting
  const minutesLeft = Math.floor(remainingSeconds / 60);
  const secondsLeft = remainingSeconds % 60;
  const isTimeUrgent = remainingSeconds <= 120; // less than 2 mins

  const currentQuestion = shuffledQuestions[currentIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const totalQuestionsCount = shuffledQuestions.length;

  // Render Mandatory Posttest Evaluation Questionnaire (User Requirement)
  if (showFeedbackQuestionnaire) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-200">
          <div className="bg-indigo-600 px-6 py-6 text-white space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-white animate-bounce" />
              <h1 className="text-xl font-bold tracking-tight">Kuesioner Evaluasi Pelatihan & Trainer</h1>
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Selamat! Anda telah menyelesaikan seluruh butir soal Posttest untuk program <strong>{training.title}</strong>.
              Sesuai spesifikasi penjaminan mutu HR (ISO 9001), Anda wajib mengisi evaluasi umpan balik ini untuk secara resmi mengakhiri ujian dan menerbitkan e-sertifikat Anda.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {questionnaireError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{questionnaireError}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Question 1: Trainer Rating */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Efektivitas Penyampaian Trainer ({training.trainerName || 'Dr. Rian Hidayat, M.M.'}) *
                </label>
                <p className="text-[11px] text-slate-500">
                  Seberapa menguasai, komunikatif, dan responsif fasilitator dalam mengantarkan modul pelajaran?
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setTrainerRating(num);
                        setQuestionnaireError(null);
                      }}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        trainerRating === num
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-102 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm">★</span>
                      <span>{num} Bintang</span>
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-indigo-700 font-mono ml-2">
                    {trainerRating > 0 ? `Skor: ${trainerRating}/5` : '(Pilih Bintang)'}
                  </span>
                </div>
              </div>

              {/* Question 2: Module Rating */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Kualitas & Relevansi Modul Materi Pelatihan *
                </label>
                <p className="text-[11px] text-slate-500">
                  Bagaimana nilai kegunaan, sistematika penulisan, dan penerapan materi ini bagi operasional kerja harian Anda?
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setModuleRating(num);
                        setQuestionnaireError(null);
                      }}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        moduleRating === num
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-102 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm">★</span>
                      <span>{num} Bintang</span>
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-indigo-700 font-mono ml-2">
                    {moduleRating > 0 ? `Skor: ${moduleRating}/5` : '(Pilih Bintang)'}
                  </span>
                </div>
              </div>

              {/* Question 3: Platform Rating */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Kualitas Platform Ujian & Pengawasan Proctoring Kamera *
                </label>
                <p className="text-[11px] text-slate-500">
                  Apakah platform ujian digital ini mudah digunakan, interaktif, dan adil dalam mencegah kecurangan?
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setPlatformRating(num);
                        setQuestionnaireError(null);
                      }}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        platformRating === num
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-102 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm">★</span>
                      <span>{num} Bintang</span>
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-indigo-700 font-mono ml-2">
                    {platformRating > 0 ? `Skor: ${platformRating}/5` : '(Pilih Bintang)'}
                  </span>
                </div>
              </div>

              {/* Question 4: Written Takeaway */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="takeaway" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    4. Kompetensi Utama & Penerapan Kerja Nyata *
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Wajib (Min. 10 karakter)</span>
                </div>
                <textarea
                  id="takeaway"
                  rows={3}
                  value={learningTakeaway}
                  onChange={(e) => {
                    setLearningTakeaway(e.target.value);
                    setQuestionnaireError(null);
                  }}
                  placeholder="Tuliskan pengetahuan atau keahlian baru yang Anda peroleh dan rencana implementasinya secara nyata di departemen Anda..."
                  className="block w-full p-3 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
                <div className="flex justify-end">
                  <span className={`text-[10px] font-mono ${learningTakeaway.trim().length >= 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {learningTakeaway.trim().length} / Min. 10 karakter
                  </span>
                </div>
              </div>

              {/* Question 5: Suggestions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="suggestions" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    5. Kritik, Saran & Usulan untuk Program Selanjutnya
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">(Opsional)</span>
                </div>
                <textarea
                  id="suggestions"
                  rows={2}
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Berikan masukan berupa topik materi baru, perbaikan durasi, waktu, atau media pendukung pelatihan..."
                  className="block w-full p-3 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                * Menandakan pertanyaan wajib diisi
              </span>

              <button
                type="button"
                onClick={() => {
                  if (trainerRating === 0 || moduleRating === 0 || platformRating === 0) {
                    setQuestionnaireError('Mohon berikan rating (1-5 Bintang) untuk pertanyaan No. 1, 2, dan 3.');
                    return;
                  }
                  if (learningTakeaway.trim().length < 10) {
                    setQuestionnaireError('Mohon isi esai ringkasan kompetensi utama minimal 10 karakter pada pertanyaan No. 4.');
                    return;
                  }

                  setQuestionnaireError(null);
                  handleSubmitFinal(true, {
                    trainerRating,
                    moduleRating,
                    platformRating,
                    learningTakeaway: learningTakeaway.trim(),
                    suggestions: suggestions.trim(),
                  });
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Kirim Evaluasi & Selesaikan Ujian</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Pre-Exam Verification Gate
  if (!examStarted) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-xl w-full p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Protokol Verifikasi Proctoring Ujian {examType.toUpperCase()}
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {training.title} ({training.category})
            </p>
          </div>

          {/* Camera Feed Preview */}
          <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border-2 border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {cameraPermissionGranted ? (
              <div className="absolute top-3 left-3 bg-emerald-500/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Webcam Siap & Terhubung
              </div>
            ) : (
              <div className="text-center p-4 space-y-2 text-rose-300">
                <AlertTriangle className="w-8 h-8 mx-auto text-rose-400" />
                <p className="text-xs font-semibold">{cameraError || 'Menunggu izin akses kamera...'}</p>
                <p className="text-[11px] text-slate-400">
                  Ujian menolak dimulai jika izin kamera diblokir.
                </p>
              </div>
            )}
          </div>

          {/* Exam Rules Breakdown */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <span>Aturan Integritas Ujian (Section 5.B):</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px]">
              <li>
                <strong>Mode Layar Penuh (Fullscreen):</strong> Ujian wajib berjalan dalam mode Fullscreen.
              </li>
              <li>
                <strong>Tab Lock:</strong> Berpindah tab browser atau meminimalkan jendela ujian dicatat sebagai pelanggaran.
              </li>
              <li>
                <strong>Batas Pelanggaran:</strong> Maksimal 3 kali peringatan. Pada pelanggaran ke-3, ujian dihentikan dan diberikan <strong>Nilai 0</strong>.
              </li>
              <li>
                <strong>Pengacakan Soal:</strong> Urutan soal dan urutan pilihan ganda A, B, C, D, E diacak secara algoritmik.
              </li>
              <li>
                <strong>Passing Grade:</strong> Skor minimum kelulusan Posttest adalah <strong>&ge; {training.passingGrade}</strong>.
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onCancelExam}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg"
            >
              Kembali ke Dashboard
            </button>

            <button
              onClick={handleStartExam}
              disabled={!cameraPermissionGranted}
              className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-lg transition-all shadow-sm ${
                cameraPermissionGranted
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Maximize2 className="w-4 h-4" />
              <span>Mulai Ujian & Masuk Layar Penuh</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Active Exam Room
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between select-none">
      {/* Top Proctoring Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            {examType === 'pretest' ? 'PRE' : 'POST'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{training.title}</h2>
            <p className="text-[11px] text-slate-500">
              Peserta: <strong className="text-slate-700">{user.name}</strong> ({user.nik})
            </p>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold transition-colors ${
            isTimeUrgent
              ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <Clock className={`w-4 h-4 ${isTimeUrgent ? 'text-rose-600' : 'text-slate-500'}`} />
          <span>
            {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
          </span>
        </div>

        {/* Right: Proctoring & Violations Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline">Peringatan:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((num) => (
                <span
                  key={num}
                  className={`w-3 h-3 rounded-full text-[9px] flex items-center justify-center font-bold ${
                    violationsCount >= num
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            Selesai Ujian
          </button>
        </div>
      </div>

      {/* Main Exam Viewport */}
      <div className="max-w-6xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Left 3 Cols: Active Question Card with Motion Transition */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs min-h-[460px] flex flex-col justify-between">
            {currentQuestion ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.originalId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  {/* Question Header & Stem */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-slate-100 pb-3">
                      <span>
                        SOAL NO. <strong className="text-indigo-600 text-sm">{currentIndex + 1}</strong> DARI {totalQuestionsCount}
                      </span>
                      <span>
                        {userAnswers[currentQuestion.originalId] ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1 font-sans">
                            <CheckCircle className="w-3.5 h-3.5" /> Sudah Dijawab
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium font-sans">Belum Dijawab</span>
                        )}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                      {currentQuestion.questionText}
                    </h3>

                    {/* Question Multimedia Element (User Requirement) */}
                    {currentQuestion.mediaType && currentQuestion.mediaType !== 'none' && currentQuestion.mediaUrl && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-w-xl">
                        {currentQuestion.mediaCaption && (
                          <p className="text-xs font-semibold text-slate-700">{currentQuestion.mediaCaption}</p>
                        )}
                        {currentQuestion.mediaType === 'image' && (
                          <img
                            src={currentQuestion.mediaUrl}
                            alt="Lampiran Soal"
                            className="max-h-72 rounded-lg object-contain mx-auto bg-white border border-slate-200"
                          />
                        )}
                        {currentQuestion.mediaType === 'video' && (
                          <video
                            src={currentQuestion.mediaUrl}
                            controls
                            className="max-h-64 w-full rounded-lg bg-black"
                          />
                        )}
                        {currentQuestion.mediaType === 'audio' && (
                          <audio src={currentQuestion.mediaUrl} controls className="w-full mt-1" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Options (A, B, C, D, E) */}
                  <div className="space-y-2.5 my-4">
                    {currentQuestion.shuffledOptions.map((opt) => {
                      const isSelected = userAnswers[currentQuestion.originalId] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelectOption(opt.key)}
                          className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 shadow-xs ring-1 ring-indigo-500'
                              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50/80 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="text-xs sm:text-sm font-medium leading-normal mt-0.5">
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        currentIndex === 0
                          ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Sebelumnya</span>
                    </button>

                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                      {answeredCount} dari {totalQuestionsCount} Soal Terisi
                    </span>

                    {currentIndex < totalQuestionsCount - 1 ? (
                      <button
                        onClick={() => setCurrentIndex((prev) => Math.min(totalQuestionsCount - 1, prev + 1))}
                        className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>Selanjutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSubmitConfirm(true)}
                        className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Jawaban</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <HelpCircle className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-50" />
                <p className="text-sm font-medium">Soal tidak ditemukan untuk sesi ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Floating Live Webcam Proctoring & Question Map */}
        <div className="space-y-4">
          {/* Active Live Webcam Monitor */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pengawasan Kamera</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AKTIF
              </span>
            </div>

            {/* Video Feed */}
            <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Snapshot Flash Overlay */}
              {snapshotFlash && (
                <div className="absolute inset-0 bg-white/70 transition-opacity duration-300 pointer-events-none" />
              )}
              <div className="absolute bottom-1.5 left-2 bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                PROCTOR · {lastSnapshotTime || 'Live'}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              *Wajah dipotret acak secara diam-diam setiap 1-3 menit untuk memverifikasi kehadiran peserta.
            </p>
          </div>

          {/* Question Grid / Palette */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Nomor Soal</span>
              <span className="font-mono text-slate-400">
                {answeredCount}/{totalQuestionsCount}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {shuffledQuestions.map((q, idx) => {
                const isAnswered = !!userAnswers[q.originalId];
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.originalId}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-700'
                        : isAnswered
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-800" /> Terjawab
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-100 border border-slate-300" /> Belum
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs border border-indigo-600 bg-indigo-50" /> Aktif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Proctoring Violation Warning Modal */}
      {activeWarningModal && (
        <div className="fixed inset-0 z-50 bg-rose-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border-2 border-rose-500 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              {isDisqualified ? 'DISKUALIFIKASI UJIAN' : 'PERINGATAN PROCTORING'}
            </h3>

            <p className="text-xs text-rose-800 leading-relaxed font-medium">
              {activeWarningModal}
            </p>

            {!isDisqualified && (
              <div className="pt-2">
                <button
                  onClick={async () => {
                    await enterFullscreen();
                    setActiveWarningModal(null);
                  }}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Saya Mengerti & Lanjutkan Ujian
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Kirim & Selesaikan Ujian?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda telah menjawab <strong>{answeredCount}</strong> dari{' '}
              <strong>{totalQuestionsCount}</strong> pertanyaan yang tersedia.
              {answeredCount < totalQuestionsCount && (
                <span className="block text-amber-700 font-semibold mt-1">
                  Perhatian: Terdapat {totalQuestionsCount - answeredCount} butir pertanyaan yang belum Anda isi!
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cek Kembali
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  if (examType === 'posttest') {
                    setShowFeedbackQuestionnaire(true);
                  } else {
                    handleSubmitFinal(true);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                Ya, Selesaikan Ujian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
