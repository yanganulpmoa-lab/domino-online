# Domino — Meja Teman

Game domino sambung untuk 2–4 pemain, tanpa paket Python tambahan.

## Jalankan

Di folder ini jalankan `python server.py`, kemudian buka http://localhost:8787.
Untuk komputer ini jika perintah python tidak aktif, gunakan:

    & 'D:\DASHBOARD PLN\dashboard-pelanggan\dashboard-pelanggan\.venv\Scripts\python.exe' 'D:\DOMINO\server.py'

Host membuat room dan membagikan tautan atau kode kepada teman. Teman pada jaringan yang sama memakai alamat IP komputer server dan port 8787, bukan localhost. Akses jaringan bergantung pada pengaturan firewall komputer.

## Hosting

render.yaml menyiapkan layanan Render dengan plan free. Publikasi belum dilakukan; perlu akun hosting dan repositori sumber. Jangan pilih paket berbayar. Room hanya berada di memori dan hilang ketika server dimulai ulang. Server bawaan ini untuk permainan ringan bersama teman.

## Aturan

Setiap pemain mendapat 7 kartu. Host mulai pertama. Sambungkan angka pada ujung meja; ambil stok jika tidak punya kartu cocok, atau lewati jika stok habis. Kartu habis menang. Jika semua pemain tidak bisa jalan, jumlah titik paling kecil menang (seri diperbolehkan). Host bisa memulai ronde baru. Keluar tampilan tidak menghapus kursi pemain; tidak ada pengambilalihan otomatis jika pemain terputus.
