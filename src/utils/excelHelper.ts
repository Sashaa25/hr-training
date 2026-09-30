import * as XLSX from 'xlsx';
import { Question, ExamType, TrainingSession, User, ExamResult } from '../types';

export interface ParseResult {
  success: boolean;
  questions: Question[];
  errors: string[];
  warnings: string[];
}

export const TEMPLATE_COLUMNS = [
  'ID_Soal',
  'Tipe_Ujian',
  'Pertanyaan',
  'Opsi_A',
  'Opsi_B',
  'Opsi_C',
  'Opsi_D',
  'Opsi_E',
  'Kunci_Jawaban',
  'Media_Tipe',
  'Media_URL',
];

export const MANDATORY_COLUMNS = [
  'ID_Soal',
  'Tipe_Ujian',
  'Pertanyaan',
  'Opsi_A',
  'Opsi_B',
  'Opsi_C',
  'Opsi_D',
  'Opsi_E',
  'Kunci_Jawaban',
];

/**
 * Generates and triggers download of a standardized Excel template for Question Bank import
 */
export function downloadQuestionTemplate(trainingTitle?: string) {
  const sampleData = [
    {
      ID_Soal: 'SOAL-PRE-01',
      Tipe_Ujian: 'Pre',
      Pertanyaan: 'Manakah definisi yang paling tepat mengenai kepemimpinan transformasional?',
      Opsi_A: 'Fokus pada reward dan punishment',
      Opsi_B: 'Menginspirasi dan memotivasi tim menuju visi bersama',
      Opsi_C: 'Keputusan sepihak tanpa diskusi tim',
      Opsi_D: 'Menghindari tanggung jawab manajerial',
      Opsi_E: 'Prioritas prosedur kaku daripada solusi',
      Kunci_Jawaban: 'B',
    },
    {
      ID_Soal: 'SOAL-PRE-02',
      Tipe_Ujian: 'Pre',
      Pertanyaan: 'Apa kepanjangan dari metode pemberian feedback SBI?',
      Opsi_A: 'System - Behavior - Integration',
      Opsi_B: 'Standard - Business - Indicator',
      Opsi_C: 'Situation - Behavior - Impact',
      Opsi_D: 'Strategy - Benchmark - Implementation',
      Opsi_E: 'Specific - Baseline - Improvement',
      Kunci_Jawaban: 'C',
    },
    {
      ID_Soal: 'SOAL-POST-01',
      Tipe_Ujian: 'Post',
      Pertanyaan: 'Karakteristik utama seorang Servant Leader adalah:',
      Opsi_A: 'Mengutamakan pemberdayaan anggota tim dan menghilangkan hambatan kerja',
      Opsi_B: 'Mengerjakan seluruh tugas sendirian tanpa delegasi',
      Opsi_C: 'Membatasi akses komunikasi bawahan ke pimpinan puncak',
      Opsi_D: 'Memberikan target tanpa menyediakan sumber daya memadai',
      Opsi_E: 'Mengabaikan evaluasi kompetensi anggota tim',
      Kunci_Jawaban: 'A',
    },
    {
      ID_Soal: 'SOAL-POST-02',
      Tipe_Ujian: 'Post',
      Pertanyaan: 'Dalam penetapan OKR, Key Results harus memenuhi kriteria utama yaitu:',
      Opsi_A: 'Hanya berupa opini kualitatif subjektif',
      Opsi_B: 'Terukur secara kuantitatif dan memiliki target yang jelas',
      Opsi_C: 'Tidak dapat diuji dengan data nyata',
      Opsi_D: 'Disembunyikan dari seluruh anggota tim pelaksana',
      Opsi_E: 'Hanya ditentukan setahun sekali tanpa review',
      Kunci_Jawaban: 'B',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: TEMPLATE_COLUMNS });

  // Column width styling
  worksheet['!cols'] = [
    { wch: 14 }, // ID_Soal
    { wch: 12 }, // Tipe_Ujian
    { wch: 45 }, // Pertanyaan
    { wch: 25 }, // Opsi_A
    { wch: 25 }, // Opsi_B
    { wch: 25 }, // Opsi_C
    { wch: 25 }, // Opsi_D
    { wch: 25 }, // Opsi_E
    { wch: 14 }, // Kunci_Jawaban
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bank_Soal_HR');

  const filename = `Template_Bank_Soal_HR_${(trainingTitle || 'Pelatihan').replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Parses and validates an uploaded Excel file for question bank
 */
export async function parseAndValidateExcel(file: File, trainingId: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (workbook.SheetNames.length === 0) {
          resolve({
            success: false,
            questions: [],
            errors: ['File Excel tidak memiliki lembar kerja (worksheet).'],
            warnings: [],
          });
          return;
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            success: false,
            questions: [],
            errors: ['Lembar kerja kosong. Silakan isi data soal sesuai template yang ditentukan.'],
            warnings: [],
          });
          return;
        }

        // Validate Header presence for mandatory columns
        const firstRow = rawJson[0];
        const missingHeaders = MANDATORY_COLUMNS.filter(col => !(col in firstRow));
        if (missingHeaders.length > 0) {
          resolve({
            success: false,
            questions: [],
            errors: [
              `Format kolom tidak sesuai standar! Kolom wajib yang hilang: [${missingHeaders.join(', ')}]. Harap gunakan format template resmi yang disediakan.`,
            ],
            warnings: [],
          });
          return;
        }

        const errors: string[] = [];
        const warnings: string[] = [];
        const validQuestions: Question[] = [];

        rawJson.forEach((row, index) => {
          const rowNum = index + 2; // Excel row number (1-based + 1 for header)

          const idSoal = String(row['ID_Soal'] || '').trim();
          const tipeUjianRaw = String(row['Tipe_Ujian'] || '').trim().toLowerCase();
          const pertanyaan = String(row['Pertanyaan'] || '').trim();
          const opsiA = String(row['Opsi_A'] || '').trim();
          const opsiB = String(row['Opsi_B'] || '').trim();
          const opsiC = String(row['Opsi_C'] || '').trim();
          const opsiD = String(row['Opsi_D'] || '').trim();
          const opsiE = String(row['Opsi_E'] || '').trim();
          const kunci = String(row['Kunci_Jawaban'] || '').trim().toUpperCase();
          const mediaTipeRaw = String(row['Media_Tipe'] || '').trim().toLowerCase();
          const mediaUrlRaw = String(row['Media_URL'] || '').trim();

          // Check for entirely blank row
          if (!idSoal && !pertanyaan && !opsiA) {
            warnings.push(`Baris ${rowNum}: Baris kosong diabaikan.`);
            return;
          }

          // Check required fields
          if (!idSoal) {
            errors.push(`Baris ${rowNum}: 'ID_Soal' tidak boleh kosong.`);
          }
          if (!pertanyaan) {
            errors.push(`Baris ${rowNum} (${idSoal || 'Tanpa ID'}): 'Pertanyaan' tidak boleh kosong.`);
          }

          // Check exam type
          let examType: ExamType = 'pretest';
          if (tipeUjianRaw.includes('post')) {
            examType = 'posttest';
          } else if (tipeUjianRaw.includes('pre')) {
            examType = 'pretest';
          } else {
            errors.push(
              `Baris ${rowNum} (${idSoal}): 'Tipe_Ujian' bernilai '${row['Tipe_Ujian']}'. Harus diisi 'Pre' atau 'Post'.`
            );
          }

          // Check options
          if (!opsiA || !opsiB || !opsiC || !opsiD || !opsiE) {
            errors.push(
              `Baris ${rowNum} (${idSoal}): Semua pilihan ganda Opsi_A hingga Opsi_E wajib diisi.`
            );
          }

          // Check answer key
          if (!['A', 'B', 'C', 'D', 'E'].includes(kunci)) {
            errors.push(
              `Baris ${rowNum} (${idSoal}): Kunci_Jawaban '${kunci}' tidak valid. Harus salah satu dari A, B, C, D, atau E.`
            );
          }

          let mediaType: 'none' | 'image' | 'video' | 'audio' = 'none';
          if (mediaTipeRaw.includes('img') || mediaTipeRaw.includes('gambar') || mediaTipeRaw.includes('image')) {
            mediaType = 'image';
          } else if (mediaTipeRaw.includes('vid') || mediaTipeRaw.includes('video')) {
            mediaType = 'video';
          } else if (mediaTipeRaw.includes('aud') || mediaTipeRaw.includes('suara') || mediaTipeRaw.includes('audio')) {
            mediaType = 'audio';
          }

          if (errors.length === 0) {
            validQuestions.push({
              id: idSoal || `q-${trainingId}-${examType}-${Date.now()}-${index}`,
              trainingId,
              examType,
              questionText: pertanyaan,
              optionA: opsiA,
              optionB: opsiB,
              optionC: opsiC,
              optionD: opsiD,
              optionE: opsiE,
              correctAnswer: kunci as 'A' | 'B' | 'C' | 'D' | 'E',
              mediaType,
              mediaUrl: mediaUrlRaw || undefined,
            });
          }
        });

        if (errors.length > 0) {
          resolve({
            success: false,
            questions: [],
            errors,
            warnings,
          });
        } else {
          resolve({
            success: true,
            questions: validQuestions,
            errors: [],
            warnings,
          });
        }
      } catch (err: any) {
        resolve({
          success: false,
          questions: [],
          errors: [`Gagal memproses file Excel: ${err?.message || 'Format file rusak atau tidak didukung.'}`],
          warnings: [],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        questions: [],
        errors: ['Gagal membaca berkas dari sistem komputer.'],
        warnings: [],
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export comprehensive training evaluation results to Excel (.xlsx) format
 * Matching Section 6.1 of the PDF Blueprint
 */
export function exportExamResultsToExcel(
  training: TrainingSession,
  users: User[],
  results: ExamResult[]
) {
  const employees = users.filter(u => u.role === 'karyawan');

  const rows = employees.map((emp, idx) => {
    const preRes = results.find(r => r.userId === emp.id && r.trainingId === training.id && r.examType === 'pretest');
    const postRes = results.find(r => r.userId === emp.id && r.trainingId === training.id && r.examType === 'posttest');

    const preScore = preRes ? preRes.score : null;
    const postScore = postRes ? postRes.score : null;

    let deltaStr = '-';
    if (preScore !== null && postScore !== null) {
      const diff = postScore - preScore;
      const pct = preScore === 0 ? postScore : Math.round((diff / (preScore || 1)) * 100);
      deltaStr = `${diff >= 0 ? '+' : ''}${diff} poin (${diff >= 0 ? '+' : ''}${pct}%)`;
    }

    const preDuration = preRes
      ? `${Math.floor(preRes.durationSeconds / 60)}m ${preRes.durationSeconds % 60}s`
      : 'Belum Ujian';

    const postDuration = postRes
      ? `${Math.floor(postRes.durationSeconds / 60)}m ${postRes.durationSeconds % 60}s`
      : 'Belum Ujian';

    const status = postRes
      ? postRes.score >= training.passingGrade
        ? 'LULUS'
        : 'TIDAK LULUS'
      : preRes
      ? 'MENUNGGU POSTTEST'
      : 'BELUM MENGIKUTI';

    return {
      'No': idx + 1,
      'NIK': emp.nik,
      'Nama Karyawan': emp.name,
      'Departemen': emp.department,
      'Jabatan': emp.position,
      'Skor Pretest': preScore !== null ? preScore : '-',
      'Durasi Pretest': preDuration,
      'Skor Posttest': postScore !== null ? postScore : '-',
      'Durasi Posttest': postDuration,
      'Kenaikan (Delta)': deltaStr,
      'Passing Grade Minimum': training.passingGrade,
      'Status Kelulusan': status,
      'Pelanggaran Proctoring': (preRes?.violationsCount || 0) + (postRes?.violationsCount || 0),
      'ID Sertifikat': postRes?.certificateId || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Column width
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // NIK
    { wch: 22 }, // Nama
    { wch: 25 }, // Dept
    { wch: 22 }, // Jabatan
    { wch: 14 }, // Skor Pre
    { wch: 16 }, // Durasi Pre
    { wch: 14 }, // Skor Post
    { wch: 16 }, // Durasi Post
    { wch: 20 }, // Delta
    { wch: 18 }, // Passing Grade
    { wch: 20 }, // Status
    { wch: 20 }, // Pelanggaran
    { wch: 26 }, // ID Sertifikat
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Evaluasi_HR');

  const filename = `Laporan_Evaluasi_HR_${training.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
