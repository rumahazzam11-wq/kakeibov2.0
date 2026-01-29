# Kakeibo Tracker - Progressive Web App

Aplikasi pelacak keuangan pribadi menggunakan metode Kakeibo Jepang dengan 4 kategori pengeluaran yang mindful.

## ✨ Fitur Utama

### 📱 9 Screens Lengkap
1. **Onboarding** - Setup awal pendapatan dan target
2. **Home/Dashboard** - Ringkasan bulan berjalan dengan quick actions
3. **Transaksi** - Daftar semua transaksi dengan filter
4. **Ringkasan** - Breakdown detail per kategori Kakeibo
5. **Riwayat** - Perbandingan bulan-bulan sebelumnya
6. **Pengaturan** - Konfigurasi aplikasi
7. **Tambah Transaksi** (Modal) - Form input cepat
8. **Refleksi Bulanan** (Modal) - 4 pertanyaan Kakeibo
9. **Detail Kategori** - Deep dive per kategori

### 💰 4 Kategori Kakeibo
- 🛒 **Kebutuhan** - Kebutuhan dasar (groceries, utilities, transport)
- ❤️ **Keinginan** - Hiburan dan keinginan pribadi (cafe, hobbies)
- 📚 **Budaya** - Pendidikan dan pengembangan diri (books, courses)
- ⚠️ **Tak Terduga** - Pengeluaran darurat dan tidak terencana

### 🎨 Design Features
- iOS-style mobile design
- Portrait orientation (9:16)
- One-handed usage optimized
- Smooth animations & transitions
- Dark mode support (CSS variables)
- Responsive untuk semua screen sizes

### 💾 Data Management
- LocalStorage untuk persistence
- Tidak perlu backend/database
- Data tersimpan di browser
- Export/import (future feature)

### 🇮🇩 Localization
- Full Bahasa Indonesia
- Format Rupiah dengan separator titik (Rp 10.000.000)
- Tanggal format Indonesia

## 🚀 Cara Menjalankan

### Method 1: Direct Open
1. Buka file `index.html` di browser modern (Chrome, Firefox, Safari, Edge)
2. Aplikasi langsung berjalan!

### Method 2: Local Server
```bash
# Menggunakan Python
python -m http.server 8000

# Menggunakan PHP
php -S localhost:8000

# Menggunakan Node.js (http-server)
npx http-server -p 8000
```

Kemudian buka browser: `http://localhost:8000`

### Method 3: Live Server (VS Code)
1. Install extension "Live Server"
2. Right-click `index.html` → "Open with Live Server"

## 📱 Install sebagai PWA

Karena menggunakan manifest.json, aplikasi bisa di-install sebagai Progressive Web App:

### Di Mobile (Android/iOS):
1. Buka di browser
2. Tap menu (⋮) → "Add to Home Screen" / "Install App"
3. Icon akan muncul di home screen seperti native app!

### Di Desktop (Chrome):
1. Buka aplikasi
2. Klik icon install (➕) di address bar
3. Atau: Menu → "Install Kakeibo Tracker"

## 📁 Struktur File

```
Kekaibo/
├── index.html       # HTML structure & navigation
├── styles.css       # iOS-style design system
├── app.js           # Full app logic & state management
├── manifest.json    # PWA configuration
└── README.md        # Dokumentasi ini
```

## 💡 User Flow

### First Time Setup
1. Buka aplikasi → Onboarding screen
2. Input pendapatan bulanan
3. Set target tabungan
4. Input pengeluaran tetap
5. Tap "Mulai" → Dashboard

### Daily Usage
1. **Tambah Pengeluaran**: Home → "Tambah Pengeluaran" → Pilih kategori → Simpan
2. **Tambah Pemasukan**: Home → "Tambah Pemasukan" → Simpan
3. **Lihat Ringkasan**: Tab "Ringkasan" → Lihat breakdown per kategori
4. **Refleksi**: Ringkasan → "Refleksi Bulanan" → Jawab pertanyaan ke-4

### End of Month
1. Buka tab "Ringkasan"
2. Review breakdown kategori
3. Tap "Refleksi Bulanan"
4. Baca 3 jawaban otomatis
5. Tulis rencana perbaikan untuk bulan depan
6. Simpan refleksi

## 🔒 Privacy & Security

- ✅ **100% Offline** - Semua data tersimpan lokal di browser Anda
- ✅ **No Tracking** - Tidak ada analytics atau tracking
- ✅ **No Server** - Tidak ada pengiriman data ke server
- ✅ **Open Source** - Kode transparan dan bisa di-audit

## 🛠️ Technology Stack

- **HTML5** - Semantic structure
- **CSS3** - Modern styling dengan CSS custom properties
- **Vanilla JavaScript** - No frameworks, pure JS
- **LocalStorage API** - Data persistence
- **PWA** - Progressive Web App dengan manifest.json

## 📊 Data Format

Data tersimpan di LocalStorage dengan struktur:

```javascript
{
  onboardingComplete: true,
  months: {
    "2024-01": {
      income: 10000000,
      savingsTarget: 3000000,
      fixedExpenses: 2000000,
      transactions: [
        {
          id: "1706...",
          type: "expense",
          category: "kebutuhan",
          amount: 350000,
          description: "Belanja Mingguan",
          date: "2024-01-28"
        }
      ],
      reflection: "Rencana perbaikan..."
    }
  }
}
```

## 🎯 Future Enhancements

- [ ] Export data ke CSV/JSON
- [ ] Import data dari file
- [ ] Chart visualization (pie chart, bar chart)
- [ ] Budget alerts & notifications
- [ ] Recurring transactions
- [ ] Multiple currency support
- [ ] Dark mode toggle
- [ ] Backup & restore to cloud (optional)

## 📝 4 Pertanyaan Kakeibo

1. **Berapa banyak uang yang Anda miliki?** (Auto-calculated: Sisa uang)
2. **Berapa banyak uang yang ingin Anda tabung?** (Auto-filled: Target Anda)
3. **Berapa banyak uang yang Anda keluarkan?** (Auto-calculated: Total pengeluaran)
4. **Bagaimana Anda bisa meningkat?** (User input: Refleksi pribadi)

## 🌟 Philosophy

Kakeibo adalah metode budgeting Jepang yang menekankan **mindfulness** dalam pengeluaran. Dengan mencatat setiap transaksi dan merefleksikannya, Anda menjadi lebih sadar akan pola keuangan dan bisa membuat keputusan yang lebih baik.

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Aplikasi ini open source! Silakan fork, modify, dan improve sesuai kebutuhan Anda.

## 📄 License

MIT License - Free to use, modify, and distribute.

---

**Made with ❤️ using Japanese wisdom of Kakeibo**

🏮 Start your mindful money journey today!
