import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt pencarian ruangan harus diisi." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nowIso = new Date().toISOString();

    // 1. Ambil seluruh ruangan aktif beserta gedung dan fasilitasnya dari database
    const { data: ruanganList, error: roomError } = await supabase
      .from("ruangan")
      .select(`
        id,
        kode,
        deskripsi,
        kapasitas,
        luas_m2,
        lantai,
        url_foto,
        status_aktif,
        gedung:gedung_id(id, nama),
        ruangan_fasilitas(
          fasilitas:fasilitas_id(id, nama)
        )
      `)
      .eq("status_aktif", true)
      .order("kapasitas", { ascending: false });

    if (roomError) {
      throw roomError;
    }

    // 2. Ambil peminjaman yang sedang disetujui (sedang berlangsung)
    const { data: activeBookings } = await supabase
      .from("pengajuan")
      .select("ruangan_id")
      .eq("status", "disetujui")
      .lte("tanggal_mulai", nowIso)
      .gte("tanggal_selesai", nowIso);

    const bookedRoomIds = new Set((activeBookings || []).map((b) => b.ruangan_id));

    // 3. Ambil pengajuan yang sedang diproses / menunggu review
    const { data: pendingPengajuan } = await supabase
      .from("pengajuan")
      .select("ruangan_id")
      .in("status", ["menunggu_upload", "menunggu_ketua", "menunggu_wd3"]);

    const pendingRoomIds = new Set((pendingPengajuan || []).map((p) => p.ruangan_id));

    // 4. Analisis kriteria pencarian dari prompt pengguna
    const cleanPrompt = prompt.toLowerCase();

    // Ekstraksi lantai (misal: "lantai 1", "lantai 2")
    const floorMatch = cleanPrompt.match(/lantai\s*(\d+)/i);
    const requestedFloor = floorMatch ? parseInt(floorMatch[1], 10) : null;

    // Ekstraksi kapasitas angka (misal: "50 orang", "40 mhs", "untuk 35 orang", "kapasitas 30")
    let requestedCapacity: number | null = null;
    const explicitCapMatch = cleanPrompt.match(/(?:kapasitas|muat|tampung|untuk)\s*(\d+)/i) ||
                             cleanPrompt.match(/(\d+)\s*(?:orang|peserta|mhs|mahasiswa|kursi|jiwa)/i);
    if (explicitCapMatch) {
      requestedCapacity = parseInt(explicitCapMatch[1], 10);
    } else {
      // Fallback jika hanya angka tetapi bukan angka lantai
      const allNums = [...cleanPrompt.matchAll(/\b(\d+)\b/g)];
      for (const m of allNums) {
        const val = parseInt(m[1], 10);
        if (val !== requestedFloor && val >= 5) {
          requestedCapacity = val;
          break;
        }
      }
    }

    // Ekstraksi gedung (misal: "gedung c", "gedung e")
    let requestedGedung: string | null = null;
    if (cleanPrompt.includes("gedung c")) requestedGedung = "gedung c";
    if (cleanPrompt.includes("gedung e")) requestedGedung = "gedung e";

    // Ekstraksi kata kunci fasilitas
    const wantsAC = cleanPrompt.includes("ac") || cleanPrompt.includes("dingin") || cleanPrompt.includes("pendingin");
    const wantsProjector = cleanPrompt.includes("proyektor") || cleanPrompt.includes("lcd") || cleanPrompt.includes("infokus");
    const wantsPC = cleanPrompt.includes("pc") || cleanPrompt.includes("komputer") || cleanPrompt.includes("praktikum") || cleanPrompt.includes("lab");
    const wantsWhiteboard = cleanPrompt.includes("whiteboard") || cleanPrompt.includes("papan");
    const wantsDispenser = cleanPrompt.includes("dispenser") || cleanPrompt.includes("air");
    const wantsAvailableOnly = cleanPrompt.includes("tersedia") || cleanPrompt.includes("kosong") || cleanPrompt.includes("siap");

    // 5. Hitung skor relevansi untuk setiap ruangan di database
    const scoredRooms = (ruanganList || []).map((room: any) => {
      let score = 0;
      const reasons: string[] = [];

      let availability: "tersedia" | "ditahan" | "digunakan" = "tersedia";
      if (bookedRoomIds.has(room.id)) {
        availability = "digunakan";
      } else if (pendingRoomIds.has(room.id)) {
        availability = "ditahan";
      }

      // Ketersediaan
      if (availability === "tersedia") {
        score += 15;
      } else if (wantsAvailableOnly) {
        score -= 50;
      }

      // Kapasitas
      if (requestedCapacity !== null) {
        if (room.kapasitas >= requestedCapacity) {
          score += 30;
          reasons.push(`Kapasitas mencukupi (${room.kapasitas} orang)`);
        } else {
          score -= 20;
        }
      }

      // Lantai
      if (requestedFloor !== null) {
        if (room.lantai === requestedFloor) {
          score += 25;
          reasons.push(`Berada di Lantai ${room.lantai}`);
        } else {
          score -= 10;
        }
      }

      // Gedung
      const gedungName = (Array.isArray(room.gedung) ? room.gedung[0]?.nama : room.gedung?.nama) || "";
      if (requestedGedung && gedungName.toLowerCase().includes(requestedGedung)) {
        score += 25;
        reasons.push(gedungName);
      }

      // Fasilitas
      const fasilitasList: string[] = (room.ruangan_fasilitas || [])
        .map((rf: any) => rf.fasilitas?.nama)
        .filter(Boolean);

      const fasilLower = fasilitasList.join(" ").toLowerCase();

      if (wantsAC) {
        if (fasilLower.includes("ac")) {
          score += 15;
          reasons.push("Dilengkapi AC");
        }
      }
      if (wantsProjector) {
        if (fasilLower.includes("proyektor") || fasilLower.includes("lcd")) {
          score += 20;
          reasons.push("Dilengkapi Proyektor LCD");
        }
      }
      if (wantsPC) {
        if (fasilLower.includes("pc") || fasilLower.includes("workstation") || room.deskripsi?.toLowerCase().includes("lab")) {
          score += 25;
          reasons.push("Fasilitas Laboratorium / PC Workstation");
        }
      }
      if (wantsWhiteboard) {
        if (fasilLower.includes("whiteboard") || fasilLower.includes("papan")) {
          score += 10;
          reasons.push("Whiteboard");
        }
      }
      if (wantsDispenser) {
        if (fasilLower.includes("dispenser") || fasilLower.includes("air")) {
          score += 10;
          reasons.push("Dispenser Air");
        }
      }

      return {
        id: room.id,
        nama: `Ruang ${room.kode}`,
        kode: room.kode,
        kapasitas: room.kapasitas,
        luas: Number(room.luas_m2) || 0,
        status_ketersediaan: availability,
        lantai: room.lantai || 1,
        nama_gedung: gedungName,
        fasilitas: fasilitasList,
        score,
        reasons,
      };
    });

    // Urutkan berdasarkan skor tertinggi
    scoredRooms.sort((a, b) => b.score - a.score);

    // Ambil maksimal 4 ruangan teratas
    const topRooms = scoredRooms.slice(0, 4);

    // Buat pesan respons alami dari AI
    let aiMessage = "Berikut rekomendasi ruangan dari database SISFORA yang paling cocok dengan kebutuhan Anda:";
    if (requestedCapacity) {
      aiMessage = `Ditemukan ${topRooms.length} ruangan yang dapat menampung minimal ${requestedCapacity} orang:`;
    } else if (wantsPC) {
      aiMessage = `Berikut laboratorium komputer dan ruangan praktikum di Fakultas Teknik yang cocok:`;
    }

    const duration = Date.now() - startTime;

    // 6. Catat aktivitas ke public.log_ai sesuai skema database
    try {
      await supabase.from("log_ai").insert({
        user_id: user?.id || null,
        prompt: prompt.trim(),
        filter_hasil: {
          requestedCapacity,
          requestedFloor,
          requestedGedung,
          matchedRoomCount: topRooms.length,
        },
        jumlah_hasil: topRooms.length,
        status: "berhasil",
        durasi_ms: duration,
      });
    } catch (logErr) {
      console.error("Gagal mencatat log_ai:", logErr);
    }

    return NextResponse.json({
      message: aiMessage,
      rooms: topRooms,
    });
  } catch (error) {
    console.error("Error in AI Search:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memproses pencarian AI.",
      },
      { status: 500 }
    );
  }
}
