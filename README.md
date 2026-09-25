# Harita Avcısı

Sorulan ili, plakayı, ülkeyi ya da bayrağı haritada bulma oyunu. Yarış turlarında skor canlı sıralamaya işlenir; antrenmanda giriş yapmadan, süre baskısı olmadan pratik yapılır.

**Canlı:** [harita-avcisi.vercel.app](https://harita-avcisi.vercel.app/)

## Oyun

Giriş ekranı iki adımlıdır: önce harita seçilir (Türkiye ya da Dünya), sonra o turun ayarları yapılıp **Başla** denir.
Üstteki **Yarış / Antrenman** seçicisi her iki adımda da açıktır. Tüm seçimler tarayıcıda hatırlanır.

İkinci adımda oynanacak harita gerçek boyutuyla gösterilir. Kıta seçildiğinde o kıta harita üzerinde vurgulanır;
havuz seçimlerinde (Normal / Tümü) vurgu yapılmaz, kapsam yan paneldeki tek satırlık açıklamayla anlatılır.

Sayfa ilk açıldığında oyunun adı ekranın ortasında belirir, ardından bu katman çekilerek seçim ekranı açılır.
Açılış sayfa yaşamı boyunca bir kez oynar; oyundan ana menüye dönüşte tekrarlanmaz ve hareket azaltma açıksa
hiç gösterilmez.

### Yarış

Giriş gerektirir (Google ya da misafir adı). Her tur 10 soru ve toplam 120 saniyedir; her cevaptan sonra doğru cevap 3 saniye gösterilir.

| Tur | Havuz | Soru |
| --- | --- | --- |
| Türkiye | 81 il | İl adı |
| Plaka | 81 il | İlin plaka kodu; cevaptan sonra ilin adı da gösterilir |
| Dünya · Normal | 58 tanınmış ülke | Ülke adı |
| Dünya · Zor | 179 ülke | Ülke adı |
| Bayrak | 179 ülke | Ülkenin bayrağı; cevaptan sonra adı da gösterilir |

Her turun ayrı sıralaması vardır. Sıralama önce puana, eşitlikte süreye, sonra en uzun doğru serisine göre yapılır.
Giriş ekranında Yarış seçiliyken, tur özetinin ardından gelen **Sıralamayı gör** bağlantısı sıralamayı tur
oynamadan açar; giriş yapmamış ziyaretçi de görebilir. Antrenman sonuçları kaydedilmediği için o modda çıkmaz.
Oyun sırasında da açılmaz, çünkü yarışta süre işlerken sıralamaya bakmak puan kaybettirir.

### Antrenman

Giriş, süre ve soru sınırı yoktur; havuz bitince yeniden karıştırılır ve oyuncu **Bitir** diyene kadar sürer. Sonuçlar kaydedilmez, turun sonunda doğru sayısı, başarı oranı, en uzun seri ve süre gösterilir.

- **Türkiye:** 81 il, isimle ya da plakayla
- **Dünya:** Normal (58) ya da Tümü (179); sorular isimle veya bayrakla
- **Kıtalar:** Afrika, Amerika, Asya ve Avrupa. Harita seçilen kıtaya yakınlaşarak açılır; kıta dışındaki ülkeler soluk ve tıklanamaz olur. İki kıtaya yayılan ülkeler (Türkiye, Rusya, Kazakistan, Azerbaycan, Gürcistan, Ermenistan, Kıbrıs) hem Avrupa'da hem Asya'da sorulur. Okyanusya'nın haritada yalnızca 6 ülkesi olduğu için kıta seçeneği yoktur.

Oyun sırasında üst bardaki çıkış tuşu turu bırakıp ana menüye döner; yanlışlıkla başlatılan bir tur için
sürenin dolmasını beklemek gerekmez. Bırakılan turun skoru kaydedilmez.

### Harita

Harita tekerlek, sürükleme ve +/− tuşlarıyla yakınlaştırılıp kaydırılabilir. Doğru cevap görünümün dışındaysa harita onu gösterecek şekilde kayar ve sonraki soruda oyuncunun bıraktığı görünüme döner. Oyun yatay düzen için tasarlanmıştır; telefon dikey tutulduğunda cihazı çevirmesi istenir.

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır. Antrenman Supabase olmadan da oynanabilir; yarış turları için aşağıdaki Supabase kurulumu gerekir.

## Proje yapısı

```
app/
  page.tsx              Oyun durumu, zamanlayıcılar ve ekranlar arası akış
  layout.tsx            Kök düzen, viewport ve başlık yazı tipi
  icon.svg              Nişangah favicon'u
  globals.css           Tailwind, harita SVG'si için stiller ve açılış animasyonu
  components/
    IntroScreen.tsx     Giriş ekranı: harita seçimi (adım 1) ve tur ayarları (adım 2), açılış animasyonu
    ScopePreviewMap.tsx Adım 2'deki önizleme haritası; seçilen kıtayı vurgular
    AuthPanel.tsx       Yarış öncesi giriş adımı (Google / misafir)
    GameTopBar.tsx      Oyun sırasındaki üst bar (soru, bayrak, puan, süre)
    GameMap.tsx         Tıklanabilir harita, yakınlaştırma tuşları
    ResultScreen.tsx    Yarış sonucu + sıralama; antrenman özeti
    Leaderboard.tsx     Sekmeli sıralama listesi
    LeaderboardPanel.tsx Giriş ekranından açılan sıralama katmanı
    RoundControls.tsx   Oyun sırasında turu yeniden başlatma / tur değiştirme
    PlayButton.tsx      Rozetli oyna tuşu
lib/
  game.ts               Ortak tipler, tur seçimi (PlayChoice), sıralama tanımları (BOARDS)
  intro-preferences.ts  Giriş ekranı seçimlerini (tür, kapsam, soru tipi) tarayıcıda saklar
  hooks/
    usePlayer.ts        Supabase oturumu
    useMapMarkup.ts     SVG haritayı indirip önbelleğe alır ve tıklanabilir yapar
    useMapZoom.ts       viewBox tabanlı yakınlaştırma, kaydırma ve açılış görünümü
    useLeaderboard.ts   Sonucu tur başına bir kez kaydeder, sıralamaları çeker, realtime abonelik.
                        useLeaderboards ise kayıt yapmadan yalnızca okur (giriş ekranındaki panel)
  turkish-plates.ts     81 il + plaka kodu
  world-countries.ts    179 ülke + ISO kodu; Normal havuzu ("common"), kıta listeleri, kıta görünümleri ve kapsamlar (WorldScope)
  shuffle.ts            Fisher-Yates karıştırma
  supabase.ts           Supabase istemcisi (env yoksa null döner)
public/maps/            turkey.svg, world.svg
public/flags/           179 ülkenin 4:3 bayrakları (<iso>.svg)
supabase/schema.sql     Tablo, RLS politikaları, leaderboard view'i, realtime
```

### Haritalar, bayraklar ve yazı tipi

Tüm varlıklar projeyle birlikte sunulur; çalışma zamanında dış bir CDN'e istek yapılmaz.

| Varlık | Kaynak | Lisans |
| --- | --- | --- |
| `maps/turkey.svg` | [dnomak/svg-turkiye-haritasi](https://github.com/dnomak/svg-turkiye-haritasi) | MIT |
| `maps/world.svg` | [flekschas/simple-world-map](https://github.com/flekschas/simple-world-map) | CC BY-SA 3.0 |
| `flags/*.svg` | [lipis/flag-icons](https://github.com/lipis/flag-icons) 7.5.0 | MIT |
| Başlık yazı tipi | [Stack Sans Notch](https://fonts.google.com/specimen/Stack+Sans+Notch), `next/font` ile derlemede gömülür | OFL 1.1 |

Tıklanabilir alanlar Türkiye haritasında `data-plakakodu`, dünya haritasında ISO 3166-1 alpha-2 `id` değeri üzerinden eşleştirilir; bayrak dosyaları da aynı ISO koduyla adlandırılır. Kıta görünümleri `world.svg` koordinatlarıyla `world-countries.ts` içinde sabit tanımlıdır: bazı ülkelerin şekilleri denizaşırı topraklarını da içerdiği için kutudan türetilmez.

## Supabase ve oturum açma

1. Supabase projesi oluşturun.
2. SQL Editor'de [`supabase/schema.sql`](./supabase/schema.sql) dosyasını çalıştırın. Dosya idempotent'tir; şema değiştiğinde (ör. yeni bir `variant` eklendiğinde) tekrar çalıştırın.
3. Authentication > Providers altında **Google** ve **Anonymous sign-ins** sağlayıcılarını etkinleştirin. Google Cloud OAuth istemcinizde Supabase'in callback URL'sini yetkili yönlendirme adresi olarak ekleyin.
4. `.env.example` dosyasını `.env.local` olarak kopyalayın ve proje URL'si ile Publishable Key değerlerini girin.
5. Authentication > URL Configuration ekranına yerel adresinizi ve Vercel alan adınızı ekleyin.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### Veri modeli

Yarış sonuçları `game_results` tablosuna yazılır; antrenman sonuçları hiç kaydedilmez. Her satır `game_mode` (`turkey` / `world`) ve `variant` ile bir sıralamaya bağlanır:

| Sıralama | `game_mode` | `variant` |
| --- | --- | --- |
| Türkiye | `turkey` | `normal` |
| Dünya | `world` | `normal` |
| Dünya · Zor | `world` | `hard` |
| Bayrak | `world` | `flags` |

RLS politikaları sıralamayı herkese açar: giriş yapmamış ziyaretçi de sıralamayı okuyabilir. Yazma izni giriş gerektirir ve herkes yalnızca kendi sonucunu yazabilir. Sıralama, oyuncu, mod ve `variant` başına en iyi sonucu döndüren `leaderboard` view'inden okunur ve `supabase_realtime` publication'ı sayesinde yeni sonuçlar anında yansır.

## Vercel ile yayınlama

1. Depoyu Vercel'e içe aktarın; `main` dalına her push yeni bir production derlemesi başlatır.
2. Vercel Project Settings > Environment Variables altında iki `NEXT_PUBLIC_SUPABASE_*` değişkenini ekleyin.
3. Yayınlanan alan adını Supabase Authentication URL Configuration'a ekleyin.

Bir derleme hazır olduğu halde yayına alınmadıysa (ör. önceki bir Instant Rollback sonrası), Deployments listesinde **⋯ → Promote to Production** ile yayına alınabilir.

## Kontroller

```bash
npm run lint
npm run build
```
