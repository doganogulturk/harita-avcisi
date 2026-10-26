# Harita Avcısı

Sorulan ili, plakayı, ülkeyi, bayrağı ya da başkenti haritada bul. Türkiye'nin 81 ili ve dünyanın 179 ülkesiyle,
tek başına ya da arkadaşlarınla oynanan bir harita oyunu.

**Oyna:** [haritaavcisi.com](https://haritaavcisi.com)

## Oyunlar

Ana ekranda iki yol var:

- **Tek başıma**
  - **Yarış:** 10 soru, 120 saniye. Skorun sıralamaya işlenir.
  - **Antrenman:** Süre ve giriş yok. İstediğin kadar oyna, dünyayı ya da kıtaları tek tek çalış.
- **Arkadaşlarımla**
  - **Düello:** Bir arkadaşına kod gönder, aynı sorulara aynı anda cevap verin.
  - **Oda:** Bir grupla birkaç tur boyunca yarışın, oda sıralamasında kim önde görün.

Her oyunda Türkiye (il adı ya da plaka) veya Dünya (ülke adı, bayrak ya da başkent) haritası seçilebilir. Türkiye,
Plaka, Dünya, Bayrak ve Başkent'in her birinin kendi sıralaması vardır. Her gün bu beş mod için ayrıca bir **günün
meydan okuması** var.

## Öne çıkanlar

- **Türkçe ve İngilizce:** Oyun cihazın diliyle açılır, hesap menüsünden değiştirilebilir. Ülke ve başkent adları,
  rozetler, paylaşım metinleri, sunucu mesajları ve yasal sayfalar da iki dilde (KVKK metninin İngilizcesi bilgi amaçlı
  çeviri; esas metin Türkçe).
- **Sade ana ekran:** İki kart: Tek başıma ve Arkadaşlarımla; her kartın alt köşelerinde grubun iki oyunu (Yarış,
  Antrenman · Düello, Oda) tek dokunuşla açılır. Davet kodu doğrudan Arkadaşlarımla kartına yazılır; kodun düello mu oda
  mı olduğunu oyun kendisi bulur. Ayar ekranında oyun, harita ve soru tipi alt alta durur; altında seçimlere göre
  haritada canlı bir önizleme döner ("🏛️ Kanberra hangi ülke?" → Avustralya yeşil yanar).
- **Başkentler:** Ekrana başkent gelir, sen ülkesini bulursun; cevaptan sonra ülkenin adı da yazar. 174 ülke (başkenti
  tartışmalı olanlar ve bağlı topraklar yok), Türkçe yazımla (Pekin, Moskova, Varşova).
- **Günün meydan okuması:** Her gün beş mod için herkese aynı 10 soru, günde bir hak, günlük sıralama, gün serisi ve
  paylaşılabilir sonuç (🟩🟥 kareleriyle). Başlıktaki 🔥 rozetinden açılır.
- **Rozetler:** Gün serisi, kusursuz turlar, 81 il, 100 ülke, düello galibiyetleri, kürsü ve zirve gibi 17 başarı; yeni
  rozet sonuç ekranında kutlanır.
- **Profil:** Yarış özeti, rozetler, düello galibiyet ve mağlubiyetleri (kiminle, hangi modda, ne zaman), sıralamalardaki
  yerin ve son turların. Profili yalnızca sen görürsün.
- **Adil sıralama:** Yarışın soruları sunucuda seçilir ve skor bu sorulara göre doğrulanır; süreyi de sunucu ölçer.
- **Öğreten harita:** Yanlış cevapta tıklanan yerin adı yazar; doğru yer küçükse (Malta, Dominika) harita oraya
  yakınlaşır. Tur sonunda soru soru döküm görünür.
- **Telefonda dikey ve yatay:** Bütün ekranlar ve oyunlar dikeyde de oynanır. Dikeyde ilk oyundan önce yan çevirmeyi
  ve iki parmakla yakınlaştırmayı gösteren kısa bir ipucu açılır; yatayda harita iki kat büyür.
- **Ana ekranda canlı bilgi:** Tek başıma kartında Türkiye'nin ve Dünya'nın birincisi; sıralama telefonda alttan açılır.

## Nerede oynanır

- **Web:** Tarayıcıdan, kurulum gerekmeden. Ana ekrana uygulama olarak da eklenebilir.
- **Android:** Google Play'de kapalı testte. Yayındaki sürüm, yukarıdaki son özelliklerden önceki sürümdür.
- **iOS:** Hazırlanıyor.

Google hesabınla ya da misafir olarak giriş yapabilirsin; antrenman için giriş gerekmez.

## Yol haritası

Sıradaki işler, öncelik sırasıyla:

1. **Android'in yeni sürümü:** Sürüm kodunu artırıp `npm run android:release` ile derlemek ve Google Play'e yüklemek.
   Mağaza sayfasındaki açıklamayı (başkentler, günün meydan okuması, rozetler, profil) ve ekran görüntülerini (yeni ana
   ekran, başkent sorusu) güncellemek; İngilizce mağaza sayfası eklemek; hesap silme talimatlarını yeni hesap menüsüne
   göre düzeltmek.
2. **Yeni içerik:** Türkiye'de bölgeler ve komşu iller (il haritasıyla).

Teknik işler:

- Android'in yeni sürümü yayıldıktan 2–3 hafta sonra eski tur açma yolunu (`start_round`) kapatmak; skor doğrulaması o
  zaman bütün turlarda geçerli olur.
- Supabase'de çalıştırılmış tek seferlik geçiş dosyalarını (`supabase/2026-10-*.sql`) kaldırmak; kalıcı tanım
  `supabase/schema.sql`'dedir.
- Ana sayfa bileşeninin (`app/page.tsx`) sadeleştirilmesi.

Sonraya bırakılan fikirler: karanlık tema, misafir hesabı Google hesabına bağlama, profilde zayıf yerlere özel
antrenman.

## Geliştirme

Oyunun saf mantığı, veri bütünlüğü ve sunucu fonksiyonları için otomatik testler var (`npm test`): sunucu testleri
`supabase/schema.sql`'i bellekte çalışan bir PostgreSQL'e yükleyip puan doğrulamasını, günlük meydan okumayı, başkent
havuzunu, kod alanını ve rozetleri dener. Kurulum ve ayrıntılar: [docs/GELISTIRME.md](docs/GELISTIRME.md)

## Yasal

[Gizlilik Politikası](https://haritaavcisi.com/gizlilik) ·
[KVKK Aydınlatma Metni](https://haritaavcisi.com/kvkk) ·
[Kullanım Koşulları](https://haritaavcisi.com/kullanim-kosullari) ·
[Hesap Silme](https://haritaavcisi.com/hesap-silme)

Site çerezsiz, anonim ziyaret istatistiği tutar (Vercel Web Analytics); iOS ve Android uygulamalarında analitik yok.
