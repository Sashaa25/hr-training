import React, { useState, useRef } from 'react';
import { TrainingSession, Question, ExamType, MediaType } from '../../types';
import { downloadQuestionTemplate, parseAndValidateExcel } from '../../utils/excelHelper';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  HelpCircle,
  FileText,
  Filter,
  Image as ImageIcon,
  Video,
  Volume2,
  Paperclip,
} from 'lucide-react';

interface QuestionBankModalProps {
  training: TrainingSession;
  questions: Question[];
  onClose: () => void;
  onSaveQuestions: (newQuestions: Question[]) => void;
  onDeleteQuestion: (id: string) => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  training,
  questions,
  onClose,
  onSaveQuestions,
  onDeleteQuestion,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pretest' | 'posttest'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationSuccessMsg, setValidationSuccessMsg] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Manual Add Form State
  const [newExamType, setNewExamType] = useState<ExamType>('pretest');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptA, setNewOptA] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newOptC, setNewOptC] = useState('');
  const [newOptD, setNewOptD] = useState('');
  const [newOptE, setNewOptE] = useState('');
  const [newKey, setNewKey] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');

  // Media state
  const [newMediaType, setNewMediaType] = useState<MediaType>('none');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaCaption, setNewMediaCaption] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  const trainingQuestions = questions.filter((q) => q.trainingId === training.id);
  const filteredQuestions = trainingQuestions.filter((q) => {
    if (activeFilter === 'all') return true;
    return q.examType === activeFilter;
  });

  const pretestCount = trainingQuestions.filter((q) => q.examType === 'pretest').length;
  const posttestCount = trainingQuestions.filter((q) => q.examType === 'posttest').length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setValidationErrors([]);
    setValidationSuccessMsg(null);
    setWarnings([]);

    const result = await parseAndValidateExcel(file, training.id);
    setIsUploading(false);

    if (result.success) {
      onSaveQuestions(result.questions);
      setValidationSuccessMsg(
        `Sukses! Sebanyak ${result.questions.length} butir soal berhasil divalidasi dan diimpor ke bank soal.`
      );
      if (result.warnings.length > 0) {
        setWarnings(result.warnings);
      }
    } else {
      setValidationErrors(result.errors);
      if (result.warnings.length > 0) {
        setWarnings(result.warnings);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect media type from MIME
    if (file.type.startsWith('image/')) {
      setNewMediaType('image');
    } else if (file.type.startsWith('video/')) {
      setNewMediaType('video');
    } else if (file.type.startsWith('audio/')) {
      setNewMediaType('audio');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewMediaUrl(String(event.target.result));
        if (!newMediaCaption) {
          setNewMediaCaption(file.name);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !newOptA || !newOptB || !newOptC || !newOptD || !newOptE) {
      alert('Harap lengkapi pertanyaan dan semua opsi jawaban (A s/d E).');
      return;
    }

    const newQuestion: Question = {
      id: `q-manual-${Date.now()}`,
      trainingId: training.id,
      examType: newExamType,
      questionText: newQuestionText.trim(),
      optionA: newOptA.trim(),
      optionB: newOptB.trim(),
      optionC: newOptC.trim(),
      optionD: newOptD.trim(),
      optionE: newOptE.trim(),
      correctAnswer: newKey,
      mediaType: newMediaType !== 'none' ? newMediaType : undefined,
      mediaUrl: newMediaUrl.trim() || undefined,
      mediaCaption: newMediaCaption.trim() || undefined,
    };

    onSaveQuestions([newQuestion]);
    setValidationSuccessMsg('1 butir soal berhasil ditambahkan ke bank soal.');

    // Reset Form
    setNewQuestionText('');
    setNewOptA('');
    setNewOptB('');
    setNewOptC('');
    setNewOptD('');
    setNewOptE('');
    setNewMediaType('none');
    setNewMediaUrl('');
    setNewMediaCaption('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Manajemen Bank Soal Multimedia (Excel)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Modul Pelatihan: <span className="font-semibold text-slate-700">{training.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar & Excel Tools */}
        <div className="p-6 border-b border-slate-100 bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Download Template & Upload Button */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => downloadQuestionTemplate(training.title)}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Format Template Excel
              </button>

              <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs">
                <Upload className="w-4 h-4" />
                {isUploading ? 'Memvalidasi...' : 'Import Soal (.xlsx)'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {showAddForm ? 'Tutup Form Input' : 'Tambah Soal Manual & Media'}
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
              <span>Pretest: <strong className="text-slate-800">{pretestCount}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Posttest: <strong className="text-slate-800">{posttestCount}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Total: <strong className="text-slate-800">{trainingQuestions.length}</strong></span>
            </div>
          </div>

          {/* Validation Feedback Messages */}
          {validationSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{validationSuccessMsg}</p>
              </div>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Validasi Excel Ditolak ({validationErrors.length} kesalahan ditemukan):</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 max-h-32 overflow-y-auto">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
              <p className="text-[11px] text-rose-700 italic pt-1">
                Harap perbaiki berkas Excel Anda sesuai kolom template resmi: ID_Soal, Tipe_Ujian (Pre/Post), Pertanyaan, Opsi_A..E, Kunci_Jawaban.
              </p>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <p className="font-medium">Catatan Impor:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Manual Add Form with Multimedia Upload */}
          {showAddForm && (
            <form onSubmit={handleManualAdd} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Form Tambah Soal Manual (Mendukung Video, Gambar & Audio)
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Modul:</span>
                  <select
                    value={newExamType}
                    onChange={(e) => setNewExamType(e.target.value as ExamType)}
                    className="text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1"
                  >
                    <option value="pretest">Pretest</option>
                    <option value="posttest">Posttest</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Teks Pertanyaan:</label>
                <textarea
                  rows={2}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Ketik butir pertanyaan di sini..."
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Multimedia Attachment Box (User Requirement) */}
              <div className="bg-white p-3 border border-indigo-100 rounded-lg space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Lampiran Multimedia Soal (Video, Gambar, atau Audio):</span>
                  </div>

                  {/* Media Type Selector */}
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => { setNewMediaType('none'); setNewMediaUrl(''); }}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        newMediaType === 'none' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Tidak Ada
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMediaType('image')}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        newMediaType === 'image' ? 'bg-indigo-100 text-indigo-800 font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" />
                      Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMediaType('video')}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        newMediaType === 'video' ? 'bg-indigo-100 text-indigo-800 font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Video className="w-3 h-3" />
                      Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMediaType('audio')}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        newMediaType === 'audio' ? 'bg-indigo-100 text-indigo-800 font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Volume2 className="w-3 h-3" />
                      Audio
                    </button>
                  </div>
                </div>

                {newMediaType !== 'none' && (
                  <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Unggah File {newMediaType.toUpperCase()}</span>
                        <input
                          ref={mediaFileInputRef}
                          type="file"
                          accept={newMediaType === 'image' ? 'image/*' : newMediaType === 'video' ? 'video/*' : 'audio/*'}
                          onChange={handleMediaUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">atau tempel link URL:</span>
                    </div>

                    <input
                      type="text"
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      placeholder={`https://example.com/media.${newMediaType === 'image' ? 'png' : newMediaType === 'video' ? 'mp4' : 'mp3'}`}
                      className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                    />

                    <div>
                      <input
                        type="text"
                        value={newMediaCaption}
                        onChange={(e) => setNewMediaCaption(e.target.value)}
                        placeholder="Keterangan / Judul Lampiran Media (opsional)"
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                      />
                    </div>

                    {/* Media Preview Box */}
                    {newMediaUrl && (
                      <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-md">
                        <p className="text-[10px] font-mono text-slate-400 mb-1">Preview Lampiran Media:</p>
                        {newMediaType === 'image' && (
                          <img src={newMediaUrl} alt="Preview" className="max-h-40 rounded object-contain mx-auto" />
                        )}
                        {newMediaType === 'video' && (
                          <video src={newMediaUrl} controls className="max-h-48 w-full rounded bg-black" />
                        )}
                        {newMediaType === 'audio' && (
                          <audio src={newMediaUrl} controls className="w-full mt-1" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block font-medium text-slate-600 mb-0.5">Opsi A:</label>
                  <input
                    type="text"
                    value={newOptA}
                    onChange={(e) => setNewOptA(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-0.5">Opsi B:</label>
                  <input
                    type="text"
                    value={newOptB}
                    onChange={(e) => setNewOptB(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-0.5">Opsi C:</label>
                  <input
                    type="text"
                    value={newOptC}
                    onChange={(e) => setNewOptC(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-0.5">Opsi D:</label>
                  <input
                    type="text"
                    value={newOptD}
                    onChange={(e) => setNewOptD(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-600 mb-0.5">Opsi E:</label>
                  <input
                    type="text"
                    value={newOptE}
                    onChange={(e) => setNewOptE(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">Kunci Jawaban Benar:</label>
                  <select
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value as any)}
                    className="text-xs font-bold bg-white border border-slate-300 rounded px-2.5 py-1 text-indigo-700"
                  >
                    <option value="A">Opsi A</option>
                    <option value="B">Opsi B</option>
                    <option value="C">Opsi C</option>
                    <option value="D">Opsi D</option>
                    <option value="E">Opsi E</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  Simpan Soal ke Bank Soal
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 font-medium rounded-md transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Soal ({trainingQuestions.length})
            </button>
            <button
              onClick={() => setActiveFilter('pretest')}
              className={`px-3 py-1 font-medium rounded-md transition-all cursor-pointer ${
                activeFilter === 'pretest'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pretest ({pretestCount})
            </button>
            <button
              onClick={() => setActiveFilter('posttest')}
              className={`px-3 py-1 font-medium rounded-md transition-all cursor-pointer ${
                activeFilter === 'posttest'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Posttest ({posttestCount})
            </button>
          </div>
          <span className="text-xs text-slate-500">
            Menampilkan {filteredQuestions.length} butir
          </span>
        </div>

        {/* Question List View with Media Display */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-600">Belum ada butir soal pada kategori ini.</p>
              <p className="text-xs text-slate-400 mt-1">
                Silakan klik tombol "Download Format Template Excel" lalu unggah file pertanyaan Anda atau tambahkan manual.
              </p>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        q.examType === 'pretest'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {q.examType.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-slate-400">#{q.id}</span>
                    {q.mediaType && q.mediaType !== 'none' && (
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                        {q.mediaType === 'image' && <ImageIcon className="w-3 h-3" />}
                        {q.mediaType === 'video' && <Video className="w-3 h-3" />}
                        {q.mediaType === 'audio' && <Volume2 className="w-3 h-3" />}
                        {q.mediaType.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteQuestion(q.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm font-medium text-slate-900">
                  <span className="font-bold text-slate-500 mr-1.5">{idx + 1}.</span>
                  {q.questionText}
                </p>

                {/* Render Media Preview if available */}
                {q.mediaType && q.mediaType !== 'none' && q.mediaUrl && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-lg space-y-1.5">
                    {q.mediaCaption && (
                      <p className="text-[11px] font-semibold text-slate-700">{q.mediaCaption}</p>
                    )}
                    {q.mediaType === 'image' && (
                      <img
                        src={q.mediaUrl}
                        alt="Question Media"
                        className="max-h-48 rounded object-contain border border-slate-200 bg-white"
                      />
                    )}
                    {q.mediaType === 'video' && (
                      <video
                        src={q.mediaUrl}
                        controls
                        className="max-h-48 w-full rounded bg-black"
                      />
                    )}
                    {q.mediaType === 'audio' && (
                      <audio src={q.mediaUrl} controls className="w-full" />
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 pl-4 border-l-2 border-slate-200">
                  <div className={`p-1.5 rounded ${q.correctAnswer === 'A' ? 'bg-emerald-50 text-emerald-900 font-semibold' : ''}`}>
                    <strong>A.</strong> {q.optionA} {q.correctAnswer === 'A' && '✓ (Kunci)'}
                  </div>
                  <div className={`p-1.5 rounded ${q.correctAnswer === 'B' ? 'bg-emerald-50 text-emerald-900 font-semibold' : ''}`}>
                    <strong>B.</strong> {q.optionB} {q.correctAnswer === 'B' && '✓ (Kunci)'}
                  </div>
                  <div className={`p-1.5 rounded ${q.correctAnswer === 'C' ? 'bg-emerald-50 text-emerald-900 font-semibold' : ''}`}>
                    <strong>C.</strong> {q.optionC} {q.correctAnswer === 'C' && '✓ (Kunci)'}
                  </div>
                  <div className={`p-1.5 rounded ${q.correctAnswer === 'D' ? 'bg-emerald-50 text-emerald-900 font-semibold' : ''}`}>
                    <strong>D.</strong> {q.optionD} {q.correctAnswer === 'D' && '✓ (Kunci)'}
                  </div>
                  <div className={`sm:col-span-2 p-1.5 rounded ${q.correctAnswer === 'E' ? 'bg-emerald-50 text-emerald-900 font-semibold' : ''}`}>
                    <strong>E.</strong> {q.optionE} {q.correctAnswer === 'E' && '✓ (Kunci)'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            *Semua butir soal dan lampiran multimedia akan ditampilkan responsif saat peserta mengikuti ujian.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
