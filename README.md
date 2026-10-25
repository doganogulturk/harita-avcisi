# Harita Avcısı

Sorulan ili, plakayı, ülkeyi ya da bayrağı haritada bul. Türkiye'nin 81 ili ve dünyanın 179 ülkesiyle, tek başına
ya da arkadaşlarınla oynanan bir harita oyunu.

**Oyna:** [haritaavcisi.com](https://haritaavcisi.com)

## Oyunlar

- **Yarış:** 10 soru, 120 saniye. Skorun sıralamaya işlenir.
- **Antrenman:** Süre ve giriş yok. İstediğin kadar oyna, dünyayı ya da kıtaları tek tek çalış.
- **Düello:** Bir arkadaşına kod gönder, aynı sorulara aynı anda cevap verin.
- **Oda:** Bir grupla birkaç tur boyunca yarışın, oda sıralamasında kim önde görün.

Her oyunda Türkiye (il adı ya da plaka) veya Dünya (179 ülkenin tamamı; ülke adı ya da bayrak) haritası seçilebilir.
Türkiye, Plaka, Dünya ve Bayrak'ın her birinin kendi sıralaması vardır.

## Öne çıkanlar

- **Telefonda dikey ve yatay:** Bütün ekranlar ve oyunlar dikeyde de oynanır. Dikeyde ilk oyundan önce yan çevirmeyi
  ve iki parmakla yakınlaştırmayı gösteren kısa bir ipucu açılır; yatayda harita iki kat büyür.
- **Öğreten harita:** Yanlış cevapta tıklanan yerin adı yazar; doğru yer küçükse (Malta, Dominika) harita oraya
  yakınlaşır. Tur sonunda soru soru döküm görünür.
- **Profil:** Yarış özeti, düello galibiyet ve mağlubiyetleri (kiminle, hangi modda, ne zaman), sıralamalardaki yerin
  ve son turların. Profili yalnızca sen görürsün.
- **Adil sıralama:** Yarışın soruları sunucuda seçilir ve skor bu sorulara göre doğrulanır; süreyi de sunucu ölçer.
- **Günün meydan okuması:** Her gün Türkiye, Plaka, Dünya ve Bayrak için herkese aynı 10 soru, günde bir hak, günlük
  sıralama, gün serisi ve paylaşılabilir sonuç (🟩🟥 kareleriyle).
- **Ana ekran:** Yarış kartında Türkiye'nin ve Dünya'nın birincisi; sıralama telefonda alttan açılır.

## Nerede oynanır

- **Web:** Tarayıcıdan, kurulum gerekmeden. Ana ekrana uygulama olarak da eklenebilir.
- **Android:** Google Play'de kapalı testte.
- **iOS:** Hazırlanıyor.

Google hesabınla ya da misafir olarak giriş yapabilirsin; antrenman için giriş gerekmez.

## Yol haritası

Sıradaki işler, öncelik sırasıyla:

1. **Rozetler:** Başarı rozetleri ("81 ilin hepsini bildin", "Bayrakta 10/10", "7 günlük seri"); profilde görünür.
2. **Yeni içerik:** Başkentler (dünya haritasıyla), Türkiye'de bölgeler ve komşu iller (il haritasıyla).
3. **İngilizce dil desteği.**

Teknik işler:

- Android uygulamasının yeni sürümü yayılınca eski tur açma yolunu (`start_round`) kapatmak; skor doğrulaması o zaman
  bütün turlarda geçerli olur.
- Puan, seri ve süre mantığı için birim testleri; ana sayfa bileşeninin sadeleştirilmesi.

Sonraya bırakılan fikirler: karanlık tema, misafir hesabı Google hesabına bağlama, profilde zayıf yerlere özel
antrenman.

## Yasal

[Gizlilik Politikası](https://haritaavcisi.com/gizlilik) ·
[KVKK Aydınlatma Metni](https://haritaavcisi.com/kvkk) ·
[Kullanım Koşulları](https://haritaavcisi.com/kullanim-kosullari) ·
[Hesap Silme](https://haritaavcisi.com/hesap-silme)

Site çerezsiz, anonim ziyaret istatistiği tutar (Vercel Web Analytics); iOS ve Android uygulamalarında analitik yok.

Geliştirme ve kurulum notları: [docs/GELISTIRME.md](docs/GELISTIRME.md)
