# Domino — Meja Teman

Game domino sambung online untuk 2–4 pemain, menggunakan Cloudflare Workers dan Durable Objects dengan penyimpanan SQLite yang mendukung Workers Free.

[Publikasikan ke Cloudflare](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Fyanganulpmoa-lab%2Fdomino-online)

## Publikasi gratis

Buka tautan di atas, login Cloudflare, pilih akun dengan Workers Free, lalu ikuti proses deploy. Domain workers.dev disediakan Cloudflare, tidak perlu membeli domain. Jika diminta menghubungkan GitHub, batasi akses ke repositori domino-online. Jangan aktifkan paket berbayar.

Konfigurasi wrangler.jsonc membuat Worker, aset halaman, dan binding ROOMS otomatis. Build tidak diperlukan; perintah deploy: npx wrangler deploy.

Kuota gratis tetap berlaku. Polling dilakukan setiap 4 detik saat tab aktif. Room kedaluwarsa 7 hari setelah aksi terakhir (buat/gabung/mulai/main/ambil/lewati), bukan setelah polling. Kode room 12 karakter. Simpan tab untuk kembali ke kursi yang sama; keluar tampilan tidak menghapus kursi. Host bisa memulai ronde baru setelah ronde selesai.

## Pengembangan

Gunakan Node.js 22 atau lebih baru. Jalankan npm install, npm test, kemudian npm run dev. Tampilan Cloudflare berada di public/index.html, aturan di src/game.js, server di src/worker.js.

server.py dan index.html di direktori utama adalah versi Python lokal terdahulu; render.yaml hanya alternatif Render. Deploy Cloudflare tidak memakai file tersebut.
