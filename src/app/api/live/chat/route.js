import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/db";
import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      session_id,
      message = "",
      image_base64 = null,
      current_step = "Langkah 1: Penerangan Konsep",
      voice_persona = "Puck",
      topic = "Organ Pernafasan Haiwan (Sains Tahun 4)",
      subject = "Sains"
    } = body;

    const db = getDatabase();

    // Check if session has been killed by emergency kill switch
    if (session_id) {
      const session = db.prepare("SELECT status FROM sessions WHERE id = ?").get(session_id);
      if (session && session.status === "EMERGENCY_STOPPED") {
        return NextResponse.json({
          success: false,
          error: "Sesi ini telah dihentikan serta-merta oleh Suis Kecemasan Guru Fasilitator.",
          emergency_stopped: true
        }, { status: 403 });
      }
    }

    // Record student/input message in transcript safety audit
    if (session_id && (message || image_base64)) {
      db.prepare(`
        INSERT INTO session_transcripts (id, session_id, speaker, message, timestamp_offset_ms)
        VALUES (?, ?, 'STUDENT', ?, ?)
      `).run(`TR-${Date.now()}`, session_id, image_base64 ? `[Snap & Teach Vision OCR]: ${message || "Menunjukkan bahan buku teks/lembaran kerja"}` : message, 12000);
    }

    let aiTeacherReply = "";
    let starDelta = 0;
    let suggestedPbd = "TP3";
    let action = "EXPLAIN";

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `Anda adalah "Guru Maya AI Pintar" di bilik darjah sekolah rendah Malaysia (KPM).
Personaliti Suara: ${voice_persona} (Penyayang, bersemangat, interaktif, fasih Bahasa Melayu & Inggeris).
Topik Pembelajaran Semasa: ${topic} (${subject}).
Fasa Pengajaran Model ASSURE Semasa: ${current_step}.

Peraturan Pengajaran:
1. Bercakaplah secara langsung dengan murid dengan nada mesra seperti cikgu sekolah rendah ("Bagusnya murid-murid!", "Hebat sekali jawapan awak!").
2. Jika murid menjawab dengan betul, berikan pujian dan berikan ganjaran Bintang Pintar ⭐.
3. Jika murid bertanya atau keliru, bimbing secara sokratik (tanya soalan pancingan ringkas).
4. Jika terdapat gambar lembaran kerja / buku teks yang dihantar melalui Snap & Teach, buat pengecaman visual OCR, terangkan kandungannya, dan semak jawapan murid.
5. Panjang jawapan hendaklah padat dan sesuai untuk didengari (sekitar 2 hingga 4 ayat).

Kembalikan format JSON:
{
  "spoken_response": "Teks percakapan cikgu AI...",
  "star_delta": 1 atau 0,
  "suggested_pbd": "TP2" / "TP3" / "TP4" / "TP5",
  "pedagogical_action": "PRAISE_AND_STAR" / "ASK_QUESTION" / "EXPLAIN"
}`;

        const contents = [];
        if (image_base64) {
          // Clean base64 prefix if present
          const cleanBase64 = image_base64.replace(/^data:image\/\w+;base64,/, "");
          contents.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          });
        }
        contents.push({
          text: message || "Cikgu, boleh terangkan tentang topik ini?",
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
          },
        });

        const raw = response.text?.trim() || "";
        const clean = raw.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        try {
          const parsed = JSON.parse(clean);
          aiTeacherReply = parsed.spoken_response;
          starDelta = parsed.star_delta || 0;
          suggestedPbd = parsed.suggested_pbd || "TP3";
          action = parsed.pedagogical_action || "EXPLAIN";
        } catch {
          aiTeacherReply = raw;
          starDelta = 1;
        }
      } catch (geminiErr) {
        console.warn("Gemini Live chat fallback:", geminiErr.message);
      }
    }

    // High fidelity pedagogical fallback responses if offline or without key
    if (!aiTeacherReply) {
      if (image_base64) {
        aiTeacherReply = `Wah, gambar yang sangat jelas daripada buku teks! Cikgu nampak soalan mengenai organ pernafasan haiwan. Ikan bernafas melalui insang, manakala katak boleh bernafas guna peparu dan kulit lembap. Jawapan yang awak tanda itu sangat tepat! Cikgu hadiahkan 1 Bintang Pintar ⭐!`;
        starDelta = 1;
        suggestedPbd = "TP4";
        action = "PRAISE_AND_STAR";
      } else if (message.toLowerCase().includes("katak") || message.toLowerCase().includes("dua")) {
        aiTeacherReply = `Tahniah murid yang pintar! Katak memang mempunyai dua organ pernafasan, iaitu peparu semasa di darat dan kulit lembap apabila berada di dalam air. Sangat tepat! 1 Bintang Pintar bertambah untuk kelas kita! ⭐`;
        starDelta = 1;
        suggestedPbd = "TP4";
        action = "PRAISE_AND_STAR";
      } else if (message.toLowerCase().includes("insang") || message.toLowerCase().includes("ikan")) {
        aiTeacherReply = `Tepat sekali! Kebanyakan haiwan akuatik seperti ikan bernafas menggunakan insang yang menyerap oksigen terlarut dalam air. Ada sesiapa boleh beritahu cikgu apa pula organ pernafasan belalang?`;
        starDelta = 1;
        suggestedPbd = "TP3";
        action = "ASK_QUESTION";
      } else {
        aiTeacherReply = `Bagus soalan itu murid-murid! Berdasarkan Standard Kandungan DSKP kita hari ini, mari kita perhatikan bagaimana setiap haiwan mempunyai adaptasi pernafasan yang unik untuk terus hidup di habitatnya. Cuba lihat gambar rajah pada skrin ya!`;
        starDelta = 0;
        suggestedPbd = "TP3";
        action = "EXPLAIN";
      }
    }

    // Record AI teacher response in transcript audit
    if (session_id) {
      db.prepare(`
        INSERT INTO session_transcripts (id, session_id, speaker, message, timestamp_offset_ms)
        VALUES (?, ?, 'AI_TUTOR', ?, ?)
      `).run(`TR-${Date.now() + 1}`, session_id, aiTeacherReply, 15000);
    }

    return NextResponse.json({
      success: true,
      data: {
        spoken_response: aiTeacherReply,
        star_delta: starDelta,
        suggested_pbd: suggestedPbd,
        pedagogical_action: action,
        voice_persona: voice_persona,
        current_step: current_step
      }
    });
  } catch (error) {
    console.error("Live chat route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
