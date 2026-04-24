<div align="center">

<br/>

# 📚 Kütüphane Yönetim Sistemi

**Kitaplar · Ödünç İşlemleri · Öğrenciler — Hepsi Tek Panelde**

<br/>

<table>
  <tr>
    <td width="33.33%" valign="top"><img src="https://i.imgur.com/yzpzLG8.png" alt="Önizleme 1" width="100%" /></td>
    <td width="33.33%" valign="top"><img src="https://i.imgur.com/b00KBgV.png" alt="Önizleme 2" width="100%" /></td>
    <td width="33.33%" valign="top"><img src="https://i.imgur.com/FKuvNvZ.png" alt="Önizleme 3" width="100%" /></td>
  </tr>
</table>

</div>

---

## ❓ Ne bu?

**Kütüphane Yönetim Sistemi**, okul kütüphanelerinde kitap envanteri, ödünç verme / iade, öğrenci kayıtları ve temel raporlamayı tek bir web arayüzünde toplar.  
Okul bazlı veri modeli, rol tabanlı erişim ve JWT ile oturum yönetimi içerir.

---

## ✨ Öne Çıkan Özellikler

- 📦 **Kitap yönetimi** — ekleme, liste, barkod / raf ataması, müsaitlik durumu, kayıp işaretleme  
- 🔄 **Ödünç işlemleri** — öğrenci + kitap seçimi, süre takibi, uzatma ve iade  
- 🧑‍🎓 **Öğrenciler** — hızlı arama, yönetim işlemleri
- ⚙️ **Okul ayarları** — okul logosu, varsayılan ödünç günü, raf etiketleri, uzatma limiti vb
- 📜 **Aktivite logları** — detaylı işlem geçmişi (kim, ne zaman, ne yaptı?)  
- 👑 **Platform (super admin)** — okul yönetimi, okul başvurularının (`/basvuru` formu ile) incelenmesi ve değerlendirilmesi

---

## 👥 Roller (Özet)

| Rol | Panel erişimi |
|:---|:---|
| **super_admin** | Tüm platform; okul yönetimi ve okul başvuruları dahil herşeye erişebilir |
| **school_admin** | Kendi okulunun tüm modüllerine + okul ayarları + görevliler modülüne erişebilir |
| **staff** | Kitap / ödünç / öğrenci modüllerine erişebilir |

---

## 💻 Kullanılan Teknolojiler

```
Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · MongoDB (Mongoose)
jose (JWT) · bcryptjs · Zod · Framer Motion · Recharts · next-themes
```

---

## 🚀 Kurulum ve Çalıştırma

**Gereksinimler:** Node.js 20+, çalışan bir MongoDB bağlantısı.

1. Bağımlılıklar

```bash
npm install
```

2. Ortam değişkenleri — proje kökünde `.env`:

| Değişken | Zorunlu | Açıklama |
|:---|:---:|:---|
| `MONGODB_URI` | ✓ | MongoDB connection string |
| `JWT_SECRET` | ✓ | **En az 32 karakter** (HS256 imza) |
| `SUPER_ADMIN_USERNAME` | | İlk kurulumda tek seferlik super admin oluşturmak için |
| `SUPER_ADMIN_PASSWORD` | | Yukarıdaki kullanıcı ile birlikte |
| `SUPER_ADMIN_EMAIL` | | İsteğe bağlı |

3. Geliştirme sunucusu

```bash
npm run dev
```

Varsayılan giriş: [`/giris`](http://localhost:3000/giris) · Ana sayfa `/` → `/giris` yönlendirmesi yapar.

**Üretim**

```bash
npm run build
npm start
```

---

## 🛠️ Temel Komutlar

| Komut | |
|:---|:---|
| `npm run dev` | Geliştirme |
| `npm run build` | Üretim derlemesi |
| `npm start` | Üretim sunucusu |
| `npm run lint` | ESLint |

---

## 📂 Proje Yapısı

```
src/
├── app/                 # App Router — sayfalar + route handlers
│   ├── api/             # REST uçları (auth, books, loans, students, …)
│   ├── giris/           # Oturum açma
│   ├── basvuru/         # Okul başvuru formu (herkese açık)
│   └── panel/           # Yetkili panel arayüzü
├── components/          # Ortak UI (sidebar, tema, …)
├── lib/                 # DB, auth, yardımcılar
├── models/              # Mongoose şemaları
└── middleware.ts        # /panel/* JWT doğrulama + rol kısıtları
```

---

## 📞 İletişim

Herhangi bir sorunuz, öneriniz veya projenin kurulumu/kullanımı hakkında yardıma ihtiyacınız olursa benimle [Instagram üzerinden](https://instagram.com/cinarxkn) iletişime geçebilirsiniz. 💬✨
