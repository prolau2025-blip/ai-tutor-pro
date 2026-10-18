import { NextResponse } from "next/server";
import { getDatabase, safeJsonParse } from "@/lib/db/db";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("id");
    const format = searchParams.get("format") || "docx"; // 'docx' or 'pdf'

    const db = getDatabase();
    let plan = null;

    if (planId) {
      plan = db.prepare(`
        SELECT lp.*, ds.topic as dskp_topic, ds.content_standard, ds.code_standard, ds.learning_standards_json, ds.pbd_rubrics_json
        FROM lesson_plans lp
        LEFT JOIN dskp_standards ds ON lp.dskp_id = ds.id
        WHERE lp.id = ?
      `).get(planId);
    }

    if (!plan) {
      plan = db.prepare(`
        SELECT lp.*, ds.topic as dskp_topic, ds.content_standard, ds.code_standard, ds.learning_standards_json, ds.pbd_rubrics_json
        FROM lesson_plans lp
        LEFT JOIN dskp_standards ds ON lp.dskp_id = ds.id
        ORDER BY lp.created_at DESC LIMIT 1
      `).get();
    }

    const title = plan?.title || "RPH Model ASSURE Sains Tahun 4";
    const subject = plan?.subject || "Sains";
    const grade = plan?.grade_level || "Tahun 4";
    const topic = plan?.dskp_topic || "Organ Pernafasan Haiwan";
    const duration = plan?.target_duration_minutes || 30;

    const analyze = safeJsonParse(plan?.analyze_learners_json, { general_characteristics: "Murid Tahun 4 berumur 10 tahun" });
    const objectives = safeJsonParse(plan?.state_objectives_json, { abcd_objectives: ["Mengenal pasti organ pernafasan haiwan"] });
    const media = safeJsonParse(plan?.select_media_json, { digital_media: ["Google Meet AI Live Teacher"] });
    const materials = safeJsonParse(plan?.utilize_materials_json, { set_induksi: "Teka teki haiwan" });
    const participation = safeJsonParse(plan?.require_participation_json, { student_activity: "Bersoal jawab" });
    const evaluate = safeJsonParse(plan?.evaluate_revise_json, { assessment_method: "Pentaksiran Bilik Darjah PBD" });

    if (format === "pdf") {
      // Generate Official KPM e-RPH PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size in points
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      let y = 800;

      // Header Banner
      page.drawRectangle({
        x: 35,
        y: y - 45,
        width: 525,
        height: 55,
        color: rgb(0.05, 0.1, 0.2),
      });

      page.drawText("KEMENTERIAN PENDIDIKAN MALAYSIA", {
        x: 45,
        y: y - 18,
        size: 11,
        font: fontBold,
        color: rgb(0.22, 0.74, 0.97),
      });

      page.drawText("RANCANGAN PENGAJARAN HARIAN (e-RPH) - MODEL ASSURE", {
        x: 45,
        y: y - 35,
        size: 13,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      y -= 70;

      // Metadata Box
      page.drawText(`Mata Pelajaran: ${subject} (${grade})`, { x: 45, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(`Masa: ${duration} Minit`, { x: 380, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      y -= 18;
      page.drawText(`Tajuk / Tema: ${topic}`, { x: 45, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(`Kaedah: AI Tutor Pro (Gemini 3.8 Live)`, { x: 340, y, size: 9, font: fontRegular, color: rgb(0.3, 0.5, 0.1) });
      y -= 25;

      const drawSection = (stepNum, stepName, contentLines) => {
        page.drawRectangle({
          x: 45,
          y: y - 16,
          width: 505,
          height: 20,
          color: rgb(0.92, 0.95, 0.99),
        });
        page.drawText(`${stepNum}. ${stepName}`, { x: 50, y: y - 12, size: 10, font: fontBold, color: rgb(0.08, 0.35, 0.65) });
        y -= 26;

        for (const line of contentLines) {
          page.drawText(`• ${line.substring(0, 85)}`, { x: 55, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
          y -= 14;
        }
        y -= 8;
      };

      drawSection("A", "ANALYZE LEARNERS (Analisis Murid)", [
        analyze.general_characteristics || "Murid Tahun 4 dengan pelbagai kecerdasan visual dan auditori.",
        analyze.entry_competencies || "Mengetahui haiwan hidup di darat dan di air.",
        analyze.learning_styles || "Gaya belajar: Visual, Auditori, dan Kinestetik aktif."
      ]);

      drawSection("S", "STATE OBJECTIVES (Nyatakan Objektif Pembelajaran)", [
        ...(Array.isArray(objectives.abcd_objectives) ? objectives.abcd_objectives : [objectives.abcd_objectives || "Mencapai standard"]),
        `Sasaran Pentaksiran Bilik Darjah: ${objectives.pbd_target || "Tahap Penguasaan 3 (TP3) ke atas"}`
      ]);

      drawSection("S", "SELECT MEDIA & MATERIALS (Pilih Media dan Bahan)", [
        `Media Digital: ${Array.isArray(media.digital_media) ? media.digital_media.join(", ") : "Google Meet AI Live Teacher"}`,
        `Bahan Fizikal: ${Array.isArray(media.physical_materials) ? media.physical_materials.join(", ") : "Buku Teks KPM & Lembaran Kerja"}`
      ]);

      drawSection("U", "UTILIZE MEDIA & MATERIALS (Gunakan Media dan Bahan)", [
        `Set Induksi: ${materials.set_induksi || "Teka-teki bunyi haiwan"}`,
        `Langkah 1: ${materials.langkah_1_penerangan || "Penerangan konsep interaktif"}`,
        `Langkah 2: ${materials.langkah_2_aktiviti || "Aktiviti praktikal murid"}`
      ]);

      drawSection("R", "REQUIRE LEARNER PARTICIPATION (Penglibatan Murid)", [
        participation.student_activity || "Menjawab soalan secara lisan dan interaktif.",
        `Gamifikasi: ${participation.gamification || "Sistem Ganjaran Bintang Pintar ⭐"}`
      ]);

      drawSection("E", "EVALUATE & REVISE (Penilaian & Semakan PBD)", [
        `Kaedah Pentaksiran: ${evaluate.assessment_method || "Pentaksiran Bilik Darjah (PBD) berterusan"}`,
        `Pemetaan Rubrik: ${evaluate.rubric_mapping || "TP1 (Tahu) hingga TP6 (Kreatif & Inovatif)"}`,
        `Pemulihan/Pengayaan: ${evaluate.remedial_enrichment || "Bimbingan guru fasilitator bertaraf individu"}`
      ]);

      // Footer
      page.drawText("Dijana Secara Automatik oleh AI Tutor Pro · Diperakui oleh Guru Bertanggungjawab (Instructor of Record)", {
        x: 45,
        y: 35,
        size: 8,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });

      const pdfBytes = await pdfDoc.save();

      return new NextResponse(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="e-RPH_${topic.replace(/\s+/g, "_")}.pdf"`,
        },
      });
    }

    // Default: Generate Microsoft Word (.docx) document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "KEMENTERIAN PENDIDIKAN MALAYSIA",
              heading: HeadingLevel.HEADING_2,
              alignment: "center",
            }),
            new Paragraph({
              text: "RANCANGAN PENGAJARAN HARIAN (e-RPH) - MODEL ASSURE",
              heading: HeadingLevel.TITLE,
              alignment: "center",
            }),
            new Paragraph({
              text: `Mata Pelajaran: ${subject} | Tahap: ${grade} | Tempoh: ${duration} Minit`,
              alignment: "center",
            }),
            new Paragraph({
              text: `Tajuk: ${topic}`,
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({ text: "1. A - ANALYZE LEARNERS (Analisis Murid)", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: `• Ciri Umum: ${analyze.general_characteristics || "Murid sekolah rendah Malaysia"}` }),
            new Paragraph({ text: `• Pengetahuan Sedia Ada: ${analyze.entry_competencies || "Asas topik berkaitan"}` }),
            new Paragraph({ text: `• Gaya Pembelajaran: ${analyze.learning_styles || "Visual, Auditori & Kinestetik"}` }),

            new Paragraph({ text: "2. S - STATE OBJECTIVES (Nyatakan Objektif)", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
            ...(Array.isArray(objectives.abcd_objectives)
              ? objectives.abcd_objectives.map((obj) => new Paragraph({ text: `• ${obj}` }))
              : [new Paragraph({ text: `• ${objectives.abcd_objectives || "Objektif tercapai"}` })]),
            new Paragraph({ text: `• Sasaran PBD: ${objectives.pbd_target || "TP3 ke atas"}` }),

            new Paragraph({ text: "3. S - SELECT MEDIA & MATERIALS (Pilih Media & Bahan)", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
            new Paragraph({ text: `• Media Digital: ${Array.isArray(media.digital_media) ? media.digital_media.join(", ") : "Google Meet AI Live Teacher"}` }),
            new Paragraph({ text: `• Bahan Fizikal: ${Array.isArray(media.physical_materials) ? media.physical_materials.join(", ") : "Buku teks KPM & lembaran kerja"}` }),

            new Paragraph({ text: "4. U - UTILIZE MEDIA & MATERIALS (Gunakan Media & Bahan)", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
            new Paragraph({ text: `• Set Induksi (5 min): ${materials.set_induksi || "Teka teki dan stimulasi audio"}` }),
            new Paragraph({ text: `• Langkah 1 (10 min): ${materials.langkah_1_penerangan || "Penerangan isi pelajaran utama"}` }),
            new Paragraph({ text: `• Langkah 2 (10 min): ${materials.langkah_2_aktiviti || "Aktiviti pengukuhan dan bersoal jawab"}` }),

            new Paragraph({ text: "5. R - REQUIRE LEARNER PARTICIPATION (Penglibatan Murid)", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
            new Paragraph({ text: `• Aktiviti Murid: ${participation.student_activity || "Interaksi lisan aktif dan pembentangan"}` }),
            new Paragraph({ text: `• Gamifikasi: ${participation.gamification || "Bintang Pintar ⭐"}` }),

            new Paragraph({ text: "6. E - EVALUATE & REVISE (Penilaian & Semakan PBD)", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
            new Paragraph({ text: `• Kaedah Pentaksiran: ${evaluate.assessment_method || "PBD berterusan"}` }),
            new Paragraph({ text: `• Pemetaan Rubrik: ${evaluate.rubric_mapping || "TP1 hingga TP6"}` }),
            new Paragraph({ text: `• Pemulihan & Pengayaan: ${evaluate.remedial_enrichment || "Bimbingan individu bersasar"}` }),

            new Paragraph({
              text: "Disahkan oleh Guru Mata Pelajaran / Fasilitator Bertanggungjawab.",
              spacing: { before: 400 },
            }),
          ],
        },
      ],
    });

    const docxBuffer = await Packer.toBuffer(doc);

    return new NextResponse(docxBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="e-RPH_${topic.replace(/\s+/g, "_")}.docx"`,
      },
    });
  } catch (error) {
    console.error("Error exporting e-RPH:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
