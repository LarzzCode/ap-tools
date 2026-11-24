import type { Tool } from '../types/tool'

export const tools: Tool[] = [
  {
    id: 'ktp-watermark',
    name: 'ID Card Watermark & Redactor',
    nameId: 'Watermark KTP & Sensor Dokumen',
    description:
      'Protect your ID card (KTP/SIM/Passport) scans from misuse by adding custom diagonal verification watermarks with date stamps and blurring sensitive numbers locally.',
    descriptionId:
      'Lindungi foto atau scan KTP, SIM, dan dokumen penting dari penyalahgunaan dengan menambahkan teks watermark verifikasi bertanggal serta sensor blur pada bagian NIK atau tanda tangan secara lokal.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/ktp-watermark',
    keywords: [
      'ktp',
      'watermark',
      'id card',
      'sensor',
      'blur',
      'nik',
      'pinjol',
      'verifikasi',
      'dokumen',
      'privasi',
    ],
    featured: true,
    guide: {
      overviewId:
        'Saat mengirim foto KTP untuk verifikasi bank, lamaran kerja, atau sewa menyewa, dokumen tanpa tanda khusus sangat rawan disalahgunakan pihak ketiga. Alat ini memungkinkan Anda menempelkan teks watermark menyilang (lengkap dengan tujuan & tanggal verifikasi) serta memburamkan area sensitif seperti NIK atau tanda tangan langsung di perangkat Anda tanpa mengunggah foto KTP ke server mana pun.',
      overviewEn:
        'When sharing ID card scans for banking verification, job applications, or rentals, unmarked images can easily be misused. This utility stamps customizable diagonal or centered verification text with today’s date and lets you blur or redact sensitive numbers directly in your browser without uploading your ID anywhere.',
      stepsId: [
        'Pilih atau tarik foto KTP / dokumen identitas Anda dari galeri perangkat.',
        'Ketik teks tujuan verifikasi (misalnya: "VERIFIKASI BCA") atau gunakan tombol preset cepat, lalu aktifkan tanggal otomatis.',
        'Atur pola watermark (menyilang berulang atau satu baris tengah), warna, ukuran teks, dan tingkat transparansi agar tetap terbaca namun sulit dihapus.',
        'Jika perlu, tambahkan kotak sensor (Blur / Pixelate / Blok Hitam) untuk menutupi bagian NIK atau tanda tangan, lalu unduh hasilnya dalam format JPG atau PNG.',
      ],
      stepsEn: [
        'Select or drop your ID card or sensitive document photo from your device.',
        'Enter your verification purpose (e.g., "BANK VERIFICATION ONLY") or pick a quick preset, and toggle the automatic date stamp.',
        'Adjust the watermark pattern (tiled diagonal grid or single banner), color, font size, and opacity so the ID remains readable while protected.',
        'Optionally add redaction zones (Blur, Pixelate, or Solid Block) over sensitive ID numbers or signatures, then download as JPG or PNG.',
      ],
      tipsId: [
        'Tempatkan sebagian teks watermark sedikit menyentuh tepi foto wajah atau area informasi KTP (tanpa menutupi data penting) agar tidak mudah dipotong.',
        'Selalu cantumkan nama instansi penerima dan tanggal pengiriman di dalam teks watermark.',
        '100% Aman: Foto KTP Anda diproses menggunakan HTML5 Canvas di dalam browser Anda sendiri dan tidak pernah dikirim ke internet.',
      ],
      tipsEn: [
        'Position the watermark so it slightly overlaps the edges of the card without obscuring required fields, making it hard to crop out.',
        'Always include the recipient organization and exact date in your watermark text.',
        '100% Private: Your ID image is processed via HTML5 Canvas inside your browser and never leaves your device.',
      ],
    },
  },
  {
    id: 'remove-background',
    name: 'Remove Background AI',
    nameId: 'Hapus Latar Foto (Remove BG)',
    description:
      'Automatically cut out subjects and remove image backgrounds using on-device AI, then export transparent PNGs or solid red/blue ID photo backdrops.',
    descriptionId:
      'Hapus latar belakang foto secara otomatis menggunakan AI langsung di perangkat Anda, lalu simpan sebagai PNG transparan atau ganti dengan latar merah, biru, dan putih.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/remove-background',
    keywords: [
      'remove background',
      'hapus background',
      'background',
      'transparent',
      'png',
      'photo',
      'pas foto',
      'red background',
      'blue background',
      'job application',
    ],
    featured: true,
    guide: {
      overviewId:
        'Alat ini memisahkan objek utama atau potret wajah dari latar belakang secara otomatis menggunakan model kecerdasan buatan (AI) yang berjalan langsung di browser Anda. Sangat cocok untuk mengganti warna latar pas foto menjadi merah atau biru standar administrasi, maupun membuat foto produk berlatar transparan.',
      overviewEn:
        'This tool automatically separates portraits or products from their backgrounds using an AI segmentation model running directly inside your browser. Ideal for switching ID photo backdrops to official red or blue, or creating transparent product cutouts.',
      stepsId: [
        'Pilih mode pemrosesan: Mode Cepat (WASM, ringan untuk semua perangkat) atau Mode Kualitas Tinggi (WebGPU untuk detail rambut lebih halus).',
        'Unggah foto potret atau objek berformat JPG, PNG, atau WebP.',
        'Tunggu proses pemisahan latar selesai, lalu pilih latar akhir: Transparan, Merah Pas Foto, Biru Pas Foto, Putih, atau Warna Kustom.',
        'Unduh hasil foto dalam format PNG berkualitas penuh.',
      ],
      stepsEn: [
        'Choose your engine: Fast Mode (WASM, works on all devices) or Quality Mode (WebGPU for finer hair and edge detail).',
        'Upload a portrait or object photo in JPG, PNG, or WebP format.',
        'Wait for segmentation to finish, then pick your backdrop: Transparent, ID Red, ID Blue, White, or Custom Color.',
        'Download the finished cutout as a full-resolution PNG.',
      ],
      tipsId: [
        'Saat pertama kali dijalankan, browser akan mengunduh model AI dan menyimpannya di cache agar pemakaian berikutnya jauh lebih cepat.',
        'Setelah mengganti warna latar, Anda bisa lanjut ke alat "Pas Foto & Lembar Cetak" untuk memotong ukuran 3×4 atau 4×6 cm.',
        'Foto Anda tidak pernah diunggah ke server cloud mana pun.',
      ],
      tipsEn: [
        'On first use, your browser downloads and caches the AI model locally so future runs start immediately.',
        'After changing the backdrop color, open "ID Photo & Print Sheet" to crop to standard 3×4 or 4×6 cm sizes.',
        'Your photos are never uploaded to any external cloud server.',
      ],
    },
  },
  {
    id: 'pas-foto',
    name: 'ID Photo & Print Sheet Maker',
    nameId: 'Pas Foto & Lembar Cetak 4R/A4',
    description:
      'Crop portraits to official 2×3, 3×4, 4×6 cm, or visa dimensions at 300 DPI and automatically arrange multiple copies onto a ready-to-print 4R or A4 sheet.',
    descriptionId:
      'Atur ukuran pas foto resmi (2×3, 3×4, 4×6 cm, atau Visa) beresolusi tajam 300 DPI, sesuaikan warna latar, dan susun otomatis ke kertas cetak 4R atau A4 siap print.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/pas-foto',
    keywords: [
      'pas foto',
      'id photo',
      '3x4',
      '4x6',
      '2x3',
      'visa',
      'print',
      'cetak',
      '4r',
      'a4',
      'crop',
    ],
    featured: true,
    guide: {
      overviewId:
        'Membuat pas foto untuk lamaran kerja, CPNS, buku nikah, ijazah, atau paspor kini tidak perlu repot menghitung piksel manual. Alat ini memotong foto sesuai ukuran milimeter resmi pada ketajaman cetak 300 DPI dan menyusunnya secara presisi ke dalam lembar kertas foto 4R atau A4 lengkap dengan garis bantu potong.',
      overviewEn:
        'Prepare official ID photos for job applications, passports, or school forms without manual pixel math. This tool crops your portrait to exact millimeter dimensions at print-ready 300 DPI and arranges multiple copies onto a 4R or A4 sheet with optional cut lines.',
      stepsId: [
        'Unggah foto potret Anda (gunakan foto PNG transparan dari alat Hapus Latar jika ingin langsung mengganti warna latar).',
        'Pilih ukuran standar pas foto: 2×3 cm, 3×4 cm, 4×6 cm, Visa Schengen (3.5×4.5 cm), atau Paspor AS (5.1×5.1 cm).',
        'Atur perbesaran (Zoom) serta posisi wajah horizontal dan vertikal agar proporsional di tengah bingkai.',
        'Pilih mode output "Lembar Cetak" (kertas 4R atau A4) atau "Foto Tunggal", tentukan jumlah salinan foto, lalu unduh sebagai JPG, PNG, atau PDF Siap Cetak.',
      ],
      stepsEn: [
        'Upload your portrait photo (use a transparent PNG from Remove Background if you want to fill a solid red or blue backdrop).',
        'Select an official size preset: 2×3 cm, 3×4 cm, 4×6 cm, Schengen Visa (3.5×4.5 cm), or US Passport (2×2 in).',
        'Adjust zoom and horizontal/vertical framing so the face is centered nicely.',
        'Choose "Print Sheet" (4R or A4 paper) or "Single Photo", set the number of copies, and export as JPG, PNG, or Print PDF.',
      ],
      tipsId: [
        'Gunakan kertas ukuran 4R jika Anda ingin mencetak di kios cetak foto (seperti mesin Fujifilm/Kodak) dengan biaya hemat.',
        'Aktifkan garis bantu potong (cut marks) agar hasil guntingan rapi dan lurus.',
        'File PDF lembar cetak sudah dikunci skalanya sesuai ukuran fisik kertas asli (100% scale).',
      ],
      tipsEn: [
        'Choose 4R paper if you plan to print at a local photo kiosk for the most economical photo paper print.',
        'Keep subtle cut border lines enabled so trimming with scissors or a paper cutter stays straight.',
        'The exported PDF locks exact physical millimeter dimensions for 100% actual-size printing.',
      ],
    },
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    nameId: 'Kompres Ukuran Gambar',
    description:
      'Shrink JPG, PNG, and WebP file sizes by up to 80% with live quality control and side-by-side size comparison directly in your browser.',
    descriptionId:
      'Perkecil ukuran file foto JPG, PNG, dan WebP hingga 80% lebih ringan dengan pengatur kualitas visual dan perbandingan ukuran langsung di browser.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/image-compressor',
    keywords: [
      'image',
      'compress',
      'kompres foto',
      'compression',
      'jpg',
      'png',
      'size',
      'kecilkan ukuran',
    ],
    featured: true,
    guide: {
      overviewId:
        'Sering gagal mengunggah foto ke portal pendaftaran karena batas ukuran file maksimal 200 KB atau 500 KB? Alat kompresor ini membantu menurunkan ukuran file gambar secara signifikan dengan tetap menjaga ketajaman visual sebaik mungkin, langsung dari browser perangkat Anda.',
      overviewEn:
        'Need to shrink photos to meet strict 200 KB or 500 KB upload limits on registration portals? This compressor reduces image file size significantly while preserving visual clarity, running completely inside your browser.',
      stepsId: [
        'Pilih atau tarik file gambar (JPG, PNG, atau WebP, maks 20 MB) ke area unggah.',
        'Pilih format hasil kompresi: WebP (paling ringan & tajam) atau JPG (kompatibel di semua sistem lama).',
        'Geser slider kualitas (misalnya 70%–80% untuk keseimbangan terbaik) lalu klik tombol kompres.',
        'Bandingkan ukuran file asli vs hasil kompresi serta persentase penghematannya, lalu unduh gambar.',
      ],
      stepsEn: [
        'Select or drop a JPG, PNG, or WebP image (up to 20 MB) into the upload zone.',
        'Choose your output format: WebP (smallest file size) or JPEG (universal compatibility).',
        'Adjust the quality slider (70%–80% offers the best balance) and run compression.',
        'Compare original vs compressed size and savings percentage, then download your optimized image.',
      ],
      tipsId: [
        'Format WebP umumnya menghasilkan ukuran file 25–35% lebih kecil dibanding JPG pada kualitas visual yang setara.',
        'Jika portal tujuan hanya menerima file .jpg, pilih format output JPEG dan atur kualitas di kisaran 65–75%.',
        'Seluruh proses kompresi berjalan di memori perangkat Anda tanpa kuota harian.',
      ],
      tipsEn: [
        'WebP typically produces files 25–35% smaller than JPEG at equivalent visual quality.',
        'If an upload portal strictly requires .jpg files, switch the output format to JPEG at 65–75% quality.',
        'Compression runs locally in your device memory with no daily limits.',
      ],
    },
  },
  {
    id: 'image-privacy',
    name: 'EXIF Stripper & Format Converter',
    nameId: 'Pembersih Metadata EXIF & Konverter',
    description:
      'Inspect and erase hidden GPS coordinates, camera serial numbers, and timestamp metadata from photos, while resizing and converting between JPG, PNG, and WebP.',
    descriptionId:
      'Deteksi dan hapus metadata tersembunyi seperti lokasi GPS, tipe HP/kamera, serta waktu pemotretan dari foto sebelum dibagikan, sekaligus ubah resolusi atau format.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/image-privacy',
    keywords: [
      'exif',
      'metadata',
      'gps',
      'privacy',
      'strip',
      'convert',
      'resize',
      'webp',
      'lokasi foto',
    ],
    featured: true,
    guide: {
      overviewId:
        'Foto yang diambil dari smartphone modern biasanya menyimpan data EXIF tersembunyi seperti titik koordinat GPS rumah Anda, merek perangkat, dan jam pengambilan foto. Alat ini memeriksa keberadaan segmen metadata tersebut dan membuat salinan gambar baru yang bersih 100% dari informasi pelacak.',
      overviewEn:
        'Photos taken on smartphones embed hidden EXIF data including exact GPS coordinates, device model, and capture timestamps. This tool inspects your image headers and re-encodes a clean copy stripped of all tracking metadata.',
      stepsId: [
        'Unggah foto JPG, PNG, atau WebP yang ingin diperiksa.',
        'Lihat laporan deteksi metadata (apakah terdapat segmen EXIF, GPS, XMP, atau profil warna).',
        'Pilih format gambar keluaran (JPG, PNG, atau WebP), atur kualitas, dan isi lebar piksel maksimum jika ingin sekalian mengecilkan dimensi.',
        'Klik tombol bersihkan metadata lalu unduh file gambar yang sudah aman untuk dibagikan ke publik.',
      ],
      stepsEn: [
        'Upload the JPG, PNG, or WebP image you want to inspect.',
        'Review the metadata inspection report showing detected EXIF, XMP, ICC, or PNG text chunks.',
        'Select your desired output format (JPG, PNG, or WebP), quality, and optional maximum pixel width.',
        'Click Strip Metadata & Convert to download a clean, privacy-safe image.',
      ],
      tipsId: [
        'Biasakan membersihkan EXIF sebelum mengunggah foto pribadi ke forum publik, marketplace, atau tautan berbagi.',
        'Anda juga bisa memakai alat ini sebagai pengubah format cepat dari WebP ke JPG atau PNG.',
        'Proses pembacaan dan pembersihan byte gambar dilakukan sepenuhnya secara lokal.',
      ],
      tipsEn: [
        'Strip EXIF metadata before posting personal photos to public forums, marketplaces, or shared links.',
        'You can also use this tool as a fast format converter between WebP, PNG, and JPG.',
        'All byte inspection and re-encoding happens locally in your browser.',
      ],
    },
  },
  {
    id: 'image-stitcher',
    name: 'Screenshot & Photo Stitcher',
    nameId: 'Gabung Screenshot & Foto Panjang',
    description:
      'Combine multiple chat screenshots, transfer receipts, or photos vertically or horizontally into a single seamless image.',
    descriptionId:
      'Gabungkan beberapa screenshot chat panjang, bukti transfer, atau foto secara vertikal (memanjang ke bawah) maupun horizontal menjadi satu gambar utuh.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/image-stitcher',
    keywords: [
      'stitch',
      'gabung foto',
      'screenshot panjang',
      'chat',
      'collage',
      'vertical',
      'horizontal',
      'struk',
    ],
    featured: true,
    guide: {
      overviewId:
        'Ingin mengirim tangkapan layar percakapan WhatsApp atau struk panjang tanpa harus mengirim 5–10 gambar terpisah? Alat ini menyambung beberapa gambar sekaligus secara vertikal (ke bawah) maupun horizontal (berdampingan) dengan opsi menyamakan lebar gambar secara otomatis.',
      overviewEn:
        'Need to share a multi-page chat thread or long receipt without sending 10 separate screenshots? This stitcher combines multiple images vertically or horizontally and automatically normalizes widths for a clean, continuous result.',
      stepsId: [
        'Pilih atau tarik beberapa gambar screenshot sekaligus (hingga 15 gambar).',
        'Pilih arah penggabungan: Vertikal (memanjang ke bawah) atau Horizontal (berdampingan ke samping).',
        'Atur urutan gambar menggunakan tombol panah naik/turun, serta sesuaikan jarak antar-gambar (gap) bila diperlukan.',
        'Unduh hasil gabungan gambar dalam format JPG atau PNG.',
      ],
      stepsEn: [
        'Select or drop multiple screenshots at once (up to 15 images).',
        'Choose the stitch direction: Vertical (top-to-bottom) or Horizontal (side-by-side).',
        'Reorder images using the up/down arrows and adjust gap or outer padding if desired.',
        'Download the combined image as JPG or PNG.',
      ],
      tipsId: [
        'Biarkan opsi "Samakan lebar seluruh gambar otomatis" aktif agar screenshot yang ukurannya sedikit berbeda tetap rata kiri-kanan.',
        'Atur jarak antar-gambar ke 0px untuk sambungan chat yang menyatu tanpa garis jeda.',
        'Seluruh gambar digabungkan langsung di browser perangkat Anda.',
      ],
      tipsEn: [
        'Keep automatic width matching enabled so slightly different crop sizes align flush on both edges.',
        'Set gap to 0px for seamless chat screenshots, or add 8–16px for a clean photo strip.',
        'All stitching happens 100% locally in your browser.',
      ],
    },
  },
  {
    id: 'aspect-cropper',
    name: 'Social Media & Banner Cropper',
    nameId: 'Crop Rasio Sosmed & Banner',
    description:
      'Crop or fit photos to exact Instagram 4:5, Story/Reels 9:16, Square 1:1, YouTube 16:9, and header banner dimensions.',
    descriptionId:
      'Potong atau sesuaikan ukuran foto ke rasio standar Instagram Feed (4:5), Story/Reels/TikTok (9:16), Persegi (1:1), Thumbnail YouTube (16:9), dan Banner.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/aspect-cropper',
    keywords: [
      'crop',
      'potong foto',
      'rasio',
      'instagram',
      '4:5',
      '9:16',
      '16:9',
      '1:1',
      'thumbnail',
      'banner',
    ],
    featured: true,
    guide: {
      overviewId:
        'Setiap platform media sosial memiliki standar ukuran piksel dan rasio yang berbeda agar foto tidak terpotong otomatis saat diunggah. Alat ini menyediakan preset rasio resmi (4:5, 9:16, 1:1, 16:9, 3:1) dengan dua pilihan mode: Penuhi Bingkai (Crop) atau Muat Utuh dengan latar bingkai.',
      overviewEn:
        'Every social platform uses specific aspect ratios and pixel dimensions. This tool provides one-tap presets (4:5, 9:16, 1:1, 16:9, 3:1) with both Fill Frame (Crop) and Fit Whole Photo modes.',
      stepsId: [
        'Unggah foto yang ingin disesuaikan ukurannya.',
        'Pilih rasio target seperti 4:5 IG Feed (1080×1350), 9:16 Story/Reels (1080×1920), 1:1 Persegi, atau 16:9 YouTube (1920×1080).',
        'Pilih mode "Penuhi Bingkai (Crop)" atau "Muat Utuh (Fit)", lalu atur zoom serta posisi geser.',
        'Unduh hasil gambar siap unggah dalam format JPG atau PNG.',
      ],
      stepsEn: [
        'Upload the photo you want to frame or crop.',
        'Pick a target aspect ratio preset such as 4:5 IG Portrait, 9:16 Story/Reels, 1:1 Square, or 16:9 YouTube.',
        'Switch between "Fill Frame (Crop)" or "Fit Whole Photo", and fine-tune zoom and pan.',
        'Download the ready-to-post JPG or PNG image.',
      ],
      tipsId: [
        'Gunakan rasio 4:5 (1080×1350px) untuk postingan foto Instagram agar tampil maksimal di layar HP.',
        'Mode "Muat Utuh (Fit)" sangat berguna jika Anda ingin memasukkan foto lanskap ke dalam ukuran Story 9:16 tanpa memotong bagian tepi foto.',
        'Diproses instan di browser tanpa mengurangi ketajaman foto.',
      ],
      tipsEn: [
        'Use the 4:5 portrait preset (1080×1350px) for Instagram feed posts to maximize vertical screen space.',
        'Use "Fit Whole Photo" when placing a wide landscape photo inside a 9:16 Story or 1:1 square without cropping edges.',
        'Processed locally in your browser at full resolution.',
      ],
    },
  },
  {
    id: 'color-palette',
    name: 'Color Picker & Photo Palette Extractor',
    nameId: 'Color Picker & Ekstrak Palet Warna Foto',
    description:
      'Extract 8 dominant harmonious colors from any photo or poster, sample exact pixel colors with an interactive eyedropper, and export HEX/RGB/HSL or a palette card PNG.',
    descriptionId:
      'Ekstrak 8 warna dominan dari foto atau poster, ambil kode warna dari titik mana pun dengan pipet (Eyedropper), lalu salin kode HEX/RGB/HSL atau unduh kartu palet PNG.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/color-palette',
    keywords: [
      'color',
      'palette',
      'color picker',
      'eyedropper',
      'hex',
      'rgb',
      'hsl',
      'warna',
      'palet warna',
      'desain',
      'ppt',
    ],
    featured: true,
    guide: {
      overviewId:
        'Sedang membuat slide presentasi PPT, poster organisasi, atau desain UI dan ingin memakai kombinasi warna dari sebuah foto referensi? Alat ini otomatis mengekstrak 8 warna dominan paling harmonis dari gambar Anda sekaligus menyediakan pipet warna (Eyedropper) interaktif untuk mengambil kode HEX, RGB, dan HSL dari titik piksel mana pun.',
      overviewEn:
        'Designing slides, social graphics, or websites and want to match colors from a reference image? This tool automatically extracts 8 harmonious dominant colors from any photo and includes an interactive pixel eyedropper with one-tap HEX, RGB, HSL, and CSS variable export.',
      stepsId: [
        'Pilih atau tarik foto referensi, poster, atau logo ke area kanvas.',
        'Lihat 8 warna dominan yang otomatis diekstrak; ketuk kotak warna mana saja untuk langsung menyalin kode HEX-nya.',
        'Ketuk titik mana pun langsung pada gambar di kanvas untuk mengambil warna spesifik dari titik tersebut menggunakan fitur Pipet (Eyedropper).',
        'Salin kode HEX, RGB, HSL, variabel CSS, atau klik "Unduh Kartu Palet Warna + Foto (PNG)" untuk disimpan.',
      ],
      stepsEn: [
        'Select or drop a reference photo, poster, or logo onto the canvas.',
        'Browse the 8 automatically extracted dominant colors; tap any swatch to copy its HEX code immediately.',
        'Click or tap anywhere directly on the image canvas to sample that exact pixel with the interactive eyedropper.',
        'Copy HEX, RGB, HSL, CSS variables, or download the combined Photo + Palette Card PNG.',
      ],
      tipsId: [
        'Kartu Palet PNG yang diunduh sudah memuat foto referensi beserta deretan warna HEX di bawahnya — sangat praktis untuk dikirim ke tim desain.',
        'Gunakan tombol "Salin CSS" jika Anda sedang membuat website dan butuh variabel `--palette-1` hingga `--palette-8`.',
        'Semua analisis piksel berlangsung 100% di dalam browser Anda.',
      ],
      tipsEn: [
        'The downloadable Palette Card PNG pairs your reference image with labeled HEX swatches for easy moodboard sharing.',
        'Use the "Copy CSS" button to grab ready-to-paste `:root` CSS custom properties.',
        'All pixel sampling runs 100% locally in your browser.',
      ],
    },
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image (JPG / PNG HD)',
    nameId: 'PDF ke Gambar (Ubah PDF jadi JPG/PNG)',
    description:
      'Convert PDF document pages into high-resolution JPG, PNG, or WebP images directly in your browser for WhatsApp sharing or portal uploads.',
    descriptionId:
      'Ubah setiap halaman dokumen PDF menjadi file gambar JPG, PNG, atau WebP beresolusi tinggi (HD) langsung di browser tanpa upload ke server.',
    category: 'pdf',
    runtime: 'browser',
    path: '/tools/pdf-to-image',
    keywords: [
      'pdf to jpg',
      'pdf to png',
      'pdf ke gambar',
      'pdf ke foto',
      'ubah pdf jadi jpg',
      'convert pdf',
      'sertifikat',
    ],
    featured: true,
    guide: {
      overviewId:
        'Kebalikan dari fitur Gambar ke PDF: alat ini mengubah halaman-halaman di dalam file PDF Anda menjadi gambar JPG, PNG, atau WebP yang tajam. Sangat berguna saat portal pendaftaran meminta unggahan dalam format `.JPG` padahal berkas scan Anda berbentuk `.PDF`, atau saat Anda ingin mengirim halaman dokumen ke grup WhatsApp agar langsung tampil sebagai gambar.',
      overviewEn:
        'The reverse of Image to PDF: render every page (or selected pages) of a PDF document into crisp JPG, PNG, or WebP images. Ideal when a registration form only accepts .JPG uploads or when sharing a document page directly inside a WhatsApp chat.',
      stepsId: [
        'Pilih atau tarik file PDF yang ingin diubah menjadi gambar.',
        'Pilih format gambar keluaran (JPG untuk ukuran hemat, PNG untuk ketajaman teks maksimal, atau WebP) serta tingkat resolusi (Standar, HD Tajam, atau Ultra HD).',
        'Kosongkan kolom halaman untuk mengubah seluruh halaman, atau ketik nomor halaman tertentu (misalnya: "1, 3-5").',
        'Klik "Ubah PDF ke Gambar", lalu unduh gambar per halaman atau klik "Unduh Semua" sekaligus.',
      ],
      stepsEn: [
        'Select or drop the PDF document you want to convert.',
        'Choose your output image format (JPG, PNG, or WebP) and resolution quality (Standard, HD Crisp, or Ultra HD).',
        'Leave the page range blank to convert all pages, or specify pages like "1, 3-5".',
        'Click Convert PDF to Images, then download individual pages or click Download All.',
      ],
      tipsId: [
        'Pilih kualitas "HD Tajam" untuk dokumen teks atau surat agar hurufnya tetap jelas saat diperbesar.',
        'Pilih kualitas "Ultra HD" jika Anda ingin mengubah PDF sertifikat atau poster menjadi gambar siap cetak.',
        'Proses render halaman PDF dilakukan 100% secara lokal di perangkat Anda.',
      ],
      tipsEn: [
        'Use "HD Crisp" for text documents and forms so small typography remains sharp.',
        'Use "Ultra HD" when converting PDF certificates or posters for printing.',
        'PDF rendering runs 100% locally inside your browser.',
      ],
    },
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF Converter',
    nameId: 'Gabung Gambar ke PDF',
    description:
      'Combine up to 20 photos or document scans into a clean, multi-page A4 PDF with drag-and-drop page ordering, orientation, and margin controls.',
    descriptionId:
      'Gabungkan hingga 20 foto atau hasil scan dokumen menjadi satu file PDF A4 rapi lengkap dengan pengaturan urutan halaman, orientasi kertas, dan margin.',
    category: 'pdf',
    runtime: 'browser',
    path: '/tools/image-to-pdf',
    keywords: [
      'image',
      'pdf',
      'jpg',
      'png',
      'convert',
      'foto ke pdf',
      'gabung foto',
    ],
    featured: true,
    guide: {
      overviewId:
        'Ubah kumpulan foto tugas, kwitansi, halaman buku, atau berkas lamaran menjadi satu dokumen PDF standar A4 yang siap dikirim. Anda dapat menyusun urutan gambar secara bebas menggunakan drag-and-drop sebelum file PDF dibuat.',
      overviewEn:
        'Turn multiple photos of assignments, receipts, book pages, or application forms into a single A4 PDF document. Reorder images freely via drag-and-drop and customize page orientation and margins.',
      stepsId: [
        'Pilih atau tarik beberapa gambar sekaligus (JPG, PNG, atau WebP, hingga 20 gambar).',
        'Geser kartu gambar untuk mengatur urutan halaman dari halaman pertama hingga terakhir.',
        'Pilih orientasi kertas (Potret Tegak atau Lanskap Mendatar) serta ukuran tepi/margin halaman.',
        'Klik "Buat PDF" lalu unduh dokumen PDF yang sudah tergabung.',
      ],
      stepsEn: [
        'Select or drop multiple images at once (JPG, PNG, or WebP, up to 20 images).',
        'Drag and drop the image cards to arrange the exact page sequence.',
        'Choose page orientation (Portrait or Landscape) and margin size (None, Small, or Normal).',
        'Click Generate PDF and download your combined document.',
      ],
      tipsId: [
        'Gunakan margin "Kecil" (Small) agar hasil cetak dokumen terlihat rapi dan tidak terpotong printer.',
        'Semua gambar otomatis disesuaikan proporsinya di tengah halaman A4 tanpa menjadi gepeng.',
        'Dokumen PDF dirakit langsung di memori browser menggunakan pustaka pdf-lib.',
      ],
      tipsEn: [
        'Use the "Small" margin setting if you plan to print the PDF so edges aren’t clipped by printers.',
        'Each image is proportionally centered on an A4 page without stretching or distortion.',
        'Your PDF is assembled locally in browser memory using pdf-lib.',
      ],
    },
  },
  {
    id: 'pdf-merge',
    name: 'PDF Merge',
    nameId: 'Gabung File PDF (Merge)',
    description:
      'Combine multiple separate PDF documents into a single unified file in your chosen order, processed 100% locally in your browser.',
    descriptionId:
      'Satukan beberapa file PDF terpisah menjadi satu dokumen utuh sesuai urutan yang Anda inginkan, diproses 100% lokal di perangkat Anda.',
    category: 'pdf',
    runtime: 'browser',
    path: '/tools/pdf-merge',
    keywords: [
      'pdf',
      'merge',
      'gabung pdf',
      'combine',
      'join',
      'document',
      'satukan pdf',
    ],
    featured: true,
    guide: {
      overviewId:
        'Saat melamar pekerjaan atau mengurus administrasi, sering kali surat lamaran, CV, ijazah, dan sertifikat masih terpisah dalam banyak file PDF. Alat ini menggabungkan seluruh file PDF tersebut menjadi satu dokumen berurutan tanpa mengurangi kualitas teks maupun gambar di dalamnya.',
      overviewEn:
        'When submitting job applications or reports, cover letters, resumes, and certificates often sit in separate PDFs. This utility merges multiple PDF files into one seamless document in any order without degrading text or vector quality.',
      stepsId: [
        'Unggah dua atau lebih file PDF dari perangkat Anda.',
        'Periksa jumlah halaman tiap file yang terdeteksi secara otomatis.',
        'Tarik ikon pegangan di samping nama file untuk mengubah urutan penggabungan dokumen.',
        'Klik "Gabungkan PDF" dan simpan file PDF gabungan Anda.',
      ],
      stepsEn: [
        'Upload two or more PDF files from your device.',
        'Review the automatically detected page count for each uploaded file.',
        'Drag the handle next to each file to reorder how the documents will be combined.',
        'Click Merge PDFs and save your unified PDF file.',
      ],
      tipsId: [
        'Anda dapat menambahkan file PDF tambahan kapan saja sebelum menekan tombol gabung.',
        'Kualitas teks vektor di dalam PDF tetap tajam karena halaman disalin secara langsung tanpa dikompres ulang.',
        'Cocok untuk dokumen rahasia perusahaan karena file tidak pernah keluar dari komputer/HP Anda.',
      ],
      tipsEn: [
        'You can keep adding more PDF files to the queue before merging.',
        'Vector text and embedded graphics stay razor-sharp because pages are copied directly without re-rasterizing.',
        'Safe for confidential contracts since files never leave your computer or phone.',
      ],
    },
  },
  {
    id: 'pdf-split',
    name: 'PDF Split & Extract',
    nameId: 'Pisah & Ambil Halaman PDF',
    description:
      'Extract specific pages or custom page ranges (e.g., 1-3, 5, 8-10) from a large PDF into a new lightweight PDF file locally.',
    descriptionId:
      'Ambil halaman tertentu atau rentang halaman khusus (misalnya 1-3, 5, 8-10) dari dokumen PDF tebal menjadi file PDF baru yang lebih ringkas.',
    category: 'pdf',
    runtime: 'browser',
    path: '/tools/pdf-split',
    keywords: [
      'pdf',
      'split',
      'pisah pdf',
      'extract',
      'pages',
      'separate',
      'document',
      'potong pdf',
    ],
    featured: true,
    guide: {
      overviewId:
        'Hanya butuh beberapa halaman penting dari e-book atau laporan PDF yang tebalnya ratusan halaman? Dengan alat ini Anda cukup mengetikkan nomor halaman atau rentang halaman yang diinginkan untuk mengekstraknya menjadi file PDF baru secara instan.',
      overviewEn:
        'Only need a few specific pages from a 100-page report or e-book? Enter individual page numbers or ranges to extract just the pages you need into a clean new PDF document.',
      stepsId: [
        'Unggah file PDF yang ingin diambil halamannya.',
        'Lihat total halaman yang terdeteksi pada dokumen tersebut.',
        'Ketik nomor halaman atau rentang halaman yang ingin diambil (contoh: "1-3, 7, 10-12") atau gunakan tombol pilihan cepat.',
        'Klik "Ekstrak Halaman" untuk mengunduh file PDF baru yang hanya berisi halaman pilihan Anda.',
      ],
      stepsEn: [
        'Upload the PDF document you want to split or extract from.',
        'Check the total number of pages detected in the document.',
        'Type the page numbers or ranges to extract (e.g., "1-3, 7, 10-12") or use the quick preset buttons.',
        'Click Extract Pages to download a new PDF containing only your chosen pages.',
      ],
      tipsId: [
        'Gunakan tanda koma (,) untuk memisahkan halaman tunggal dan tanda hubung (-) untuk rentang halaman berurutan.',
        'File PDF asli Anda tidak akan berubah; sistem selalu membuat file PDF baru untuk halaman yang diekstrak.',
        'Pemrosesan berlangsung dalam hitungan milidetik di browser.',
      ],
      tipsEn: [
        'Use commas (,) to separate individual pages and hyphens (-) for continuous ranges.',
        'Your original PDF file remains untouched; a brand-new PDF is generated with the extracted pages.',
        'Extraction completes in milliseconds inside your browser.',
      ],
    },
  },
  {
    id: 'pdf-organizer',
    name: 'PDF Page Organizer & Numbering',
    nameId: 'Atur Halaman PDF (Putar & Nomor)',
    description:
      'Rotate upside-down scanned pages, reorder or delete pages interactively, and stamp automatic page numbers across your PDF document.',
    descriptionId:
      'Putar halaman PDF hasil scan yang miring atau terbalik, urutkan ulang posisi halaman, hapus halaman yang salah, dan tambahkan nomor halaman otomatis.',
    category: 'pdf',
    runtime: 'browser',
    path: '/tools/pdf-organizer',
    keywords: [
      'pdf',
      'rotate',
      'putar pdf',
      'reorder',
      'urutkan halaman',
      'page numbers',
      'nomor halaman',
      'delete page',
      'hapus halaman',
    ],
    featured: true,
    guide: {
      overviewId:
        'Dokumen hasil scan sering kali memiliki halaman yang terbalik 90° atau 180°, terselip halaman kosong, atau belum memiliki nomor halaman. Alat ini menampilkan daftar seluruh halaman PDF Anda sehingga Anda bisa memutar halaman tertentu, menggeser urutan halaman, membuang halaman yang tidak perlu, dan mencetak nomor halaman otomatis.',
      overviewEn:
        'Scanned PDFs often contain sideways or upside-down pages, blank sheets, or missing page numbers. This organizer lets you rotate individual or all pages, reorder pages, remove unwanted sheets, and add automatic page numbering.',
      stepsId: [
        'Unggah dokumen PDF yang ingin dirapikan halamannya.',
        'Gunakan tombol putar (+90° / -90°) pada kartu halaman yang miring, atau klik "Putar Semua" jika seluruh dokumen terbalik.',
        'Gunakan tombol geser urutan atau klik ikon tempat sampah untuk menandai halaman yang ingin dibuang.',
        'Jika diperlukan, aktifkan opsi "Tambahkan Nomor Halaman", pilih format (misal: "Halaman 1 dari N") dan posisi, lalu unduh PDF yang sudah rapi.',
      ],
      stepsEn: [
        'Upload the PDF file whose pages you want to organize.',
        'Click the rotate buttons (+90° / -90°) on sideways pages, or use "Rotate All" to fix the entire document at once.',
        'Move pages earlier/later in sequence or toggle the trash button to exclude unwanted pages.',
        'Optionally enable "Add Page Numbers", pick your numbering format and position, then export the organized PDF.',
      ],
      tipsId: [
        'Jika Anda tidak sengaja menghapus halaman, cukup klik kembali halaman tersebut atau tekan tombol "Pulihkan Semua Halaman".',
        'Nomor halaman baru akan dihitung secara berurutan mengikuti halaman yang tersisa setelah penghapusan.',
        'Seluruh manipulasi halaman dikerjakan secara lokal menggunakan pdf-lib.',
      ],
      tipsEn: [
        'If you exclude a page by mistake, click it again or press "Restore All Pages" before exporting.',
        'Page numbers are automatically calculated based on the final kept page sequence.',
        'All page transformations run locally in your browser via pdf-lib.',
      ],
    },
  },
  {
    id: 'pdf-sign',
    name: 'PDF Sign & Watermark',
    nameId: 'Tanda Tangan & Watermark PDF',
    description:
      'Draw a handwritten signature on a touch pad or upload a transparent PNG signature, and stamp custom text watermarks across PDF pages.',
    descriptionId:
      'Bubuhkan tanda tangan tulis tangan atau gambar PNG transparan ke dokumen PDF, serta tambahkan stempel watermark teks di setiap halaman.',
    category: 'pdf',
    runtime: 'browser',
    path: '/tools/pdf-sign',
    keywords: [
      'pdf',
      'sign',
      'signature',
      'watermark',
      'stamp',
      'tanda tangan',
      'ttd pdf',
    ],
    featured: true,
    guide: {
      overviewId:
        'Perlu menandatangani surat pernyataan, kontrak kerja, atau formulir PDF tanpa harus mencetaknya ke kertas dulu? Anda bisa langsung menggambar tanda tangan dengan jari/mouse atau mengunggah gambar tanda tangan transparan, mengatur posisinya di halaman PDF, maupun memberikan stempel watermark dokumen.',
      overviewEn:
        'Need to sign an agreement, declaration form, or invoice without printing and scanning? Draw your signature on the interactive pad or upload a transparent PNG, position it on your PDF page, or stamp a document-wide text watermark.',
      stepsId: [
        'Unggah dokumen PDF yang ingin ditandatangani atau diberi watermark.',
        'Pilih tab "Tanda Tangan" untuk menggambar tanda tangan di kanvas (atau unggah PNG transparan), atau pilih tab "Watermark" untuk stempel teks.',
        'Tentukan halaman tujuan (Halaman Terakhir, Halaman Pertama, atau Semua Halaman) serta atur koordinat posisi X, Y, dan ukuran menggunakan pratinjau halaman.',
        'Klik tombol unduh untuk menyimpan dokumen PDF yang telah ditandatangani.',
      ],
      stepsEn: [
        'Upload the PDF document you want to sign or watermark.',
        'Choose "Signature" to draw on the pad (or upload a transparent PNG), or switch to "Watermark" for text stamps.',
        'Select target pages (Last Page, First Page, or All Pages) and fine-tune X/Y placement and width with the live page guide.',
        'Click the download button to save your signed or watermarked PDF.',
      ],
      tipsId: [
        'Gunakan warna pena Biru Tua (Navy) jika Anda ingin tanda tangan terlihat seperti tinta pulpen asli pada dokumen resmi.',
        'Pratinjau rasio halaman di sisi kanan menyesuaikan proporsi asli halaman pertama dokumen PDF Anda.',
        'Tanda tangan Anda tidak pernah disimpan di server mana pun.',
      ],
      tipsEn: [
        'Pick the Navy Blue pen color if you want your signature to look like realistic ballpoint ink on official forms.',
        'The placement preview matches the exact aspect ratio of your PDF’s first page.',
        'Your signature is never stored on or transmitted to any server.',
      ],
    },
  },
  {
    id: 'invoice-generator',
    name: 'Invoice & Receipt PDF Maker',
    nameId: 'Pembuat Invoice & Kwitansi PDF',
    description:
      'Create clean, professional PDF invoices and payment receipts in Rupiah (IDR) or USD with automatic tax/discount calculation and paid stamps.',
    descriptionId:
      'Buat dokumen Invoice tagihan atau Kwitansi pembayaran PDF profesional dalam Rupiah (IDR) maupun USD lengkap dengan hitung pajak, diskon, dan stempel LUNAS.',
    category: 'pdf',
    runtime: 'browser',
    path: '/tools/invoice-generator',
    keywords: [
      'invoice',
      'kwitansi',
      'nota',
      'receipt',
      'tagihan',
      'pdf',
      'umkm',
      'freelance',
      'rupiah',
    ],
    featured: true,
    guide: {
      overviewId:
        'Dirancang khusus untuk freelancer, kreator, dan pelaku UMKM yang membutuhkan dokumen tagihan (Invoice) atau bukti pembayaran (Kwitansi) rapi dalam waktu kurang dari 1 menit. Tidak perlu daftar akun atau berlangganan aplikasi akuntansi — cukup isi rincian item, dan sistem akan menghasilkan PDF siap kirim ke WhatsApp atau email klien.',
      overviewEn:
        'Built for freelancers, creators, and small businesses who need a clean PDF invoice or payment receipt in under a minute. No sign-ups or accounting subscriptions required — enter your line items and download a vector PDF ready to share via WhatsApp or email.',
      stepsId: [
        'Pilih jenis dokumen ("Invoice Tagihan" atau "Kwitansi Pembayaran"), mata uang (IDR Rp atau USD $), serta status stempel (LUNAS / BELUM LUNAS).',
        'Isi nomor dokumen, tanggal, nama usaha/pengirim, serta nama klien/penerima.',
        'Masukkan daftar barang atau jasa beserta jumlah (Qty) dan harga satuan; tambahkan diskon atau PPN (%) bila diperlukan.',
        'Tuliskan informasi rekening bank/e-wallet pada kolom catatan pembayaran, lalu klik "Unduh PDF" untuk menghasilkan dokumen siap kirim.',
      ],
      stepsEn: [
        'Choose the document type ("Invoice" or "Payment Receipt"), currency (IDR or USD), and status stamp (PAID / UNPAID).',
        'Fill in the document number, date, sender/business details, and client details.',
        'Add your line items with quantities and unit prices, plus optional discount or tax percentage.',
        'Include bank account or payment instructions in the notes field, then click Download PDF.',
      ],
      tipsId: [
        'Dokumen PDF dihasilkan dalam bentuk teks vektor murni sehingga ukurannya sangat ringan (sekitar 15–30 KB) dan tetap tajam saat dizoom.',
        'Aktifkan stempel "LUNAS" saat Anda mengirim bukti kwitansi pembayaran kepada pelanggan.',
        'Semua data transaksi hanya diproses di browser perangkat Anda.',
      ],
      tipsEn: [
        'The generated PDF uses pure vector typography, keeping file size tiny (15–30 KB) and crisp at any zoom level.',
        'Enable the "PAID / LUNAS" stamp when sending a completed payment receipt to a customer.',
        'All billing figures remain strictly inside your local browser session.',
      ],
    },
  },
  {
    id: 'pdf-compressor',
    name: 'PDF Size Compressor',
    nameId: 'Kompres Ukuran File PDF',
    description:
      'Reduce large PDF file sizes for job portals, CPNS, or campus uploads with Balanced, Maximum, and Lossless Structure modes locally.',
    descriptionId:
      'Perkecil ukuran file PDF hasil scan ijazah, transkrip, atau berkas lamaran agar lolos batas maksimal upload portal kampus, CPNS, dan HRD.',
    category: 'pdf',
    runtime: 'browser',
    path: '/tools/pdf-compressor',
    keywords: [
      'pdf',
      'compress',
      'kompres pdf',
      'kecilkan pdf',
      'size',
      'cpns',
      'ijazah',
      'lamaran',
    ],
    featured: true,
    guide: {
      overviewId:
        'Portal pendaftaran kerja, CPNS, beasiswa, dan kampus sering membatasi unggahan file PDF maksimal 300 KB, 500 KB, atau 1 MB. Alat ini mengecilkan ukuran dokumen PDF langsung di dalam browser Anda tanpa mengunggah dokumen penting tersebut ke server luar.',
      overviewEn:
        'Job portals, scholarship forms, and government registration systems often enforce strict 300 KB, 500 KB, or 1 MB PDF limits. This compressor shrinks your PDF files directly inside your browser without uploading confidential documents online.',
      stepsId: [
        'Pilih atau tarik file PDF yang ukurannya terlalu besar.',
        'Pilih tingkat kompresi: "Seimbang" (terbaik untuk PDF scan), "Ekstra Kecil" (untuk batas upload super ketat), atau "Optimasi Struktur" (untuk PDF teks murni).',
        'Klik "Kompres PDF Sekarang" dan pantau progres halaman.',
        'Lihat perbandingan ukuran file sebelum vs sesudah beserta persentase penghematannya, lalu unduh PDF Anda.',
      ],
      stepsEn: [
        'Select or drop the PDF document you need to shrink.',
        'Pick a compression mode: "Balanced" (best for scanned PDFs), "Maximum Compression" (for strict upload caps), or "Lossless Structure" (for vector text PDFs).',
        'Click Compress PDF Now and wait for page processing to finish.',
        'Review the before/after size comparison and download your compressed PDF.',
      ],
      tipsId: [
        'Gunakan mode "Seimbang" atau "Ekstra Kecil" untuk PDF hasil foto/scan kamera yang awalnya berukuran 3 MB–15 MB.',
        'Gunakan mode "Optimasi Struktur & Metadata" jika dokumen PDF berasal dari ekspor Word dan Anda ingin teksnya tetap bisa diblok/dicopy.',
        'Berkas penting Anda diproses 100% di memori browser perangkat Anda.',
      ],
      tipsEn: [
        'Use "Balanced" or "Maximum Compression" for camera-scanned PDFs that start at 3 MB–15 MB.',
        'Use "Lossless Structure & Metadata" for Word-exported PDFs when you need text to stay selectable.',
        'Your documents are compressed 100% locally in browser memory.',
      ],
    },
  },
  {
    id: 'cv-maker',
    name: 'ATS-Friendly CV / Resume Maker',
    nameId: 'Pembuat CV ATS-Friendly PDF',
    description:
      'Build a clean, single-column ATS-friendly PDF resume in Indonesian or English with 100% selectable vector text.',
    descriptionId:
      'Buat dokumen CV / Resume PDF satu kolom berstandar ATS-Friendly yang rapi, mudah dibaca sistem seleksi HRD, dan langsung siap kirim.',
    category: 'pdf',
    runtime: 'browser',
    path: '/tools/cv-maker',
    keywords: [
      'cv',
      'resume',
      'ats',
      'lamaran kerja',
      'curriculum vitae',
      'pdf',
      'hrd',
    ],
    featured: true,
    guide: {
      overviewId:
        'Banyak perusahaan menggunakan sistem ATS (Applicant Tracking System) untuk menyaring CV pelamar secara otomatis. Desain CV yang terlalu banyak grafik atau tabel rumit sering gagal terbaca oleh mesin ATS. Alat ini menghasilkan dokumen PDF CV satu kolom standar internasional dengan teks vektor murni yang 100% terbaca oleh sistem HRD maupun rekruter.',
      overviewEn:
        'Most companies use Applicant Tracking Systems (ATS) to parse resumes. Complex multi-column graphics often fail ATS parsing. This builder generates a clean, single-column Harvard-style vector PDF resume that is 100% readable by both ATS software and human recruiters.',
      stepsId: [
        'Isi informasi pribadi dan kontak (Nama Lengkap, Headline Posisi, No HP, Email, Kota, serta link LinkedIn/Portofolio).',
        'Tuliskan ringkasan profesional singkat (2–3 kalimat) mengenai keahlian dan pengalaman utama Anda.',
        'Tambahkan riwayat Pengalaman Kerja / Organisasi beserta poin-poin pencapaian (pisahkan tiap poin dengan baris baru).',
        'Lengkapi riwayat Pendidikan, Keahlian (Skills), dan Sertifikasi, lalu klik "Unduh CV ATS-Friendly (PDF)".',
      ],
      stepsEn: [
        'Enter your personal details and contact links (Full Name, Target Role, Phone, Email, City, LinkedIn/Portfolio).',
        'Write a concise 2–3 sentence professional summary.',
        'Add your Work & Leadership Experience entries with achievement bullet points (one bullet per line).',
        'Fill in Education, Technical/Soft Skills, and Certifications, then click Download ATS CV (PDF).',
      ],
      tipsId: [
        'Gunakan kata kerja aktif dan angka terukur pada poin pengalaman (contoh: "Meningkatkan penjualan sebesar 25% dalam 3 bulan").',
        'File PDF yang dihasilkan sangat ringan (< 30 KB) dan seluruh teksnya bisa di-copy langsung oleh mesin ATS.',
        'Data CV Anda tidak disimpan di server mana pun.',
      ],
      tipsEn: [
        'Use action verbs and measurable results in your experience bullets (e.g., "Increased page speed by 35%").',
        'The exported PDF is ultra-lightweight (< 30 KB) with pure selectable vector typography.',
        'Your personal resume data never leaves your browser.',
      ],
    },
  },
  {
    id: 'letter-generator',
    name: 'Official & Job Application Letter PDF',
    nameId: 'Pembuat Surat Resmi & Lamaran PDF',
    description:
      'Generate formal Indonesian PDF letters for job applications, resignations, leave requests, and official declarations with optional signature.',
    descriptionId:
      'Buat PDF Surat Lamaran Kerja, Surat Resign, Surat Izin Kuliah/Kerja, dan Surat Pernyataan resmi lengkap dengan tanda tangan digital dalam hitungan detik.',
    category: 'pdf',
    runtime: 'browser',
    path: '/tools/letter-generator',
    keywords: [
      'surat',
      'surat lamaran kerja',
      'resign',
      'surat izin',
      'surat pernyataan',
      'pdf',
      'cover letter',
    ],
    featured: true,
    guide: {
      overviewId:
        'Butuh membuat Surat Lamaran Kerja, Surat Pengunduran Diri (Resign), Surat Izin Sakit/Kuliah, atau Surat Pernyataan resmi dari HP tanpa harus membuka Microsoft Word? Pilih jenis surat, isi data singkat, sesuaikan isi paragraf bila perlu, bubuhkan tanda tangan di layar, dan langsung unduh dokumen PDF ukuran A4 berformat rapi.',
      overviewEn:
        'Need to create a formal Job Application Cover Letter, Resignation Letter, Leave Request, or Official Declaration on your phone or laptop without opening Word? Pick a template, fill in your details, sign on the pad, and download a formatted A4 PDF.',
      stepsId: [
        'Pilih template jenis surat: Surat Lamaran Kerja, Surat Resign Kerja, Surat Izin Kerja/Kuliah, atau Surat Pernyataan.',
        'Isi kota & tanggal surat, perihal, nama perusahaan/instansi tujuan, serta nama dan kontak Anda.',
        'Periksa isi surat yang otomatis disusun di panel sebelah kanan (Anda bebas mengedit kata-katanya secara langsung).',
        'Jika ingin menyertakan tanda tangan, goreskan tanda tangan pada kanvas yang tersedia, lalu klik "Unduh Surat Resmi (PDF A4)".',
      ],
      stepsEn: [
        'Choose a letter template: Job Application, Resignation, Leave/Sick Note, or Declaration.',
        'Fill in the city & date, subject, recipient company, and your name/contact info.',
        'Review and freely customize the generated letter body in the editor panel.',
        'Optionally draw your signature on the pad, then click Download Official Letter (A4 PDF).',
      ],
      tipsId: [
        'Dokumen menggunakan jenis huruf formal Times New Roman standar surat-menyurat resmi di Indonesia.',
        'Jika Anda ingin mencetak surat untuk ditandatangani basah dengan pulpen, cukup kosongkan kanvas tanda tangan digital.',
        'Semua isi surat dibuat secara lokal di perangkat Anda.',
      ],
      tipsEn: [
        'The exported A4 PDF uses formal Times Roman typography suitable for official correspondence.',
        'Leave the digital signature pad blank if you plan to print the letter and sign it by hand.',
        'All letter content is generated locally on your device.',
      ],
    },
  },
  {
    id: 'wifi-qr',
    name: 'Wi-Fi QR Card Generator',
    nameId: 'Kartu QR Wi-Fi Siap Cetak',
    description:
      'Generate printable Wi-Fi QR cards so guests can connect to your home, boarding house, or cafe Wi-Fi instantly by pointing their phone camera.',
    descriptionId:
      'Buat kartu QR Wi-Fi estetik siap cetak atau simpan ke HP agar tamu di rumah, kosan, kantor, atau kafe bisa langsung tersambung ke Wi-Fi hanya dengan scan kamera.',
    category: 'links',
    runtime: 'browser',
    path: '/tools/wifi-qr',
    keywords: [
      'wifi',
      'qr',
      'wi-fi',
      'kartu wifi',
      'hotspot',
      'password wifi',
      'kafe',
      'kosan',
    ],
    featured: true,
    guide: {
      overviewId:
        'Tidak perlu lagi mengeja password Wi-Fi yang rumit berulang kali kepada tamu atau pelanggan. Alat ini mengubah nama jaringan (SSID) dan kata sandi Wi-Fi Anda menjadi kartu kode QR standar internasional yang langsung dikenali kamera bawaan iPhone (iOS) maupun Android untuk tersambung otomatis.',
      overviewEn:
        'Stop spelling out complicated Wi-Fi passwords to guests or customers. This tool encodes your network name (SSID) and password into an industry-standard Wi-Fi QR card recognized natively by iPhone (iOS) and Android cameras for one-tap connection.',
      stepsId: [
        'Masukkan Nama Jaringan Wi-Fi (SSID) persis sesuai huruf besar/kecilnya serta kata sandi Wi-Fi Anda.',
        'Pilih jenis keamanan jaringan (umumnya WPA/WPA2/WPA3 untuk router modern, atau Tanpa Password untuk Wi-Fi terbuka).',
        'Pilih tema desain kartu ala iOS, atur judul kartu (misalnya "Wi-Fi Tamu"), dan pilih apakah teks password ingin ditampilkan atau disembunyikan di kartu.',
        'Unduh kartu Wi-Fi sebagai gambar PNG beresolusi tinggi atau file PDF siap cetak untuk ditempel di dinding/meja.',
      ],
      stepsEn: [
        'Enter your exact Wi-Fi Network Name (SSID, case-sensitive) and Wi-Fi password.',
        'Select your network security type (WPA/WPA2/WPA3 for most routers, or None for open networks).',
        'Pick an iOS-inspired card theme, customize the header title, and toggle whether the plain-text password is shown on the card.',
        'Download the finished card as a high-resolution PNG or a print-ready PDF.',
      ],
      tipsId: [
        'Jika Anda tidak ingin tamu mengetahui teks password asli Anda, matikan opsi "Tampilkan teks password di kartu" — mereka tetap bisa connect lewat scan QR.',
        'Pastikan penulisan huruf besar dan kecil pada nama Wi-Fi (SSID) sama persis dengan pengaturan router.',
        'Kata sandi Wi-Fi Anda diolah 100% di browser dan tidak pernah dikirim ke server.',
      ],
      tipsEn: [
        'Hide the plain-text password on the card if you want guests to connect via QR scan without seeing the actual password characters.',
        'Make sure the SSID capitalization matches your router settings exactly.',
        'Your Wi-Fi password is encoded 100% locally in your browser and never sent over the network.',
      ],
    },
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    nameId: 'Pembuat Kode QR (QR Generator)',
    description:
      'Create high-resolution downloadable QR codes up to 1024px for website links, digital menus, portfolios, or plain text notes instantly.',
    descriptionId:
      'Buat kode QR bersih beresolusi tinggi (hingga 1024px) untuk tautan website, menu digital, portofolio, atau catatan teks secara instan.',
    category: 'links',
    runtime: 'browser',
    path: '/tools/qr-generator',
    keywords: ['qr', 'qrcode', 'url', 'link', 'text', 'buat qr'],
    featured: true,
    guide: {
      overviewId:
        'Buat kode QR tajam tanpa batas waktu aktif (tidak akan pernah kedaluwarsa) dan tanpa embel-embel redirect iklan. Kode QR dibuat secara langsung dari tautan atau teks yang Anda ketik dan dapat diunduh dalam ukuran hingga 1024×1024 piksel untuk kebutuhan desain cetak maupun digital.',
      overviewEn:
        'Generate permanent, direct QR codes that never expire and never route through third-party tracking redirects. Export crisp PNGs up to 1024×1024 pixels for print materials, slides, or digital sharing.',
      stepsId: [
        'Pilih jenis konten: Tautan URL website atau Teks bebas.',
        'Ketik atau tempelkan alamat URL / teks pada kolom input; pratinjau kode QR akan langsung muncul.',
        'Pilih ukuran resolusi gambar QR (256px untuk web, 512px standar, atau 1024px untuk cetak poster/banner).',
        'Klik tombol "Unduh PNG" untuk menyimpan gambar kode QR ke perangkat Anda.',
      ],
      stepsEn: [
        'Select your content type: Website URL or Plain Text.',
        'Type or paste your link or text into the input box to see the live QR preview immediately.',
        'Choose your output resolution (256px for web, 512px standard, or 1024px for print banners).',
        'Click Download PNG to save the QR code image.',
      ],
      tipsId: [
        'Gunakan ukuran 1024px jika kode QR akan dimasukkan ke desain brosur, spanduk, atau kartu nama di Canva/Photoshop.',
        'Karena kode QR ini bersifat statis (langsung menyimpan teks/URL asli), kode ini akan berfungsi selamanya.',
        'Pastikan URL diawali dengan https:// agar langsung dikenali sebagai tautan web oleh kamera HP.',
      ],
      tipsEn: [
        'Use the 1024px resolution when placing the QR code on printed flyers, banners, or business cards.',
        'Because the QR code encodes your URL directly (static QR), it works forever and never expires.',
        'Include https:// at the start of links so phone cameras open the browser automatically.',
      ],
    },
  },
  {
    id: 'qr-scanner',
    name: 'QR Code Scanner & Inspector',
    nameId: 'Pemindai & Pembaca Kode QR',
    description:
      'Decode QR codes from screenshots, gallery images, or your live camera and inspect the destination link safely before opening it.',
    descriptionId:
      'Baca isi kode QR dari screenshot, gambar galeri, atau kamera perangkat secara langsung dan periksa keamanan tautan tujuan sebelum membukanya.',
    category: 'links',
    runtime: 'browser',
    path: '/tools/qr-scanner',
    keywords: ['qr', 'scan', 'scanner', 'decode', 'camera', 'qris', 'baca qr'],
    featured: true,
    guide: {
      overviewId:
        'Dapat kiriman gambar kode QR di WhatsApp dan bingung cara membacanya dari HP yang sama? Atau ingin mengecek terlebih dahulu alamat asli di balik sebuah kode QR agar terhindar dari tautan phishing? Alat ini membaca isi kode QR dari file gambar maupun kamera secara aman di browser.',
      overviewEn:
        'Received a QR code image in a chat on the same phone you are holding, or want to inspect where a QR link points before visiting it? Decode QR codes from uploaded screenshots or your live camera safely inside the browser.',
      stepsId: [
        'Pilih mode "Dari Gambar" untuk mengunggah screenshot/foto QR dari galeri, atau mode "Kamera Langsung" untuk memindai lewat webcam/kamera HP.',
        'Arahkan atau pilih gambar yang memuat kode QR dengan jelas.',
        'Periksa teks atau alamat URL lengkap yang berhasil didekode pada panel hasil.',
        'Salin teksnya ke clipboard atau klik "Buka URL" jika Anda sudah yakin tautan tersebut aman.',
      ],
      stepsEn: [
        'Choose "From Image" to upload a QR screenshot/photo, or "Live Camera" to scan using your device camera.',
        'Select the image or point your camera clearly at the QR code.',
        'Inspect the full decoded text or destination URL in the result panel.',
        'Copy the decoded content or click Open URL once you verify the destination is safe.',
      ],
      tipsId: [
        'Jika membaca dari screenshot yang penuh elemen lain, potong (crop) sedikit gambarnya agar fokus pada kotak QR.',
        'Alat ini tidak pernah membuka tautan secara otomatis demi melindungi Anda dari URL berbahaya.',
        'Pemindaian gambar dilakukan di browser menggunakan pustaka jsQR.',
      ],
      tipsEn: [
        'If scanning a cluttered screenshot, crop closer to the QR square for instant detection.',
        'Links are never opened automatically so you can always verify suspicious URLs first.',
        'Decoding runs locally in your browser using jsQR.',
      ],
    },
  },
  {
    id: 'whatsapp-link',
    name: 'WhatsApp Link & QR Card Maker',
    nameId: 'Pembuat Link & Kartu QR WhatsApp',
    description:
      'Create instant wa.me click-to-chat links with preset greeting templates, automatic Indonesian (+62) phone formatting, and a printable WhatsApp QR Card PNG.',
    descriptionId:
      'Buat tautan klik-langsung-chat WhatsApp (wa.me) lengkap dengan preset pesan otomatis, format nomor Indonesia (+62), dan Kartu QR WhatsApp siap cetak.',
    category: 'links',
    runtime: 'browser',
    path: '/tools/whatsapp-link',
    keywords: [
      'whatsapp',
      'wa',
      'message',
      'link',
      'chat',
      'wa.me',
      'link wa',
    ],
    featured: true,
    guide: {
      overviewId:
        'Memudahkan pelanggan atau teman menghubungi Anda di WhatsApp tanpa harus menyimpan nomor ke kontak terlebih dahulu. Cukup masukkan nomor telepon (bisa diawali 08... atau +62...) dan tulis template pesan pembuka; sistem akan membuatkan link `wa.me` resmi sekaligus kode QR-nya.',
      overviewEn:
        'Let customers or friends message you on WhatsApp without saving your number to their contacts first. Enter a phone number (supports local 08... or international +62... input) and an optional pre-filled message to get an instant wa.me link and QR code.',
      stepsId: [
        'Masukkan nomor WhatsApp tujuan (contoh: 081234567890 — sistem otomatis mengubahnya ke format internasional 62812...).',
        'Ketik pesan pembuka otomatis (misalnya: "Halo Kak, saya ingin pesan produk...").',
        'Salin tautan WhatsApp yang terbentuk untuk dipasang di bio Instagram, TikTok, atau website.',
        'Atau klik "Buka Chat" untuk langsung memulai percakapan tanpa simpan nomor, dan unduh kode QR-nya bila diperlukan.',
      ],
      stepsEn: [
        'Enter the destination WhatsApp phone number (local 08... numbers are automatically normalized to 628...).',
        'Type an optional pre-filled greeting or order template message.',
        'Copy the generated wa.me link to paste into your Instagram bio, website, or catalog.',
        'Or click Open Chat to message the number immediately, and download the matching QR code.',
      ],
      tipsId: [
        'Sangat berguna juga saat Anda sendiri ingin mengirim chat cepat ke kurir atau nomor baru tanpa memenuhi daftar kontak HP.',
        'Karakter spasi dan baris baru pada pesan pembuka sudah di-encode secara otomatis agar aman di semua perangkat.',
        'Nomor telepon dan isi pesan tidak pernah disimpan oleh website ini.',
      ],
      tipsEn: [
        'Great for messaging a delivery driver or one-time contact yourself without cluttering your phone’s address book.',
        'Spaces, emojis, and line breaks in your message are URL-encoded automatically.',
        'Phone numbers and messages are never logged or stored.',
      ],
    },
  },
  {
    id: 'clean-url',
    name: 'Clean URL & Tracker Stripper',
    nameId: 'Pembersih Link dari Pelacak (Clean URL)',
    description:
      'Remove ugly tracking parameters like utm_source, fbclid, igsh, and si from links before sharing them in chats, bios, or documents.',
    descriptionId:
      'Bersihkan parameter pelacak panjang seperti utm_source, fbclid, igsh, dan si dari tautan sebelum Anda membagikannya ke grup chat atau dokumen.',
    category: 'links',
    runtime: 'browser',
    path: '/tools/clean-url',
    keywords: [
      'url',
      'link',
      'clean',
      'utm',
      'tracking',
      'privacy',
      'share',
      'bersihkan link',
    ],
    featured: true,
    guide: {
      overviewId:
        'Saat Anda menyalin tautan dari Instagram, YouTube, TikTok, atau marketplace, tautan tersebut biasanya ditempeli kode pelacak panjang seperti `?igsh=...`, `?si=...`, atau `utm_source=...` yang mengaitkan akun Anda dengan siapa pun yang membuka link tersebut. Alat ini memangkas seluruh parameter pelacak sambil mempertahankan parameter penting agar tautan tetap pendek, bersih, dan privat.',
      overviewEn:
        'Links copied from Instagram, YouTube, TikTok, or newsletters often carry tracking tags like ?igsh=..., ?si=..., or utm_source=... that tie your account to anyone who clicks the link. This tool strips tracking parameters while keeping functional query parameters intact.',
      stepsId: [
        'Tempelkan alamat URL panjang yang baru Anda salin ke kolom input.',
        'Lihat daftar parameter pelacak yang otomatis dideteksi dan dihapus oleh sistem.',
        'Aktifkan opsi tambahan jika Anda ingin menghapus seluruh parameter query atau tanda pagar (#hash).',
        'Salin tautan yang sudah bersih dan ringkas, atau gunakan kode QR bersih di sebelahnya.',
      ],
      stepsEn: [
        'Paste the messy URL into the input box.',
        'Review the list of tracking parameters automatically stripped versus functional parameters kept.',
        'Optionally toggle "Strip ALL query parameters" or "Remove #hash fragment" for maximum cleanup.',
        'Copy the clean link or scan/save its clean QR code.',
      ],
      tipsId: [
        'Parameter fungsional seperti `?id=123` atau `?v=videoId` pada YouTube tetap dipertahankan agar halaman tidak rusak.',
        'Tautan yang bersih terlihat jauh lebih rapi dan profesional saat ditempel di CV, makalah, atau grup WhatsApp.',
        'Seluruh pemrosesan URL berjalan secara offline di browser.',
      ],
      tipsEn: [
        'Functional parameters like YouTube’s ?v=videoId or article IDs are preserved so the page still works.',
        'Clean URLs look much tidier in resumes, papers, and group chats.',
        'URL parsing runs completely offline inside your browser.',
      ],
    },
  },
  {
    id: 'text-utilities',
    name: 'Text Cleaner & Case Converter',
    nameId: 'Perapi Teks PDF & Ubah Huruf',
    description:
      'Fix broken line breaks from PDF copy-pastes, normalize whitespace, convert letter casing, deduplicate/sort lines, and count words & reading time.',
    descriptionId:
      'Rapikan teks berantakan hasil copy-paste dari PDF, ubah format huruf besar/kecil, hapus baris ganda, cari & ganti kata, serta hitung jumlah kata.',
    category: 'text',
    runtime: 'browser',
    path: '/tools/text-utilities',
    keywords: [
      'text',
      'clean',
      'case',
      'uppercase',
      'lowercase',
      'word count',
      'pdf copy',
      'replace',
      'rapikan teks',
    ],
    featured: true,
    guide: {
      overviewId:
        'Menyalin paragraf dari file PDF atau jurnal sering menghasilkan baris yang terputus-putus di tengah kalimat dan spasi ganda yang berantakan. Alat ini menyediakan tombol satu-klik untuk menyambung kembali kalimat PDF, mengubah gaya penulisan huruf (UPPERCASE, lowercase, Title Case, camelCase, snake_case), merapikan daftar baris, hingga menghitung statistik kata secara real-time.',
      overviewEn:
        'Copying paragraphs from PDFs or academic papers often leaves awkward mid-sentence line breaks and uneven spaces. This workspace provides one-click actions to unwrap broken PDF lines, transform letter casing, deduplicate or sort lists, and track live word/character counts.',
      stepsId: [
        'Tempelkan teks hasil copy dari PDF, dokumen, atau daftar data ke area editor utama.',
        'Perhatikan statistik jumlah kata, karakter, baris, paragraf, dan estimasi waktu baca di bagian atas.',
        'Klik tindakan pembersihan yang dibutuhkan (misalnya "Perbaiki Baris Putus PDF", "Rapikan Spasi", atau "Hapus Baris Ganda") atau pilih format huruf pada panel Konversi Huruf.',
        'Gunakan fitur Cari & Ganti (Find & Replace) bila perlu, lalu klik "Salin" atau unduh sebagai file .txt.',
      ],
      stepsEn: [
        'Paste your text from a PDF, document, or list into the main workspace editor.',
        'Check the live word, character, line, paragraph, and reading-time counters at the top.',
        'Click any cleanup action ("Fix PDF line breaks", "Collapse extra spaces", "Remove duplicate lines") or apply a case conversion.',
        'Use Find & Replace if needed, then copy the result or download it as a .txt file.',
      ],
      tipsId: [
        'Untuk menjaga jarak antar-paragraf saat memakai fitur "Perbaiki Baris Putus PDF", pastikan antar-paragraf dipisahkan oleh satu baris kosong (dua kali Enter).',
        'Fitur "Title Case" sudah mengenali kata hubung pendek bahasa Indonesia (seperti "di", "ke", "dan", "yang") agar tetap huruf kecil di tengah judul.',
        'Teks yang Anda ketik tidak pernah dikirim ke server.',
      ],
      tipsEn: [
        'When using "Fix PDF line breaks", separate distinct paragraphs with a blank line (double Enter) so paragraphs stay separated.',
        'Title Case smartly keeps short connectors ("and", "of", "di", "dan", "yang") lowercase inside titles.',
        'Your text stays 100% in your browser memory.',
      ],
    },
  },
  {
    id: 'twibbon-maker',
    name: 'Twibbon & Photo Frame Studio',
    nameId: 'Twibbon & Frame Foto Studio',
    description:
      'Combine your portrait with any custom transparent PNG event frame or built-in banner template with interactive pan/zoom and 100% zero watermark.',
    descriptionId:
      'Pasang bingkai Twibbon PNG transparan (acara kampus, kepanitiaan, komunitas, 17-an) pada foto Anda dengan pengatur geser/zoom interaktif tanpa watermark.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/twibbon-maker',
    keywords: [
      'twibbon',
      'frame',
      'bingkai foto',
      'kampus',
      'event',
      'panitia',
      '17 agustus',
      'tanpa watermark',
    ],
    featured: true,
    guide: {
      overviewId:
        'Ingin memasang foto profil ke bingkai Twibbon acara kampus, kepanitiaan, atau organisasi tanpa harus mengunggah foto ke situs pihak ketiga yang menempelkan logo watermark dan penuh iklan? Alat ini menggabungkan foto diri Anda dengan file bingkai PNG transparan (atau template bingkai bawaan) langsung di browser dalam kualitas 1080p HD bersih.',
      overviewEn:
        'Pair your portrait with a transparent PNG campaign/event frame or customize a built-in banner template directly in your browser. Drag to reposition, pinch/slide to zoom, and export crisp 1080p images with zero watermarks or ads.',
      stepsId: [
        'Klik "1. Pilih Foto Diri" untuk mengunggah foto wajah atau profil Anda.',
        'Klik "2. Upload Frame PNG" jika Anda sudah punya file bingkai PNG transparan dari panitia, atau pilih salah satu template bingkai bawaan (Pita Event, Lencana Lingkaran, Merah Putih).',
        'Geser posisi foto langsung di dalam kanvas menggunakan jari/mouse dan atur slider Zoom atau Rotasi hingga pas.',
        'Unduh hasil Twibbon dalam format PNG HD atau JPG tanpa watermark.',
      ],
      stepsEn: [
        'Click "1. Pick Your Photo" to load your portrait.',
        'Click "2. Upload PNG Frame" to overlay a transparent PNG frame, or pick a built-in customizable event frame template.',
        'Drag the photo directly inside the canvas and adjust Zoom or Rotation until framed nicely.',
        'Download your finished Twibbon as a full-resolution PNG or JPG.',
      ],
      tipsId: [
        'Pastikan file bingkai Twibbon dari panitia berformat .PNG dengan bagian tengah transparan agar foto wajah terlihat di baliknya.',
        'Jika belum punya desain frame PNG, Anda tetap bisa langsung membuat bingkai acara dengan memilih mode "Pita Event Modern" atau "Lencana Lingkaran".',
        '100% Bebas Watermark dan privasi foto tetap terjaga di perangkat Anda.',
      ],
      tipsEn: [
        'Make sure custom uploaded event frames are transparent .PNG files so your photo shows through the cutout.',
        'If you do not have a PNG frame file, switch to the built-in Banner or Circle Badge templates and type your event title.',
        '100% watermark-free and processed locally on your device.',
      ],
    },
  },
  {
    id: 'device-mockup',
    name: 'Device & Browser Screenshot Mockup',
    nameId: 'Mockup Bingkai Screenshot HP & Laptop',
    description:
      'Wrap app or website screenshots inside realistic iPhone 16 Pro, MacBook Pro, or macOS Safari/Chrome browser frames with curated studio backdrops.',
    descriptionId:
      'Bungkus screenshot aplikasi, tugas web, atau halaman produk ke dalam bingkai iPhone 16 Pro, MacBook Pro, atau Jendela Browser macOS dengan latar estetik.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/device-mockup',
    keywords: [
      'mockup',
      'screenshot',
      'iphone',
      'macbook',
      'browser',
      'frame',
      'portofolio',
      'ui',
      'presentasi',
    ],
    featured: true,
    guide: {
      overviewId:
        'Menampilkan hasil screenshot website, proyek kodingan, atau desain aplikasi secara polos sering terlihat kurang menarik di slide presentasi maupun portofolio. Alat ini membungkus screenshot Anda ke dalam bingkai perangkat iPhone 16 Pro (lengkap dengan Dynamic Island), MacBook Pro, atau jendela browser macOS lengkap dengan efek bayangan 3D dan latar studio.',
      overviewEn:
        'Turn plain app or website screenshots into polished portfolio visuals. Wrap any screenshot inside an iPhone 16 Pro bezel, a MacBook Pro display, or a macOS browser window with customizable URL bar, 3D elevation shadow, and studio backdrops.',
      stepsId: [
        'Pilih atau tarik gambar screenshot HP, website, atau aplikasi Anda.',
        'Pilih jenis bingkai perangkat: Browser macOS (untuk tampilan web), iPhone 16 Pro (untuk screenshot vertikal HP), MacBook Pro, atau Kartu 3D Clean.',
        'Pilih tema latar belakang studio (atau pilih "Transparan PNG" jika ingin ditempel ke slide PPT/Canva), lalu atur ketebalan jarak tepi & bayangan.',
        'Unduh hasil gambar mockup dalam format PNG HD atau JPG tanpa watermark.',
      ],
      stepsEn: [
        'Select or drop your mobile or desktop screenshot.',
        'Choose a device frame: macOS Browser Window, iPhone 16 Pro, MacBook Pro, or Clean Floating Card.',
        'Pick a studio backdrop preset (or Transparent PNG for slide decks) and adjust outer margin and shadow depth.',
        'Download the finished high-resolution PNG or JPG mockup.',
      ],
      tipsId: [
        'Pada mode "Browser macOS", Anda dapat mengganti teks alamat URL di bagian atas jendela sesuai alamat proyek atau nama brand Anda.',
        'Pilih tema latar "Transparan (PNG)" jika Anda ingin menempelkan perangkat mockup ini langsung ke atas slide PowerPoint atau desain Canva.',
        'Sistem otomatis mendeteksi screenshot vertikal (potret) dan menyarankan bingkai iPhone.',
      ],
      tipsEn: [
        'In macOS Browser mode, customize the address bar text to show your live project domain or portfolio URL.',
        'Use the Transparent (PNG) backdrop when placing the device mockup directly onto PowerPoint, Keynote, or Canva slides.',
        'Portrait screenshots automatically switch to the iPhone frame on load.',
      ],
    },
  },
  {
    id: 'signature-extractor',
    name: 'Signature Photo to Transparent PNG',
    nameId: 'Ubah Foto Tanda Tangan Jadi PNG Transparan',
    description:
      'Remove white or shadowy paper backgrounds from handwritten signature photos and export a crisp, auto-trimmed transparent PNG in black or ballpoint blue ink.',
    descriptionId:
      'Hapus latar belakang kertas dari foto tanda tangan pulpen Anda menjadi file PNG transparan bersih (warna tinta Biru Pulpen atau Hitam) siap tempel ke Word & PDF.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/signature-extractor',
    keywords: [
      'tanda tangan',
      'signature',
      'transparent png',
      'ttd transparan',
      'hapus background tanda tangan',
      'word',
      'pdf',
    ],
    featured: true,
    guide: {
      overviewId:
        'Menggambar tanda tangan langsung di layar sentuh sering terasa kaku dibandingkan tanda tangan asli memakai pulpen di atas kertas. Dengan alat ini, Anda cukup menulis tanda tangan di kertas putih biasa lalu memfotonya dengan HP; sistem otomatis menghapus latar kertas beserta bayangannya dan menyisakan tinta tanda tangan berformat PNG transparan yang siap ditempel ke Microsoft Word, Google Docs, atau PDF.',
      overviewEn:
        'Signing with a real pen on paper feels much more natural than drawing with a mouse. Snap a photo of your handwritten signature on paper and this tool automatically strips away the paper background and shadows, leaving a crisp, auto-cropped transparent PNG in ballpoint blue or black ink.',
      stepsId: [
        'Tulis tanda tangan di kertas putih polos, foto menggunakan HP, lalu unggah ke mode "Ekstrak dari Foto Kertas" (atau gunakan mode "Tulis di Layar").',
        'Atur slider "Pembersih Bayangan Kertas" hingga seluruh warna kertas hilang dan hanya tersisa goresan tanda tangan.',
        'Pilih warna tinta yang diinginkan: Biru Pulpen Resmi, Hitam Pekat, Biru Navy, atau Warna Foto Asli.',
        'Aktifkan "Potong Otomatis Area Kosong (Auto-Trim)" lalu klik "Unduh Tanda Tangan Transparan (PNG)".',
      ],
      stepsEn: [
        'Sign on plain white paper, take a photo, and upload it in "Extract from Paper Photo" mode (or switch to "Draw Signature on Screen").',
        'Adjust the "Paper Removal Threshold" slider until the paper background disappears completely.',
        'Choose your ink color preset: Ballpoint Blue, Jet Black, Deep Navy, or Original Ink.',
        'Keep "Auto-Trim Empty Margins" enabled and click Download Transparent Signature (PNG).',
      ],
      tipsId: [
        'Foto tanda tangan di tempat yang terang agar kontras antara tinta pulpen dan kertas putih semakin tajam.',
        'Warna "Biru Pulpen Resmi" membuat dokumen digital terlihat seperti ditandatangani dengan pulpen asli.',
        '100% Aman: Foto tanda tangan Anda diproses lokal di dalam browser dan tidak pernah diunggah ke server.',
      ],
      tipsEn: [
        'Take the photo in good lighting without harsh shadow lines crossing the ink strokes.',
        'The "Ballpoint Blue" preset gives digital documents an authentic hand-signed appearance.',
        '100% Private: Your signature image never leaves your browser.',
      ],
    },
  },
  {
    id: 'document-scanner',
    name: 'Camera Document Scanner & Paper Whitener',
    nameId: 'Scanner Dokumen & Pemutih Foto Kertas',
    description:
      'Turn dark, shadowy phone photos of paper documents, notes, or receipts into crisp snow-white scans (Magic Color or B&W) and export to A4 PDF or JPG.',
    descriptionId:
      'Ubah foto kertas dokumen, catatan, atau surat yang agak gelap/berbayang menjadi hasil scan putih bersih (Magic Color / Hitam Putih) siap simpan ke PDF A4 atau JPG.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/document-scanner',
    keywords: [
      'scanner',
      'camscanner',
      'scan dokumen',
      'pemutih kertas',
      'magic color',
      'foto ke scan',
      'pdf',
    ],
    featured: true,
    guide: {
      overviewId:
        'Saat memfoto dokumen kertas, tugas kuliah, atau surat menggunakan kamera HP, hasilnya sering tampak abu-abu redup atau tertutup bayangan tangan. Alat ini bekerja layaknya aplikasi scanner dokumen: memutihkan latar kertas secara merata sekaligus mempertajam teks dan warna stempel tanpa menempelkan watermark aplikasi apa pun.',
      overviewEn:
        'Phone photos of paper documents often look dim, gray, or unevenly lit. This scanner utility whitens the paper background while sharpening text and preserving colored stamps/signatures (Magic Color or B&W Crisp mode), then exports directly to an A4 PDF or JPG with zero watermarks.',
      stepsId: [
        'Pilih atau foto langsung dokumen kertas (surat, catatan, kwitansi, berkas) dari perangkat Anda.',
        'Pilih mode efek scan: "Magic Color" (kertas putih bersih namun warna stempel/tanda tangan tetap hidup) atau "Hitam Putih Tajam" (untuk teks fotokopi kontras tinggi).',
        'Sesuaikan slider "Pemutih Kertas & Hapus Bayangan" serta "Ketajaman Teks", dan putar 90° bila orientasi foto miring.',
        'Klik "Simpan Hasil Scan sebagai PDF A4" atau unduh sebagai gambar JPG HD.',
      ],
      stepsEn: [
        'Select or snap a photo of your paper document, handwritten note, or receipt.',
        'Pick a scan filter: "Magic Color" (snow-white paper while keeping colored ink/stamps vivid) or "B&W Crisp Text" (high-contrast monochrome).',
        'Fine-tune the Paper Whitening and Text Contrast sliders, and rotate 90° if needed.',
        'Click "Download Scanned Document as A4 PDF" or save as a crisp JPG image.',
      ],
      tipsId: [
        'Gunakan mode "Magic Color" untuk dokumen resmi yang memiliki kop surat berwarna, materai, stempel basah, atau tanda tangan biru.',
        'Gunakan mode "Hitam Putih Tajam" untuk catatan tulisan tangan atau teks buku agar sangat jelas saat dicetak.',
        'Bebas watermark "Scanned with..." dan 100% diproses di perangkat Anda.',
      ],
      tipsEn: [
        'Use "Magic Color" for official documents with colored letterheads, stamps, or blue signatures.',
        'Use "B&W Crisp Text" for handwritten notes or printed text pages to maximize readability.',
        'Completely free of third-party scanner watermarks and processed locally.',
      ],
    },
  },
  {
    id: 'photo-collage',
    name: 'Photo Collage, Polaroid & Photobooth Studio',
    nameId: 'Kolase Foto Grid, Polaroid & Strip Photobox',
    description:
      'Arrange 1 to 9 photos into aesthetic Polaroid cards, 4-frame vertical Photobooth strips, or symmetrical 2×2 and 3×3 grids with custom captions and dates.',
    descriptionId:
      'Susun 1 hingga 9 foto ke dalam bingkai kartu Polaroid estetik, strip Photobox 3–4 foto, atau kolase Grid simetris lengkap dengan tulisan caption & tanggal.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/photo-collage',
    keywords: [
      'kolase foto',
      'collage',
      'polaroid',
      'photobooth',
      'photobox',
      'grid foto',
      'bingkai',
      'before after',
    ],
    featured: true,
    guide: {
      overviewId:
        'Ingin membuat kartu foto bergaya Polaroid klasik, strip foto ala Photobox studio bersama teman, atau menggabungkan hingga 9 foto dokumentasi acara ke dalam satu bingkai rapi? Alat ini menyusun foto-foto Anda secara proporsional (tanpa membuat foto gepeng) lengkap dengan warna kertas bingkai serta teks caption dan tanggal.',
      overviewEn:
        'Create classic Polaroid photo cards, vertical 3–4 frame Photobooth strips, side-by-side Before/After comparisons, or up to 9-photo grids. Every slot automatically center-crops proportionally without stretching.',
      stepsId: [
        'Klik kotak "Tambah Foto Kolase" untuk memilih 1 hingga 9 foto sekaligus dari galeri Anda.',
        'Pilih gaya tata letak: Kartu Polaroid, Strip Photobox, 2 Foto Sejajar (Before-After), Grid 4 Foto (2×2), atau Grid 6–9 Foto.',
        'Pilih warna kertas bingkai (Putih, Krem Vintage, Hitam Film, atau Biru Langit), lalu isi tulisan Caption & Tanggal di bagian bawah.',
        'Atur urutan foto menggunakan tombol panah bila perlu, lalu unduh hasilnya dalam format PNG HD atau JPG.',
      ],
      stepsEn: [
        'Click "Add Collage Photos" to select between 1 and 9 images from your device.',
        'Choose a layout style: Polaroid Card, Photobooth Strip, 2 Side-by-Side, 4-Photo Grid (2×2), or 6–9 Photo Grid.',
        'Pick a frame paper color (White, Vintage Cream, Dark Film, or Sky) and customize the bottom caption and date.',
        'Reorder photos with the up/down buttons if needed, then download your high-resolution PNG or JPG.',
      ],
      tipsId: [
        'Gaya "Strip Photobox" dengan warna kertas Hitam atau Krem sangat cocok untuk menggabungkan 3–4 foto selfie bersama teman.',
        'Gaya "2 Foto Sejajar" sangat pas untuk menampilkan perbandingan Before vs After.',
        'Kosongkan kolom Caption & Tanggal jika Anda hanya menginginkan kolase grid bersih tanpa teks bawah.',
      ],
      tipsEn: [
        'The "Photobooth Strip" layout with Dark or Cream paper is great for 3–4 candid selfie poses.',
        'Use "2 Side-by-Side" for clean Before & After comparisons.',
        'Clear the caption and date fields if you prefer a minimal text-free photo grid.',
      ],
    },
  },
  {
    id: 'live-photobooth',
    name: 'Live Camera Photobooth Studio',
    nameId: 'Photobox Kamera Langsung (Auto-Timer)',
    description:
      'Open your selfie camera or webcam for an automated 3- or 4-pose countdown photobooth session with vintage/Y2K filters and instant photobox strip export.',
    descriptionId:
      'Buka kamera selfie HP atau laptop langsung di browser untuk sesi foto 3–4 pose otomatis (hitung mundur 3..2..1.. Jepret!) lengkap dengan filter & strip Photobox.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/live-photobooth',
    keywords: [
      'photobooth',
      'photobox',
      'kamera langsung',
      'selfie',
      'strip foto',
      'timezone',
      'kamera',
    ],
    featured: true,
    addedAt: '2026-11-23T20:35:00-08:00',
    guide: {
      overviewId:
        'Rasakan serunya berfoto di mesin Photobox mall langsung dari HP atau laptop Anda bersama teman! Alat ini menyalakan kamera depan perangkat Anda, menghitung mundur otomatis (3.. 2.. 1.. Jepret!) sebanyak 3 atau 4 kali pose berturut-turut, memberikan efek filter (Vintage, Retro B&W, Warm, Y2K), dan langsung menyusunnya menjadi Strip Foto Photobox siap unduh.',
      overviewEn:
        'Experience a mall-style Photobox session right inside your browser. Turn on your selfie camera or webcam, start the automated 3- or 4-pose countdown timer, apply live film filters, and download a custom Photobooth strip PNG/JPG.',
      stepsId: [
        'Klik tombol "Nyalakan Kamera" dan izinkan akses kamera pada browser Anda.',
        'Pilih efek filter kamera (Natural, Film Vintage, Retro B&W, Warm Golden, atau Cool Y2K), jumlah pose (3x atau 4x), serta jeda timer (3s atau 5s).',
        'Klik "Mulai Sesi Otomatis" lalu bergayalah di depan kamera setiap kali hitungan mundur mencapai angka 1.',
        'Pilih warna kertas strip Photobox dan edit judul/tanggal di bagian bawah, lalu unduh Strip PNG atau JPG.',
      ],
      stepsEn: [
        'Click "Turn On Camera" and grant camera access in your browser.',
        'Pick a live filter preset, number of poses (3x or 4x), and countdown interval (3s or 5s).',
        'Click "Start Auto Session" and strike a pose each time the countdown hits 1.',
        'Customize the strip paper color and footer text, then download your Photobooth Strip as PNG or JPG.',
      ],
      tipsId: [
        'Anda juga bisa mengambil foto satu per satu secara manual menggunakan tombol "Jepret" atau mengunggah foto dari galeri.',
        'Gunakan warna strip "Hitam" atau "Krem" dengan filter "Film Vintage" untuk tampilan ala photobox retro.',
        '100% Privat: Rekaman kamera hanya diproses di layar perangkat Anda dan tidak pernah dikirim ke server.',
      ],
      tipsEn: [
        'You can also snap poses manually one by one using the "Snap" button or load photos from your gallery.',
        'Pair the Dark or Cream strip paper with the Vintage Film filter for an authentic retro photobox look.',
        '100% Private: Camera frames are captured strictly in local memory and never transmitted online.',
      ],
    },
  },
  {
    id: 'voice-changer',
    name: 'Studio Voice Changer & Audio Effects',
    nameId: 'Pengubah Suara & Efek Audio Studio',
    description:
      'Record your voice or upload audio to transform it into Anonymous Deep Pitch, Chipmunk, Cyborg Robot, Walkie-Talkie Radio, or Hall Echo in-browser.',
    descriptionId:
      'Rekam suara dari mikrofon atau unggah file audio untuk mengubah karakter suara menjadi Anonymous Berat, Chipmunk, Robot, Radio HT, atau Gema Studio.',
    category: 'media',
    runtime: 'browser',
    path: '/tools/voice-changer',
    keywords: [
      'voice changer',
      'pengubah suara',
      'efek suara',
      'anonymous',
      'chipmunk',
      'robot',
      'audio',
      'rekam suara',
    ],
    featured: true,
    addedAt: '2026-11-23T20:35:00-08:00',
    guide: {
      overviewId:
        'Ubah karakter rekaman suara Anda secara instan langsung di dalam browser tanpa perlu menginstal aplikasi edit audio maupun mengunggah suara ke server luar. Menggunakan teknologi Web Audio API (OfflineAudioContext), alat ini mampu memodulasi frekuensi vokal menjadi suara Anonymous yang berat, Chipmunk yang lucu, Robot Cyborg, Radio HT, maupun pantulan Gema Aula.',
      overviewEn:
        'Transform voice recordings directly inside your browser without external servers. Powered by the Web Audio API (OfflineAudioContext), this studio morphs vocal pitch and timbre into Deep Anonymous, Chipmunk, Cyborg Robot, Walkie-Talkie Radio, or Hall Echo.',
      stepsId: [
        'Klik "Rekam Suara dari Mikrofon" untuk bicara langsung (atau pilih file audio MP3/WAV/M4A dari perangkat).',
        'Pilih salah satu dari 6 karakter efek suara: Anonymous (Suara Berat), Chipmunk, Robot Cyborg, Radio Walkie-Talkie, Gema Aula, atau Penguat Suara Jernih.',
        'Tekan tombol Play pada pemutar audio untuk mendengarkan hasil perubahan suara secara langsung.',
        'Klik "Unduh File Audio (.WAV)" untuk menyimpan hasil suara ke HP atau laptop Anda.',
      ],
      stepsEn: [
        'Click "Record Voice from Microphone" to speak live (or upload an MP3/WAV/M4A audio file).',
        'Select any of the 6 studio voice effects: Anonymous, Chipmunk, Cyborg Robot, Walkie-Talkie Radio, Hall Echo, or Vocal Boost.',
        'Press Play on the audio preview player to audition the transformed voice immediately.',
        'Click "Download Transformed Audio (.WAV)" to save the audio file.',
      ],
      tipsId: [
        'Anda bebas mengganti-ganti pilihan efek suara tanpa perlu merekam ulang — sistem otomatis menerapkan efek baru ke rekaman yang sama.',
        'Efek "Anonymous (Suara Berat)" sangat cocok untuk menyamarkan identitas suara pada konten video atau narasi.',
        'Berjalan 100% di browser tanpa membutuhkan server backend.',
      ],
      tipsEn: [
        'Switch between different voice effects freely without re-recording — the engine re-renders from your original audio buffer.',
        'The "Anonymous (Deep Pitch)" preset is ideal for disguising vocal identity in videos or narrations.',
        'Runs 100% locally in your browser with no backend server required.',
      ],
    },
  },
  {
    id: 'carousel-splitter',
    name: 'Seamless Instagram Carousel Splitter',
    nameId: 'Pembuat Carousel IG Nyambung (Panorama)',
    description:
      'Slice wide photos or panoramic designs into 2 to 5 seamless, swipeable Instagram Carousel slides in 4:5 Portrait (1080×1350) or 1:1 Square format.',
    descriptionId:
      'Potong foto lebar atau poster panorama menjadi 2 hingga 5 slide Carousel Instagram (rasio 4:5 atau 1:1) yang tersambung mulus tanpa putus saat digeser.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/carousel-splitter',
    keywords: [
      'carousel',
      'instagram',
      'panorama',
      'split image',
      'potong foto ig',
      'slide nyambung',
      'microblog',
    ],
    featured: true,
    addedAt: '2026-11-23T20:35:00-08:00',
    guide: {
      overviewId:
        'Pernah melihat postingan Instagram yang ketika digeser ke samping (swipe), gambarnya menyambung terus tanpa terputus dari Slide 1 sampai Slide 5? Alat ini memotong foto lanskap lebar atau desain kanvas panjang Anda secara presisi ke ukuran resmi Instagram Feed (1080×1350px potret atau 1080×1080px persegi) lengkap dengan indikator garis sambungan.',
      overviewEn:
        'Create seamless swipeable Instagram carousels where wide photos or panoramic designs flow continuously across 2 to 5 slides. Automatically slices at exact 1080×1350 (4:5) or 1080×1080 (1:1) pixel boundaries.',
      stepsId: [
        'Pilih atau tarik foto lanskap lebar / desain panorama Anda.',
        'Tentukan jumlah potongan slide (2, 3, 4, atau 5 Slide) serta rasio Instagram (4:5 Feed Potret atau 1:1 Persegi).',
        'Perhatikan garis putus-putus biru pada pratinjau panorama dan sesuaikan Zoom atau Geser X/Y bila diperlukan.',
        'Klik "Unduh Semua" untuk menyimpan seluruh potongan gambar slide secara berurutan.',
      ],
      stepsEn: [
        'Select or drop a wide photo or panoramic graphic.',
        'Choose the number of slides (2, 3, 4, or 5) and target Instagram ratio (4:5 Portrait or 1:1 Square).',
        'Check the blue dashed seam lines in the preview and fine-tune Zoom or Pan X/Y.',
        'Click "Download All" to save every numbered slide ready for Instagram upload.',
      ],
      tipsId: [
        'Gunakan rasio 4:5 (1080×1350px per slide) agar tampilan carousel memenuhi ruang vertikal layar HP secara maksimal di feed Instagram.',
        'Anda dapat mematikan opsi Label "Geser →" jika ingin gambar murni tanpa penanda sudut.',
        'Saat mengunggah ke Instagram, pilih fitur multi-foto sesuai urutan nomor file Slide 1 hingga selesai.',
      ],
      tipsEn: [
        'Use the 4:5 portrait ratio (1080×1350px per slide) to take up maximum vertical real estate in the Instagram feed.',
        'Toggle off the "Swipe →" pill badge if you want a completely clean image seam.',
        'Upload the numbered slide files in order (Slide 1, Slide 2, ...) as a multi-photo post on Instagram.',
      ],
    },
  },
  {
    id: 'privacy-blur-brush',
    name: 'Privacy Blur & Pixelate Censor Brush',
    nameId: 'Kuas Sensor Blur & Mozaik Foto Privasi',
    description:
      'Paint directly over faces, license plates, shipping labels, or chat names with an interactive Pixelate, Soft Blur, or Blackout censor brush.',
    descriptionId:
      'Usapkan jari atau mouse langsung di atas wajah, plat nomor kendaraan, resi paket, atau nomor HP pada screenshot untuk memberikan efek sensor Mozaik TV atau Blur.',
    category: 'image',
    runtime: 'browser',
    path: '/tools/privacy-blur-brush',
    keywords: [
      'blur',
      'pixelate',
      'sensor',
      'mozaik',
      'plat nomor',
      'sensor wajah',
      'privasi',
      'censor',
    ],
    featured: true,
    addedAt: '2026-11-23T20:35:00-08:00',
    guide: {
      overviewId:
        'Sebelum mengunggah screenshot percakapan, foto resi paket, atau foto jalanan ke media sosial, sering kali ada bagian kecil seperti nomor telepon, alamat rumah, plat nomor kendaraan, atau wajah orang lain yang perlu ditutupi. Dengan kuas interaktif ini, Anda cukup mengusapkan jari atau kursor langsung pada bagian tersebut untuk mengubahnya menjadi sensor mozaik kotak-kotak (Pixelate), blur halus, atau stabilo hitam.',
      overviewEn:
        'Quickly redact sensitive details before posting photos or screenshots online. Simply swipe your finger or mouse over faces, vehicle license plates, addresses, or chat names to apply permanent Pixelate mosaic, Soft Gaussian Blur, or Solid Blackout strokes.',
      stepsId: [
        'Pilih atau tarik foto / screenshot yang ingin disensor.',
        'Pilih gaya kuas sensor: "Mozaik TV" (kotak-kotak piksel), "Blur Halus", atau "Stabilo Hitam".',
        'Atur Ukuran Kuas dan Tingkat Kerapatan Sensor, lalu usapkan jari atau mouse langsung di atas area foto pada kanvas.',
        'Gunakan tombol "Undo Goresan" jika salah usap, lalu klik "Unduh JPG" atau "Unduh PNG HD" untuk menyimpan.',
      ],
      stepsEn: [
        'Select or drop the photo or screenshot you want to redact.',
        'Pick a brush style: "Pixelate" (TV mosaic blocks), "Soft Blur", or "Blackout".',
        'Adjust Brush Size and Strength, then paint directly over sensitive areas on the canvas.',
        'Use "Undo Stroke" if needed, then click Download JPG or Download PNG.',
      ],
      tipsId: [
        'Gaya "Mozaik TV" dengan kerapatan 18–24px sangat efektif untuk menyamarkan teks nomor HP dan plat nomor agar tidak bisa dibaca ulang.',
        'Anda dapat mengombinasikan beberapa gaya kuas dalam satu foto yang sama (misalnya Mozaik pada wajah dan Stabilo Hitam pada nomor rekening).',
        'Efek sensor menyatu permanen ke dalam piksel gambar sehingga tidak bisa dibuka kembali oleh penerima foto.',
      ],
      tipsEn: [
        'The "Pixelate" brush at 18–24px strength is ideal for destroying text legibility on license plates and phone numbers.',
        'You can mix multiple brush styles on the same photo (e.g., Pixelate on faces and Blackout on account numbers).',
        'Redactions are permanently flattened into the output pixels so they cannot be reversed.',
      ],
    },
  },
  {
    id: 'vcard-qr',
    name: 'Digital Business Card & vCard QR',
    nameId: 'Pembuat Kartu Nama Digital (QR Kontak)',
    description:
      'Generate a vCard 3.0 contact QR code and printable digital business card PNG so anyone scanning can save your phone, WhatsApp, email, and socials in 1 tap.',
    descriptionId:
      'Buat kartu nama digital beserta kode QR Kontak (vCard) yang saat di-scan kamera HP langsung memunculkan tombol Simpan ke Kontak lengkap dengan nomor WA, email, dan jabatan.',
    category: 'links',
    runtime: 'browser',
    path: '/tools/vcard-qr',
    keywords: [
      'vcard',
      'kartu nama',
      'business card',
      'qr kontak',
      'contact qr',
      'simpan kontak',
      'vcf',
    ],
    featured: true,
    guide: {
      overviewId:
        'Saat berkenalan dengan klien, rekan kerja, atau teman kepanitiaan, mengetik nomor HP dan email satu per satu sering memakan waktu. Alat ini membuat Kartu Nama Digital sekaligus Kode QR berstandar vCard 3.0 yang langsung dikenali kamera iPhone maupun Android untuk menyimpan seluruh data kontak Anda ke buku telepon dalam sekali ketuk.',
      overviewEn:
        'Share your complete contact details at meetings or networking events without typing phone numbers manually. This tool encodes an industry-standard vCard 3.0 QR code and renders an executive digital business card PNG.',
      stepsId: [
        'Isi Nama Lengkap, Nomor HP / WhatsApp, Jabatan/Jurusan, Nama Perusahaan/Kampus, Email, serta Website atau Instagram.',
        'Periksa pratinjau Kartu Nama Digital dan kode QR yang langsung terbentuk secara otomatis.',
        'Klik "Unduh Kartu Nama Digital + QR (PNG)" untuk disimpan di galeri HP atau dicetak.',
        'Anda juga bisa mengunduh gambar QR-nya saja atau file kontak `.VCF` standar.',
      ],
      stepsEn: [
        'Enter your Full Name, Phone/WhatsApp, Role/Title, Company/Campus, Email, Website, and Instagram.',
        'Preview the live executive Digital Business Card and scannable vCard QR code.',
        'Click "Download Business Card + QR (PNG)" to save to your phone gallery or print.',
        'Optionally download the standalone QR PNG or a standard `.VCF` contact file.',
      ],
      tipsId: [
        'Simpan gambar Kartu Nama Digital ini di album Favorit galeri HP Anda agar mudah ditunjukkan kapan saja saat bertemu relasi baru.',
        'Kode QR vCard menyimpan data kontak secara langsung (offline) sehingga tetap bisa di-scan walau tanpa sinyal internet.',
        'Data pribadi Anda tidak pernah dikirim atau disimpan di server mana pun.',
      ],
      tipsEn: [
        'Save the exported Business Card PNG to your phone’s Favorites album for instant sharing in person.',
        'Because vCard QR codes embed contact data directly, they work offline forever and never expire.',
        'Your contact information stays 100% local in your browser.',
      ],
    },
  },
  {
    id: 'teleprompter',
    name: 'Screen Teleprompter & Script Reader',
    nameId: 'Teleprompter Layar HP & Laptop',
    description:
      'Auto-scroll presentation scripts and video talking points smoothly near your camera lens with speed control, eye-line focus guide, mirror mode, and selfie preview.',
    descriptionId:
      'Jalankan teks naskah presentasi atau konten video secara otomatis di layar lengkap dengan pengatur kecepatan baca, garis fokus mata, mode cermin, dan cermin kamera.',
    category: 'text',
    runtime: 'browser',
    path: '/tools/teleprompter',
    keywords: [
      'teleprompter',
      'prompter',
      'presentasi',
      'naskah',
      'script',
      'rekam video',
      'public speaking',
      'tiktok',
      'reels',
    ],
    featured: true,
    guide: {
      overviewId:
        'Sering lupa kalimat atau terlihat melirik ke catatan samping saat merekam video tugas kuliah, presentasi kerja, maupun konten TikTok/Reels? Teleprompter ini menggulirkan naskah Anda secara mulus tepat di layar perangkat lengkap dengan pita "Fokus Baca" di dekat lensa kamera agar tatapan mata Anda tetap terlihat natural.',
      overviewEn:
        'Keep natural eye contact with your camera while recording video assignments, speeches, or social content. This teleprompter smoothly scrolls your script past an eye-line reading band with adjustable speed, font size, mirror mode, and optional selfie camera preview.',
      stepsId: [
        'Ketik atau tempelkan naskah presentasi / video Anda pada kolom editor di sebelah kiri.',
        'Atur kecepatan jalan teks (1x hingga 10x) serta ukuran huruf yang nyaman dibaca dari jarak duduk Anda.',
        'Aktifkan "Cermin Kamera" jika ingin mengecek posisi wajah Anda di dekat teks, atau klik "Layar Penuh" untuk tampilan maksimal.',
        'Klik tombol "Mulai Jalan" dan bacalah baris teks saat melewati pita fokus berwarna biru.',
      ],
      stepsEn: [
        'Type or paste your presentation or video script into the left editor panel.',
        'Adjust the scroll speed (1x–10x) and font size for comfortable reading at your distance.',
        'Optionally toggle "Selfie Cam" to check your framing or enter Fullscreen mode.',
        'Click "Start Scroll" and read along the highlighted eye-line band.',
      ],
      tipsId: [
        'Posisikan jendela browser sedekat mungkin dengan kamera depan HP atau webcam laptop agar gerakan bola mata tidak terlihat membaca teks.',
        'Gunakan fitur "Mode Cermin" (Mirror Flip) jika Anda memantulkan layar HP ke kaca teleprompter fisik.',
        'Naskah dan pratinjau kamera berjalan 100% lokal di perangkat Anda.',
      ],
      tipsEn: [
        'Place the reading band close to your webcam or front phone camera so your gaze looks straight into the lens.',
        'Use "Mirror Flip" when reflecting your phone or tablet screen onto physical teleprompter beam-splitter glass.',
        'Your script and camera preview stay strictly on your device.',
      ],
    },
  },
  {
    id: 'loan-calculator',
    name: 'Loan, KPR & Flat vs Effective Calculator',
    nameId: 'Kalkulator Cicilan, KPR & Bunga',
    description:
      'Simulate monthly installments for KPR mortgages, vehicles, or business loans, compare Flat vs Effective Annuity rates, and inspect the full amortization schedule.',
    descriptionId:
      'Hitung simulasi cicilan bulanan KPR rumah, kredit kendaraan, atau pinjaman lengkap dengan konversi Bunga Flat vs Bunga Efektif serta tabel rincian angsuran.',
    category: 'text',
    runtime: 'browser',
    path: '/tools/loan-calculator',
    keywords: [
      'kalkulator kpr',
      'cicilan',
      'kredit',
      'bunga flat',
      'bunga efektif',
      'anuitas',
      'pinjaman',
      'simulasi kredit',
    ],
    featured: true,
    guide: {
      overviewId:
        'Banyak penawaran kredit kendaraan atau pinjaman mencantumkan angka "Bunga Flat" yang terlihat kecil, padahal jika dihitung secara Bunga Efektif (Anuitas) bebannya hampir dua kali lipat. Kalkulator ini menghitung angsuran bulanan secara akurat untuk sistem Bunga Flat, Anuitas (KPR), maupun Efektif Menurun (Sliding), sekaligus membuka konversi beban bunga sebenarnya.',
      overviewEn:
        'Compare loan offers transparently. Many vehicle or personal loans advertise a low "Flat Interest Rate" whose true effective cost is nearly double. This calculator computes monthly payments across Flat, Annuity (Mortgage), and Sliding methods while revealing the equivalent effective rate and full amortization schedule.',
      stepsId: [
        'Pilih sistem perhitungan bunga: Bunga Flat (kredit motor/mobil), Anuitas (KPR Bank), atau Efektif Menurun.',
        'Masukkan Harga Barang / Plafon Pinjaman serta Uang Muka / DP (isi 0 jika pinjaman tunai tanpa DP).',
        'Pilih Tenor (lama cicilan dalam bulan) dan masukkan persentase suku bunga per tahun.',
        'Lihat estimasi cicilan per bulan, perbandingan ekuivalensi Bunga Flat vs Efektif, tabel rincian angsuran, atau salin ringkasannya ke WhatsApp.',
      ],
      stepsEn: [
        'Select the interest calculation system: Flat Rate, Annuity (Mortgage), or Sliding Rate.',
        'Enter the total asset price / loan amount and optional down payment.',
        'Pick the loan term in months and enter the annual interest percentage.',
        'Review monthly installments, Flat vs Effective rate equivalence, the full monthly amortization table, or copy a summary for WhatsApp.',
      ],
      tipsId: [
        'Perhatikan kotak "Perbandingan Bunga Flat vs Bunga Efektif" sebelum mengambil keputusan kredit agar Anda tahu beban bunga riil per tahunnya.',
        'Klik "Lihat Tabel Rincian Angsuran" untuk melihat porsi pembayaran pokok vs bunga dari bulan ke-1 hingga lunas.',
        'Gunakan tombol "Salin Ringkasan WA" untuk membagikan hasil hitungan ke pasangan atau keluarga.',
      ],
      tipsEn: [
        'Check the Flat vs Effective Equivalence box to compare leasing flat rates fairly against bank annuity loans.',
        'Expand the Monthly Amortization Schedule to see how principal and interest portions shift each month.',
        'Use Copy Summary to paste a clean breakdown directly into WhatsApp.',
      ],
    },
  },
  {
    id: 'discount-calculator',
    name: 'Stacked Discount & Unit Price Comparator',
    nameId: 'Kalkulator Diskon & Bandingkan Harga',
    description:
      'Calculate real prices on stacked store discounts (e.g., 50% + 20% off + tax) and compare supermarket package sizes per 100g/ml to find the cheapest deal.',
    descriptionId:
      'Hitung harga akhir diskon bertingkat (misal 50% + 20% + PPN) secara cepat dan bandingkan harga per 100 gram/ml antar ukuran kemasan saat belanja.',
    category: 'text',
    runtime: 'browser',
    path: '/tools/discount-calculator',
    keywords: [
      'diskon',
      'kalkulator diskon',
      '50%+20%',
      'belanja',
      'minimarket',
      'bandingkan harga',
      'ppn',
      'hemat',
    ],
    featured: true,
    guide: {
      overviewId:
        'Saat belanja di mall, minimarket, atau marketplace, kita sering menjumpai promo diskon bertingkat seperti "Diskon 50% + 20%" atau bingung memilih apakah kemasan besar benar-benar lebih murah daripada beli dua kemasan kecil. Alat ini memiliki 2 mode praktis untuk menghitung harga bayar diskon bertingkat sekaligus membandingkan harga satuan per 100g/ml atau per pcs.',
      overviewEn:
        'Quickly decode "50% + 20% off" stacked retail promotions and compare different package sizes at the supermarket to see which option actually costs less per 100g, 100ml, or piece.',
      stepsId: [
        'Pilih tab "Hitung Diskon Bertingkat" untuk memasukkan harga awal, diskon pertama (%), diskon kedua (+%), potongan voucher, serta opsi pajak PPN 11%.',
        'Atau pilih tab "Bandingkan Harga Minimarket" untuk membandingkan 2 hingga 4 ukuran produk.',
        'Masukkan Harga (Rp) dan Berat/Isi Bersih (gram, ml, atau pcs) masing-masing kemasan.',
        'Produk yang paling menguntungkan akan langsung ditandai dengan lencana hijau "PALING HEMAT" beserta persentase selisih penghematannya.',
      ],
      stepsEn: [
        'Use the "Double Discount & Tax" tab to enter original price, first discount (%), second stacked discount (+%), voucher off, and optional 11% VAT.',
        'Or switch to "Compare Unit Value" to compare 2 to 4 package sizes side-by-side.',
        'Enter each item’s price and net weight/volume (grams, ml, or pieces).',
        'The cheapest unit cost is automatically highlighted with a green "BEST VALUE" badge and exact savings percentage.',
      ],
      tipsId: [
        'Ingat: Diskon 50% + 20% bukan berarti diskon 70%, melainkan 50% terlebih dahulu lalu dipotong 20% dari sisa harganya (setara 60%).',
        'Saat di supermarket, kemasan jumbo kadang justru lebih mahal per 100ml jika kemasan sedang sedang ada promo potongan harga.',
        'Buka alat ini langsung dari layar utama HP (PWA) saat sedang berbelanja.',
      ],
      tipsEn: [
        'Remember: 50% + 20% off equals 60% total off, because the second discount applies to the already-discounted subtotal.',
        'In supermarkets, medium packages on promo often beat bulk family packs on price per 100g/ml.',
        'Add Ditya Tools to your phone Home Screen for one-tap access while shopping.',
      ],
    },
  },
  {
    id: 'youtube-downloader',
    name: 'YouTube Video & Audio Saver',
    nameId: 'Pengunduh Video & Audio YouTube',
    description:
      'Analyze and save authorized YouTube videos up to 4K MP4 or extract high-bitrate MP3/M4A audio tracks using your device companion service.',
    descriptionId:
      'Analisis dan simpan video YouTube berizin hingga resolusi 4K MP4 atau ambil audionya saja dalam format MP3/M4A jernih melalui layanan pendamping perangkat.',
    category: 'media',
    runtime: 'local-service',
    path: '/tools/youtube-downloader',
    keywords: [
      'youtube',
      'video',
      'audio',
      'download',
      'mp3',
      'mp4',
      'unduh youtube',
    ],
    featured: true,
    guide: {
      overviewId:
        'Alat ini membantu Anda mengunduh video atau mengekstrak audio dari tautan YouTube yang Anda miliki izinnya untuk disimpan secara offline. Berbeda dengan situs downloader umum yang penuh pop-up iklan berbahaya dan membatasi kualitas video, alat ini memproses unduhan langsung melalui layanan pendamping di perangkat Anda sendiri.',
      overviewEn:
        'Save authorized YouTube videos or extract clean audio tracks for offline use without shady pop-up ads or artificial quality caps. Processing is handled directly through the companion service on your device.',
      stepsId: [
        'Pastikan status Layanan Pendamping Perangkat di bagian atas sudah terhubung.',
        'Tempelkan tautan video YouTube pada kolom URL lalu klik tombol "Analisis".',
        'Pilih mode unduhan: "Video (MP4)" beserta resolusi yang tersedia (360p hingga 4K 2160p), atau "Audio Saja" dalam format MP3 / M4A.',
        'Klik tombol unduh dan tunggu hingga file selesai disiapkan dan tersimpan ke perangkat Anda.',
      ],
      stepsEn: [
        'Verify that the Device Companion status banner at the top shows connected.',
        'Paste a single YouTube video URL into the input field and click Analyze.',
        'Select your mode: "Video (MP4)" with your preferred resolution (up to 4K 2160p) or "Audio Only" in MP3 / M4A.',
        'Click Download and wait for the file to be prepared and saved to your device.',
      ],
      tipsId: [
        'Resolusi tinggi (1080p, 1440p, dan 4K) otomatis menggabungkan stream video dan audio terbaik tanpa penurunan kualitas.',
        'Hanya gunakan alat ini untuk konten milik Anda sendiri, materi Creative Commons, atau video yang Anda miliki izin unduhnya.',
        'Jika Anda sedang membuka dari HP tanpa aplikasi pendamping, gunakan fitur-fitur berlabel "Berjalan di Browser".',
      ],
      tipsEn: [
        'High resolutions (1080p, 1440p, and 4K) automatically merge the highest quality video and audio streams.',
        'Only download content that you own, Creative Commons material, or media you have permission to save.',
        'If browsing on mobile without the desktop companion, explore our "Runs in browser" utilities.',
      ],
    },
  },
  {
    id: 'media-converter',
    name: 'Media Clipper & Converter',
    nameId: 'Pemotong & Konverter Video/Audio',
    description:
      'Trim start/end timestamps, compress large videos for WhatsApp, convert formats (MP4, WebM, GIF), or extract MP3/WAV audio locally.',
    descriptionId:
      'Potong durasi awal/akhir video atau audio, perkecil ukuran video agar muat dikirim di WhatsApp, ubah format (MP4, WebM, GIF), atau ekstrak suara MP3.',
    category: 'media',
    runtime: 'local-service',
    path: '/tools/media-converter',
    keywords: [
      'ffmpeg',
      'video',
      'audio',
      'convert',
      'trim',
      'clip',
      'mp4',
      'mp3',
      'gif',
      'compress',
      'potong video',
    ],
    featured: true,
    guide: {
      overviewId:
        'Mengunggah video berukuran ratusan megabyte ke situs konverter online memakan kuota besar dan waktu lama. Alat ini memanfaatkan mesin pemrosesan media di perangkat Anda untuk memotong klip pada detik tertentu, mengompres ukuran video, mengubah potongan video menjadi animasi GIF, atau mengambil suara MP3 dari file video dalam sekejap.',
      overviewEn:
        'Uploading hundreds of megabytes of video to cloud converters wastes bandwidth and time. This utility uses your device companion engine to trim clips by timestamp, compress video size, turn clips into looping GIFs, or extract MP3/M4A/WAV audio locally.',
      stepsId: [
        'Pilih file video atau audio dari perangkat Anda (mendukung MP4, MKV, MOV, WebM, MP3, WAV, M4A).',
        'Pilih format hasil akhir yang diinginkan (MP4, WebM, MP3, M4A, WAV, atau animasi GIF).',
        'Untuk output video, pilih tingkat kompresi (Kualitas Tinggi, Seimbang, atau Ringkas untuk kirim chat).',
        'Jika ingin memotong durasi, isi waktu mulai dan waktu selesai (format MM:SS seperti 00:15 ke 01:05), lalu klik "Konversi & Simpan".',
      ],
      stepsEn: [
        'Select a video or audio file from your computer (supports MP4, MKV, MOV, WebM, MP3, WAV, M4A).',
        'Choose your target output format (MP4, WebM, MP3, M4A, WAV, or animated GIF).',
        'For video outputs, pick a compression preset (High Quality, Balanced, or Compact for chat sharing).',
        'Optionally enter start and end timestamps (e.g., 00:15 to 01:05) to trim the clip, then click Convert & Save.',
      ],
      tipsId: [
        'Gunakan preset "Ringkas (Compact)" saat video rekaman HP terlalu besar untuk dikirim lewat WhatsApp atau Discord.',
        'Pilih format output "MP3 Audio" jika Anda hanya ingin mengambil lagu atau rekaman suara dari sebuah file video.',
        'Kosongkan kolom waktu mulai dan selesai jika Anda ingin mengonversi keseluruhan durasi file.',
      ],
      tipsEn: [
        'Use the "Compact" preset when a phone recording is too large to send over WhatsApp or Discord.',
        'Pick "MP3 Audio" as the output format to extract just the soundtrack or voice track from a video file.',
        'Leave the start and end time fields empty to convert the entire duration of the file.',
      ],
    },
  },
]