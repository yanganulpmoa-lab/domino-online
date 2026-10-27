# Domino — Meja Teman

Domino online untuk tepat 2 atau 4 pemain di Cloudflare Workers Free dan Durable Objects SQLite.

## Aturan terbaru

- Semua 28 kartu dibagikan habis: 14 kartu per orang untuk 2 pemain, atau 7 kartu untuk 4 pemain.
- Pemilik balak 5 selalu membuka dan wajib memasangkan balak 5. Tidak ada dadu.
- Setiap giliran 20 detik, dihitung server. Jika tidak ada kartu cocok, server otomatis melewati giliran tanpa menunggu timer.
- Waktu habis berarti lewat. Khusus pembuka, balak 5 otomatis dipasang saat waktu habis agar ronde dapat dimulai.
- Hanya kartu yang dapat dimainkan yang menyala. Seret kartu ke ujung meja yang disorot. Klik kartu lalu klik ujung meja juga didukung untuk keyboard/sentuhan.
- Tidak ada stok atau ambil kartu. Kartu habis lebih dulu menang; jika semua buntu, jumlah titik terendah menang (seri diperbolehkan).
- Timer dijalankan Durable Object Alarm meski tab ditutup. Room kedaluwarsa 7 hari setelah aksi pemain terakhir. Pemain yang keluar tetap memiliki kursi; simpan tab untuk melanjutkan sesi.

## Publikasi

[Deploy ke Cloudflare](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Fyanganulpmoa-lab%2Fdomino-online)

Pilih Workers Free. Tidak perlu membeli domain; gunakan workers.dev. Kuota paket gratis tetap berlaku. Untuk pembaruan otomatis, hubungkan repositori yang sama ke Worker dengan branch main dan deploy command npx wrangler deploy.

## Pengembangan

Node.js 22 atau lebih baru. Jalankan npm install, npm test, lalu npm run dev. npm run deploy memublikasikan ke akun Cloudflare yang sudah login.

public/ berisi antarmuka dan kartu berbasis CSS. src/game.js berisi aturan dan timer, src/worker.js berisi server serta penyimpanan room. Pengujian ada di tests/. server.py dan index.html di root adalah versi Python terdahulu; tidak dipakai Cloudflare. render.yaml hanya konfigurasi hosting alternatif lama.

Buat room baru setelah pembaruan aturan, terutama untuk room lama yang dibuka dengan dadu.
