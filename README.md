# Domino — Meja Teman

Game domino sambung online untuk 2 atau 4 pemain, menggunakan Cloudflare Workers dan Durable Objects dengan penyimpanan SQLite yang mendukung Workers Free.

[Publikasikan ke Cloudflare](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Fyanganulpmoa-lab%2Fdomino-online)

## Publikasi gratis

Buka tautan di atas, login Cloudflare, pilih akun dengan Workers Free, lalu ikuti proses deploy. Domain workers.dev disediakan Cloudflare, tidak perlu membeli domain. Jika diminta menghubungkan GitHub, batasi akses ke repositori domino-online. Jangan aktifkan paket berbayar.

Konfigurasi wrangler.jsonc membuat Worker, aset halaman, dan binding ROOMS otomatis. Build tidak diperlukan; perintah deploy: npx wrangler deploy.

Kuota gratis tetap berlaku. Polling dilakukan setiap 1,5 detik saat tab aktif. Room kedaluwarsa 7 hari setelah aksi terakhir (buat/gabung/mulai/main/ambil/lewati), bukan setelah polling. Kode room 12 karakter. Simpan tab untuk kembali ke kursi yang sama; keluar tampilan tidak menghapus kursi. Host bisa memulai ronde baru setelah ronde selesai.

## Pengembangan

Gunakan Node.js 22 atau lebih baru. Jalankan npm install, npm test, kemudian npm run dev. Tampilan Cloudflare berada di public/index.html, aturan di src/game.js, server di src/worker.js.

server.py dan index.html di direktori utama adalah versi Python lokal terdahulu; render.yaml hanya alternatif Render. Deploy Cloudflare tidak memakai file tersebut.

## Aturan ronde

Hanya 2 atau 4 pemain. Semua 28 kartu dibagikan habis (14 atau 7 per pemain), tanpa stok atau ambil kartu. Dadu acak 1–6 berputar di awal setiap ronde. Pemilik balak sesuai hasil dadu wajib membuka dengan balak itu. Tidak dapat bermain berarti lewati giliran; server menolak lewat jika masih ada kartu cocok. Kartu habis pertama menang; jika semua buntu, total titik terendah menang.
