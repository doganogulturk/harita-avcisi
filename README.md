# Harita Avcısı

Sorulan ili, plakayı, ülkeyi ya da bayrağı haritada bulma oyunu. Yarış turlarında skor canlı sıralamaya işlenir; antrenmanda giriş yapmadan, süre baskısı olmadan pratik yapılır.

**Canlı:** [harita-avcisi.vercel.app](https://harita-avcisi.vercel.app/)

## Oyun

Giriş ekranı iki adımlıdır. İlk adımda dört oyun 2×2 büyük kart olarak durur: **Yarış**, **Antrenman**, **Düello**
ve **Oda**. Her kartın kendi rengi, simgesi, bir cümlelik açıklaması ve künyesi (soru sayısı, süre, sıralamaya
işlenip işlenmediği) vardır. En son oynanan oyunun kartı "Son oynadığın" diye işaretlenir. Yarış kartında
**Sıralamayı gör**, Düello ve Oda kartlarında **Kodla katıl** bağlantısı bulunur. Alçak (yatay telefon) ekranlarda
künyeler gizlenir, düzen 2×2 kalır.

İkinci adım dört oyunda aynı düzendedir: solda oynanacak harita, sağda en üstte Türkiye / Dünya seçimi, altında
oyunun kendi ayarları ve en altta büyük eylem tuşu (**Başla**, **Düelloyu kur**, **Odayı kur**). **← Oyun modu**
ilk adıma döner. Tüm seçimler tarayıcıda hatırlanır.

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

Tur bittiğinde o modda **en çok yanlış yapılan 5 yer** gösterilir: tüm oyuncuların yarış turlarındaki cevaplarından,
yanlış oranına göre. Her yerin yanında en çok neyle karıştırıldığı yazar; oyuncunun o turda kendisinin de yanlış
yaptığı yerler işaretlenir. Türkiye'de İsim ile Plaka, dünyada Normal, Zor ve Bayrak ayrı değerlendirilir.
Giriş ekranındaki Yarış kartında bulunan **Sıralamayı gör** bağlantısı sıralamayı tur oynamadan açar; giriş yapmamış ziyaretçi de görebilir. Antrenman sonuçları kaydedilmediği için o modda çıkmaz.
Oyun sırasında da açılmaz, çünkü yarışta süre işlerken sıralamaya bakmak puan kaybettirir.

### Antrenman

Giriş, süre ve soru sınırı yoktur; havuz bitince yeniden karıştırılır ve oyuncu **Bitir** diyene kadar sürer. Sonuçlar kaydedilmez, turun sonunda doğru sayısı, başarı oranı, en uzun seri ve süre gösterilir.
En çok yanlış yapılanlar listesi antrenmanın sonunda da çıkar; yalnızca yarış turlarından hesaplanır ve antrenmanın
havuzuyla (ör. seçilen kıta) sınırlanır. Antrenman cevapları bu istatistiğe katılmaz.

- **Türkiye:** 81 il, isimle ya da plakayla
- **Dünya:** Normal (58) ya da Tümü (179); sorular isimle veya bayrakla
- **Kıtalar:** Afrika, Amerika, Asya ve Avrupa. Harita seçilen kıtaya yakınlaşarak açılır; kıta dışındaki ülkeler soluk ve tıklanamaz olur. İki kıtaya yayılan ülkeler (Türkiye, Rusya, Kazakistan, Azerbaycan, Gürcistan, Ermenistan, Kıbrıs) hem Avrupa'da hem Asya'da sorulur. Okyanusya'nın haritada yalnızca 6 ülkesi olduğu için kıta seçeneği yoktur.

Oyun sırasında üst bardaki çıkış tuşu turu bırakıp ana menüye döner; yanlışlıkla başlatılan bir tur için
sürenin dolmasını beklemek gerekmez. Bırakılan turun skoru kaydedilmez.

### Düello

İki oyuncu aynı sorularla aynı anda yarışır. Giriş ekranında **Düello** kartı seçilince ikinci adımda
harita ve mod (Türkiye: Şehir, Plaka · Dünya: Normal, Zor, Bayrak) ile kural seçilir, düello kurulunca
`/duello/<kod>` sayfasına geçilir. Kod ya da bağlantı rakibe gönderilir; rakip bağlantıyı açar (ya da Düello kartındaki
**Kodla katıl** alanına kodu yazar), giriş yapar (misafir de olur) ve lobiye katılır. İkisi de **Hazırım** deyince 3 saniyelik geri
sayımla başlar.

- 10 soru; her soru en fazla 15 saniye. İki oyuncu da cevaplayınca (Kapan kazanır'da biri doğru bilince) soru hemen biter.
- Her oyuncunun soru başına tek tıklama hakkı var. Rakibin nereye tıkladığı, oyuncu kendi cevabını verene ya da
  soru bitene kadar gösterilmez; yalnızca cevapladığı bilinir.
- **⚡ Kapan kazanır:** ilk doğru bilen 1 puan alır ve soru biter; yanlış tıklayan o soruda hakkını kaybeder.
- **🎯 Herkes puan alır:** doğru bilen 1 puan alır; ikisi de bildiyse hızlı olana +1.
- Soru bitince iki tıklama haritada birlikte gösterilir (doğru cevap yeşil, oyuncunun yanlışı kırmızı, rakibin
  tıkladığı turuncu) ve 3 saniye sonra sonraki soruya geçilir.
- Sonuçta kazanan, soru soru döküm ve seri skoru görünür. **Rövanş** aynı ayarlarla, **Başka modla rövanş** yeni
  ayarlarla yeni bir düello kurar; rakibe istek gider, kabul ederse ikisi de yeni lobiye geçer.
- Rakip 30 saniyeden uzun süre bağlantısız kalırsa düello hükmen kazanılır.
- Düellolar genel sıralamaya ve "en çok yanlış yapılanlar" istatistiğine işlenmez.

### Oda

Bir grup aynı sorularla kendi içinde yarışır. Giriş ekranında **Oda** kartı seçilince ikinci adımda
oda adı, harita ve mod, tur sayısı (1 / 3 / 5), süre (15 dk / 30 dk / 1 saat) ve en fazla katılımcı (2-50) seçilir.
Oda `/oda/<kod>` sayfasındadır; kod ya da bağlantı gruba gönderilir, kodu olan Oda kartındaki **Kodla katıl** ile de girer.

- **Lobi:** katılanlar görünür; katılım yalnızca lobide açıktır. Oda sahibi en az 2 oyuncuyla **Başlat** der, süre o an
  işlemeye başlar. Başlatılmayan oda 24 saat sonra kapanır. Oda başladıktan sonra bağlantıyı açan katılamaz ama
  sıralamayı izleyebilir.
- **Turlar:** her tur normal bir yarış turudur (10 soru, 120 saniye); her turun soruları odadaki herkes için aynıdır
  ve tur başlayana kadar gizlidir. Turlar sırayla, oda süresi içinde istenen anda ve birer kez oynanır. Başlatılıp
  bırakılan tur "yarım" sayılır: 0 puan, 120 saniye.
- **Oda sıralaması:** tur tur puanlar, toplam puan ve toplam süre canlı güncellenir; toplam puana, eşitlikte toplam
  süreye göre dizilir. Süre bitince oda kapanır ve ilk üç kürsüde gösterilir.
- Oda turları genel sıralamaya ve "en çok yanlış yapılanlar" istatistiğine de işlenir.
- Bir oyuncunun aynı anda en fazla 3 açık odası olabilir.

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
    IntroScreen.tsx     Giriş ekranı: oyun seçimi (adım 1) ve ayarlar (adım 2), açılış animasyonu
    intro/              Giriş ekranının parçaları: dört oyun kartı (ModeGrid), ortak adım 2 düzeni (SetupParts),
                        Yarış/Antrenman, Düello ve Oda ayarları, oyunların renk ve simgeleri (games.tsx)
    ScopePreviewMap.tsx Adım 2'deki önizleme haritası; seçilen kıtayı vurgular
    AuthPanel.tsx       Yarış öncesi giriş adımı (Google / misafir)
    GameTopBar.tsx      Oyun sırasındaki üst bar (soru, bayrak, puan, süre)
    GameMap.tsx         Tıklanabilir harita, yakınlaştırma tuşları
    ResultScreen.tsx    Tam ekran sonuç: özet ve yeni tur tuşları, en çok yanlış yapılanlar, sıralama; antrenman özeti
    Logo.tsx            Nişangah rozetli oyun adı (giriş ve sonuç ekranlarının başlığı)
    MostMissed.tsx      Sonuç ekranındaki "En çok yanlış yapılanlar" listesi
    Leaderboard.tsx     Sekmeli sıralama listesi
    LeaderboardPanel.tsx Giriş ekranından açılan sıralama katmanı
    RoundControls.tsx   Oyun sırasında turu yeniden başlatma / tur değiştirme
    PlayButton.tsx      Rozetli oyna tuşu
    duel/               Düello: lobi, oyun, sonuç ve ortak parçalar (DuelScreen hepsini yönetir)
    room/               Oda: lobi, oda panosu (sıralama, kürsü), odadaki tur (RoomScreen yönetir)
    SignInPanel.tsx     Düello ve oda için giriş adımı (Google / misafir)
  duello/[kod]/page.tsx Düello sayfası; kodu okuyup DuelScreen'i çizer
  oda/[kod]/page.tsx    Oda sayfası; kodu okuyup RoomScreen'i çizer
lib/
  game.ts               Ortak tipler, tur seçimi (PlayChoice), sıralama tanımları (BOARDS)
  intro-preferences.ts  Giriş ekranı seçimlerini (son oyun, harita, kapsam, soru tipi, düello ayarları) tarayıcıda saklar
  hooks/
    usePlayer.ts        Supabase oturumu
    useMapMarkup.ts     SVG haritayı indirip önbelleğe alır ve tıklanabilir yapar
    useMapZoom.ts       viewBox tabanlı yakınlaştırma, kaydırma ve açılış görünümü
    useMostMissed.ts    location_stats view'inden o modda en çok yanlış yapılan yerleri çeker
    useLeaderboard.ts   Yarış turunu sunucuda açar (start_round), sonucu tur başına bir kez kaydeder
                        (finish_round), sıralamaları çeker, realtime abonelik.
                        useLeaderboards ise kayıt yapmadan yalnızca okur (giriş ekranındaki panel)
  turkish-plates.ts     81 il + plaka kodu
  world-countries.ts    179 ülke + ISO kodu; Normal havuzu ("common"), kıta listeleri, kıta görünümleri ve kapsamlar (WorldScope)
  shuffle.ts            Fisher-Yates karıştırma
  supabase.ts           Supabase istemcisi (env yoksa null döner)
  auth.ts               Google ve misafir girişi (ana sayfa ve düello ortak kullanır)
  duel.ts               Düello tipleri, kurallar, modlar ve yer kimliğinden soruya geçiş
  hooks/useDuel.ts      Düelloya katılır, durumu düzenli aralıklarla sorar, cevap / hazır / rövanş işlemleri
  hooks/useRoundPlay.ts Bir turun oynanışı (sorular, 120 sn, 3 sn gösterim, puan ve seri); ana sayfa ve oda kullanır
  room.ts               Oda tipleri ve ayar seçenekleri
  hooks/useRoom.ts      Odaya katılır, durumu yoklar, odayı ve turları başlatır
scripts/
  generate-duel-pools.mjs  Düello soru havuzlarını world-countries.ts'ten schema.sql'e yazar
public/maps/            turkey.svg, world.svg
public/flags/           179 ülkenin 4:3 bayrakları (<iso>.svg)
supabase/schema.sql     Tablolar, RLS politikaları, tur fonksiyonları, leaderboard ve location_stats view'leri, realtime
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

Yarış sonuçları `game_results` tablosunda tutulur; antrenman sonuçları hiç kaydedilmez. Her satır `game_mode` (`turkey` / `world`) ve `variant` ile bir sıralamaya bağlanır:

| Sıralama | `game_mode` | `variant` |
| --- | --- | --- |
| Türkiye | `turkey` | `normal` |
| Plaka | `turkey` | `plates` |
| Dünya | `world` | `normal` |
| Dünya · Zor | `world` | `hard` |
| Bayrak | `world` | `flags` |

RLS politikaları sıralamayı herkese açar: giriş yapmamış ziyaretçi de sıralamayı okuyabilir. Tarayıcının
tabloya yazma izni yoktur; sonuçlar yalnızca sunucudaki iki fonksiyonla kaydedilir:

- `start_round(game_mode, variant)`: yarış turu başlarken `game_rounds` tablosunda bir tur açar ve
  kimliğini döndürür. Tur tarayıcıda beklemeden başlar, istek arka planda sürer.
- `finish_round(round_id, duration_ms, answers)`: `answers`, cevaplanan soruların sırayla listesidir
  (`[{"location": "34", "selected": "41"}, ...]`). Puanı ve en uzun seriyi bu listeden kendisi hesaplar; turun
  oyuncuya ait olduğunu, daha önce kaydedilmediğini ve sürenin mümkün olduğunu denetleyip sonucu yazar.
  Soruların bitmediği tur ancak 120 saniye dolduysa kabul edilir; 10 soruluk tur en az 30 saniye sürer
  (9 × 3 saniyelik gösterim + soru başına 0,3 saniye). Kaydedilen süre, sunucunun ölçtüğünden belirgin
  biçimde kısa olamaz. Oyuncunun adı ve fotoğrafı tarayıcıdan değil oturumdan alınır.

Her cevap `round_answers` tablosuna da yazılır (sorulan yer, tıklanan yer, doğru mu). Bu tablo tarayıcıya kapalıdır;
`location_stats` view'i her sıralamada her yerin kaç kez sorulduğunu, kaç kez yanlış cevaplandığını ve en çok hangi
yerle karıştırıldığını herkese açık olarak toplar. Türkiye'de yerler başında sıfır olmadan plakayla (`6`, `34`),
dünyada ISO koduyla (`tr`) tutulur.

Doğru cevap sorudan belli olduğu için (sorulan ülkenin kodu, tıklanacak alanın kodudur) bu denetimler
cevapları otomatik veren bir betiği engelleyemez; engelledikleri, hiç oynanmamış bir turun ya da imkânsız
bir sürenin kaydedilmesidir. Sıralama, oyuncu, mod ve `variant` başına en iyi sonucu döndüren `leaderboard` view'inden okunur ve `supabase_realtime` publication'ı sayesinde yeni sonuçlar anında yansır.

### Düello

Düellonun hakemi veritabanıdır. `duels` (ayarlar, oyuncular, skor, açık sorunun başlama ve bitiş anı),
`duel_questions` (düellonun 10 sorusu) ve `duel_answers` (cevaplar, cevap süresi, puan) tabloları tarayıcıya
tamamen kapalıdır; tarayıcı yalnızca şu fonksiyonları çağırır:

| Fonksiyon | İş |
| --- | --- |
| `create_duel(mode, variant, rule)` | Düello kurar, 6 karakterlik kodu döndürür (O/0 ve I/1 kullanılmaz) |
| `join_duel(code)` | Oyuncuyu misafir olarak oturtur; rövanşta yalnızca eski rakip katılabilir |
| `duel_ready(code, ready)` | Hazır / hazır değil |
| `duel_tick(code)` | Oyunun saati: oyuncunun bağlı olduğunu kaydeder, zamanı gelen geçişi yapar (başlatma, 15 sn dolan soruyu kapatma, sonraki soru, bitiş, 30 sn sessiz rakibe karşı hükmen galibiyet) ve durumu döndürür |
| `duel_answer(code, position, selected)` | Açık soruya cevap; doğruluğu ve süreyi sunucu belirler |
| `duel_rematch(code, mode, variant, rule)` | Rövanş düellosu kurar; ikisi aynı anda isterse tek düello kurulur |
| `duel_decline_rematch(code)` | Gelen rövanş isteğini reddeder |

Durum, çağıranın görmesi gerekeni içerir: açık soru başlama anından önce, rakibin açık sorudaki cevabının yeri ise
oyuncu cevap verene ya da soru bitene kadar gönderilmez. Tarayıcı durumu oyun sırasında yarım saniyede, lobide ve
sonuçta 1,5 saniyede bir sorar; realtime aboneliği gerekmez.

Soruları sunucu seçtiği için soru havuzları `duel_pool` fonksiyonunda durur. Bu fonksiyon elle yazılmaz:
`lib/world-countries.ts` değişirse `node scripts/generate-duel-pools.mjs` çalıştırılıp `schema.sql` yeniden uygulanır.

### Oda

`rooms` (ayarlar, başlama ve bitiş anı), `room_players` ve `room_questions` (her turun 10 sorusu) tabloları tarayıcıya
kapalıdır. Odadaki bir tur, `game_rounds` ve `game_results` tablolarında `room_id` / `room_round` ile işaretli normal bir
yarış turudur; bu yüzden `finish_round`'un bütün denetimlerinden geçer ve genel sıralamaya da yazılır. Oda turunda
`finish_round` ayrıca cevapların sırayla o turun sorularına verildiğini doğrular.

| Fonksiyon | İş |
| --- | --- |
| `create_room(name, mode, variant, round_count, duration_minutes, max_players)` | Oda kurar, kodu döndürür |
| `join_room(code)` | Lobideyse ve yer varsa oyuncuyu ekler; değilse katılamama nedeniyle durumu döndürür |
| `get_room(code)` | Oda durumu ve sıralaması |
| `start_room(code)` | Oda sahibi başlatır; her turun soruları seçilir (turlar arasında tekrar yok) |
| `start_room_round(code, round)` | Sıradaki turu açar ve sorularını döndürür; turlar sırayla, birer kez |
| `abandon_round(round_id)` | Oyuncu turu bırakır; tur hemen "yarım" sayılır |

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
