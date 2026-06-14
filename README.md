# Gallery Foto

Website gallery foto dengan desain responsif dan fitur lightbox interaktif.

## Fitur

- **Grid Responsif** - Layout grid yang menyesuaikan ukuran layar (desktop, tablet, mobile)
- **Filter Kategori** - Filter foto berdasarkan kategori (Alam, Kota, Orang)
- **Lightbox** - Lihat foto dalam mode layar penuh dengan navigasi
- **Navigasi Keyboard** - Gunakan panah kiri/kanan untuk navigasi, Escape untuk menutup
- **Animasi** - Efek hover dan transisi yang halus
- **Lazy Loading** - Gambar dimuat secara bertahap untuk performa optimal

## Cara Penggunaan

1. Buka file `index.html` di browser
2. Klik tombol kategori untuk memfilter foto
3. Klik foto untuk membuka lightbox
4. Gunakan tombol panah atau keyboard untuk navigasi antar foto

## Struktur File

```
.
├── index.html          # Halaman utama
├── css/
│   └── style.css       # Stylesheet
├── js/
│   └── main.js         # JavaScript interaktif
├── images/             # Folder untuk gambar lokal
└── README.md           # Dokumentasi
```

## Teknologi

- HTML5
- CSS3 (Grid, Flexbox, Custom Properties, Animations)
- Vanilla JavaScript (ES6+)
- Responsive Design (Mobile-first approach)

## Kustomisasi

### Menambah Foto Baru

Tambahkan elemen berikut ke dalam `.gallery__grid`:

```html
<div class="gallery__item" data-category="nature">
    <img src="path/ke/foto.jpg" alt="Deskripsi foto" loading="lazy">
    <div class="gallery__overlay">
        <h3>Judul Foto</h3>
        <p>Deskripsi singkat</p>
    </div>
</div>
```

### Menambah Kategori Baru

1. Tambahkan tombol filter baru di bagian `.filters`:
```html
<button class="filters__btn" data-filter="kategori-baru">Nama Kategori</button>
```

2. Gunakan `data-category="kategori-baru"` pada item gallery yang sesuai.
