# AI Tutor Pro (Guru Maya Pintar Berasaskan Gemini 3.8 & Model ASSURE)

Platform Guru Maya AI Siaran Langsung (Google Meet UI) berteraskan Model ASSURE, Kurikulum Standard Sekolah Rendah (KSSR Semakan KPM), dan Pentaksiran Bilik Darjah (PBD) dengan Pemantauan e-KYC Guru Sebenar.

---

## 🚀 Ciri-Ciri Utama

1. **Google Meet UI AI Live Teacher:**
   * Dikuasakan oleh Google Gemini 3.8 Live API dengan Avatar visualizer bergelombang audio dan Closed Caption masa nyata.
   * Mod B: Kelas Pintar (Projektor Dewan/Smartboard untuk 30–40 murid) & Mod A: Tuisyen 1-ke-1.
   * Pilihan Suara: Puck, Aoede, Charon, Fenrir, Kore.
2. **📸 Snap & Teach (OCR Pintar):**
   * Pengecaman visual buku teks atau lembaran kerja fizikal murid untuk diajar terus oleh AI.
3. **⭐ Ganjaran Bintang Pintar & Suis Kecemasan (<50ms):**
   * Gamifikasi motivasi murid serta suis henti serta-merta bagi guru mengambil alih kelas.
4. **📋 Perancang 6-Langkah Model ASSURE:**
   * Dijana secara automatik berpadukan DSKP KPM, sedia dimuat turun dalam format Microsoft Word (`.docx`) dan PDF rasmi.
5. **🛡️ Pengesahan e-KYC Guru & Pematuhan PDPA 2010:**
   * Sifar penyimpanan gambar MyKad, topeng IC (`910314-XX-5142`), dan Surat Ikrar Guru "Tech for Good".
6. **📊 Dashboard Pentadbir & Pengebilan Penggunaan:**
   * Pengurusan akaun guru, audit transkrip keselamatan, dan kadar pengebilan masa RM0.80/minit (margin keuntungan 90-95%).

---

## 🛠️ Persediaan Tempatan (Local Setup)

1. Pasang kebergantungan:
   ```bash
   npm install
   ```

2. Jalankan pelayan pembangunan:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di pelayar anda.

---

## 🌐 Panduan Penempatan (Deployment Guide)

### 1. Supabase (Pangkalan Data PostgreSQL)
1. Cipta projek baharu di [Supabase](https://supabase.com).
2. Pergi ke **SQL Editor**, buka fail [`supabase/schema.sql`](./supabase/schema.sql), dan klik **Run**.
3. Salin maklumat sambungan dari **Project Settings → API**:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`

### 2. Vercel (Penempatan Web & Edge Functions)
1. Muat naik kod ke GitHub.
2. Pergi ke [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New Project**.
3. Pilih repositori `ai-tutor-pro`.
4. Masukkan **Environment Variables**:
   * `GEMINI_API_KEY`: Kunci API Google Gemini anda.
   * `NEXT_PUBLIC_SUPABASE_URL`: URL projek Supabase anda.
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kunci awam Supabase.
   * `SUPABASE_SERVICE_ROLE_KEY`: Kunci perkhidmatan Supabase.
5. Klik **Deploy**.
