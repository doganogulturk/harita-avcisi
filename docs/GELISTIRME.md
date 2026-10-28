# Harita Avcısı · Geliştirici notları

Oyunun ayrıntılı kuralları, kurulum, Supabase veri modeli ve mobil uygulama derlemesi. Kısa tanıtım için
[README](../README.md).

## Oyun

Giriş ekranı iki adımlıdır. İlk adımda **Yarış** kartı, altında başlıksız ince bir **Antrenman** şeridi
ve **Arkadaşlarımla** kartı (Düello ve Oda) durur. Geniş ekranda sol sütunda Yarış ve Antrenman, sağda iki satır boyunca
Arkadaşlarımla; dikey telefonda üçü alt alta. Antrenman şeridinde solda tek satırlık bir not ("Süre yok. İstediğin kadar oyna."), sağ
altta **Antrenman yap** sekmesi vardır; şerit 29rem'den darsa (telefonlarda) not kendi satırına, sekme onun altına geçer. Kartlar renkli çerçeveli, altında kalın renkli gölgeli, zemininde silik nokta deseni olan oyun kartlarıdır;
başlığın yanında kartın simgesi renkli bir karoda durur. Kartın kendisine dokunmak bir şey yapmaz. Yarış kartında
sağ alt köşede dolu renkli tek bir **Yarışa başla** sekmesi durur; Arkadaşlarımla kartında iki oyun kartın
sol ve sağ alt köşesinden içeri kıvrılan ve kartın ortasında buluşan büyük sekmelerdir (`CornerTab`, `stretch`). Her biri
kendi oyununun renginde (Yarış camgöbeği, Antrenman sarı, Düello turuncu, Oda mor), dış köşede dolu ve ortaya doğru
şeffaflaşan bir gradyenle, oyunun simgesi ve adıyla durur. Sekme doğrudan o oyunun ayar ekranını açar; ara adım yoktur.
Kartın canlı kısmı başlıkla sekmeler arasındaki boşlukta dikeyde ortalanır: Yarış kartında **👑 Liderler** panosu
(Türkiye'nin ve Dünya'nın birincisi; harita simgesi, altın halkalı ve taçlı profil resmi, altın rozette skor ve süre) ve
**Sıralamayı gör** bağlantısı; Arkadaşlarımla kartında hep açık duran kod alanı. Davetle gelen oyuncu kodu yazıp **Katıl**'a basar; düello ve oda kodları aynı biçimde olduğu için
kodun hangisine ait olduğunu sunucu söyler (`code_kind`, `lib/join-code.ts`), kod bulunamazsa kartta yazar.
Dikey telefonda kartlar alt alta durur ve ekranı doldurur ama içeriklerinden kısa olamaz; ekran yetmezse liste kayar.
400 pikselden dar ekranlarda başlıktaki logo küçülür, 360 pikselden dar ekranlarda nişangah rozeti gizlenir. Zeminde
silik enlem-boylam çizgileri ve dünya haritası vardır. Çok geniş ekranda içerik ortada en fazla 80rem genişlikte durur,
kartlar en fazla 36rem yüksekliğe uzar ve yazıları büyür. Yasal sayfalar (Gizlilik, KVKK, Koşullar, Hesap silme) ekranın altında satır
kaplamaz; başlığın sağındaki hesap menüsündedir (`AccountMenu`): profil resmine (giriş yoksa kişi simgesine) dokununca
açılır, içinde oyuncunun adı, tanıtımı yeniden açan **Nasıl oynanır?**, yasal sayfalar ve **Çıkış yap** durur. Aynı menü
sonuç, düello ve oda ekranlarının başlığında da vardır; dikey telefonda da çıkış yapılabilir.

İkinci adım dört oyunda da aynı düzendedir (`intro/SetupParts.tsx`). Solda üstte yuvarlak **←** tuşu ve ana ekranda
seçilen oyunun adı ve simgesi (Yarış, Antrenman, Düello ya da Oda), altında iki seçici: harita (**Türkiye | Dünya**) ve
soru tipi (Türkiye'de İsim / Plaka, dünyada İsim / Bayrak / Başkent). En altta bu seçimlerle
dönen canlı önizleme durur: haritada soru çıkar ("🏛️ Kanberra hangi ülke?"), bir saniye sonra doğru yer yeşil yanar,
sonraki soruya geçilir. Seçim değişince döngü o seçimin sorusuyla baştan başlar; antrenmanda seçilen kıta vurgulanır ve
yalnızca o kıtadan sorulur. Önizleme, küçük haritada da görünsün diye büyük ve tanınır yerlerden sorar; hareket azaltma
açıksa durur. "Nasıl oynanır?" demosuyla aynı bileşendir (`MapDemo.tsx`). Soru tipinin ne demek olduğu ("Başkent gelir,
ülkesini bul") haritanın sol alt köşesinde kısa bir not olarak durur.

Sağdaki panelin başlığı **Ayarlar**dır, eylem tuşu (**Başla**, **Düelloyu kur**, **Odayı kur**) panelin sağ üst köşesinden
içeri kıvrılan sekmedir (`CornerTab`). Yarışta seçilecek ayar yoktur: panel soru tipinin ne olduğunu, kaç yerden
sorulduğunu ve o sıralamanın birincisini söyler. Antrenmanda (dünyada) kapsam, düelloda kural, odada ad, tur sayısı, süre
ve kişi sınırı vardır. Alçak (yatay telefon) ekranda harita ve soru tipi seçicileri yan yana durur, simgeleri gizlenir;
ayarların etiketi solda, seçici sağda olur. Dikey telefonda harita kartı ekranın boş kalan yerini alır. Başlıktaki logo
her adımdan ilk adıma döner. İkinci adım tarayıcı geçmişine bir kayıt olarak eklenir (adres değişmez); telefonda geri
hareketi siteden çıkmaz, oyun seçimine döner. Tüm seçimler tarayıcıda hatırlanır.

İlk ziyarette açılış animasyonundan sonra bir tanıtım açılır (`intro/Guide.tsx`): nasıl oynanır (gerçek
Türkiye ve dünya haritalarında isim, plaka, bayrak ve başkent soruları; sorulan yer yeşil yanar), dokunmatik cihazda **Telefonda**
(yan çevir ve iki parmakla yakınlaştır animasyonları), tek başına ve arkadaşlarla oynanan oyunlar, arkadaşlarla oynamak. Kaydırarak, ok tuşlarıyla ya da alttaki
tuşlarla gezilir; **Geç** her ekranda durur. Son ekranın asıl tuşu **Başlayalım** ana ekrandaki oyun seçimine döner; giriş
yapılmamışsa Google ve misafir girişi seçenek olarak sunulur. Görüldüğü tarayıcıda hatırlanır, giriş yapmış oyuncuya
gösterilmez; başlıktaki hesap menüsünde **Nasıl oynanır?** ile yeniden açılır.

Sayfa ilk açıldığında oyunun adı ekranın ortasında belirir, ardından bu katman çekilerek seçim ekranı açılır.
Açılış sayfa yaşamı boyunca bir kez oynar; oyundan ana menüye ya da **←** ile ilk adıma dönüşte
tekrarlanmaz, kartlar beklemeden görünür. Hareket azaltma açıksa hiç gösterilmez.

### Yarış

Giriş gerektirir (Google ya da misafir adı). Giriş yapmamış oyuncu ana menünün sağ üstündeki **Giriş yap** ile
istediği an giriş yapabilir; yapmadıysa ayar ekranındaki tuş **Giriş yap ve başla** (düello ve odada **Giriş yap ve
kur**) yazar, giriş son anda sürpriz olmaz. Misafir adı alanına "Avcı 4821" gibi bir ad önerilir. Her tur 10 soru ve toplam 120 saniyedir; her cevaptan sonra doğru cevap 3 saniye gösterilir.

| Tur | Havuz | Soru |
| --- | --- | --- |
| Türkiye | 81 il | İl adı |
| Plaka | 81 il | İlin plaka kodu; cevaptan sonra ilin adı da gösterilir |
| Dünya | 179 ülke | Ülke adı |
| Bayrak | 179 ülke | Ülkenin bayrağı; cevaptan sonra adı da gösterilir |
| Başkent | 174 ülke | Ülkenin başkenti (🏛️ Kanberra); cevaptan sonra ülkenin adı da gösterilir |

Başkentler `lib/world-capitals.ts`'tedir; adlar TDK yazımını ve Türkçede yerleşik kullanımı izler (Pekin, Moskova).
Başkenti tartışmalı olan İsrail ile ülke olmayan bağlı topraklar (Falkland Adaları, Grönland, Porto Riko, Yeni Kaledonya)
bu turda sorulmaz. Birden çok başkenti olan ülkelerde en bilineni seçildi (La Paz, Pretorya, Amsterdam).

Her turun ayrı sıralaması vardır. Sıralama önce puana, eşitlikte süreye, sonra en uzun doğru serisine göre yapılır.

Sonuç ekranında skorun altında soru başına küçük bir kare durur (yeşil doğru, kırmızı yanlış); **Soruları gör** ile her
soru bir satır olur: sorulan yer (bayrak turunda bayrak, plaka turunda plaka, başkent turunda "Kanberra · Avustralya")
ve yanlışsa tıklanan yer. Antrenmanda da
vardır; liste uzarsa kendi içinde kayar.

Tur bitince sonuç ekranında asıl tuş **Tekrar oyna** aynı turu yeniden başlatır; **Başka tur seç** Yarış'ın ayar
ekranını açar (antrenmanda **Tekrar antrenman** ve **Başka antrenman seç**). Yatay telefonda sonuç ekranı iki
sütundur: solda özet ve tuşlar, sağda sıralama ve en çok yanlış yapılanlar.

Tur bittiğinde o modda **en çok yanlış yapılan 5 yer** gösterilir: tüm oyuncuların yarış turlarındaki cevaplarından,
yanlış oranının güvenilir alt sınırına (Wilson, %95) göre. Yalnızca orana göre sıralanınca bir kez sorulup bir kez
yanlış bilinen yer (1/1, %100), yedi kez sorulup altısında yanlış bilinen yerin (6/7) önüne geçiyordu; bu ölçü az
sorulan yerleri geri iter. Sıralama tarayıcıda yapılır (`useMostMissed.ts`). Her yerin altında en çok neyle
karıştırıldığı yazar ("Tunceli sanılıyor"); oyuncunun o turda kendisinin de yanlış
yaptığı yerler işaretlenir. Türkiye'de İsim ile Plaka, dünyada isim, Bayrak ve Başkent ayrı değerlendirilir.
Giriş ekranındaki Tek başıma kartında bulunan **Sıralamayı gör** bağlantısı sıralamayı tur oynamadan açar; giriş yapmamış ziyaretçi de görebilir. Antrenman sonuçları kaydedilmediği için o modda çıkmaz.
Oyun sırasında da açılmaz, çünkü yarışta süre işlerken sıralamaya bakmak puan kaybettirir.

### Antrenman

Giriş, süre ve soru sınırı yoktur; havuz bitince yeniden karıştırılır ve oyuncu **Bitir** diyene kadar sürer. Sonuçlar kaydedilmez, turun sonunda doğru sayısı, başarı oranı, en uzun seri ve süre gösterilir. Sonuçta aynı
haritanın yarışına bir davet de durur; giriş yapılmamışsa giriş adımını açar.
En çok yanlış yapılanlar listesi antrenmanın sonunda da çıkar; yalnızca yarış turlarından hesaplanır ve antrenmanın
havuzuyla (ör. seçilen kıta) sınırlanır. Antrenman cevapları bu istatistiğe katılmaz.

- **Türkiye:** 81 il, isimle ya da plakayla
- **Dünya:** 179 ülkenin tümü ya da bir kıta (aşağıda); sorular isimle, bayrakla veya başkentle (başkentte kıta sayıları
  başkenti sorulan ülkelere göre yazar)
- **Kıtalar:** Afrika, Amerika, Asya ve Avrupa. Harita seçilen kıtaya yakınlaşarak açılır; kıta dışındaki ülkeler soluk ve tıklanamaz olur. İki kıtaya yayılan ülkeler (Türkiye, Rusya, Kazakistan, Azerbaycan, Gürcistan, Ermenistan, Kıbrıs) hem Avrupa'da hem Asya'da sorulur. Okyanusya'nın haritada yalnızca 6 ülkesi olduğu için kıta seçeneği yoktur.

Oyun sırasında üst bardaki çıkış tuşu turu bırakıp ana menüye döner; yanlışlıkla başlatılan bir tur için
sürenin dolmasını beklemek gerekmez. Bırakılan turun skoru kaydedilmez.

### Düello

İki oyuncu aynı sorularla aynı anda yarışır. Giriş ekranında **Arkadaşlarımla** kartında **Düello** seçilince ikinci adımda
harita ve mod (Türkiye: Şehir, Plaka · Dünya: Ülke, Bayrak, Başkent) ile kural seçilir, düello kurulunca
`/duello?kod=<kod>` sayfasına geçilir. Kod ya da bağlantı rakibe gönderilir; rakip bağlantıyı açar (ya da Arkadaşlarımla kartındaki
kod alanına kodu yazar), giriş yapar (misafir de olur) ve lobiye katılır. İkisi de **Hazırım** deyince 3 saniyelik geri
sayımla başlar.

- 10 soru; her soru en fazla 15 saniye. İki oyuncu da cevaplayınca (Kapan kazanır'da biri doğru bilince) soru hemen biter.
- Her oyuncunun soru başına tek tıklama hakkı var. Rakibin nereye tıkladığı, oyuncu kendi cevabını verene ya da
  soru bitene kadar gösterilmez; yalnızca cevapladığı bilinir.
- **⚡ Kapan kazanır:** ilk doğru bilen 1 puan alır ve soru biter; yanlış tıklayan o soruda hakkını kaybeder.
- **🎯 Herkes puan alır:** doğru bilen 1 puan alır; ikisi de bildiyse hızlı olana +1.
- Soru bitince iki tıklama haritada birlikte gösterilir (doğru cevap yeşil, oyuncunun yanlışı kırmızı, rakibin
  tıkladığı turuncu) ve 3 saniye sonra sonraki soruya geçilir.
- Lobide iki oyuncu kartı ve "VS" yan yana durur; dikey telefonda kartlar küçülür, uzun ad kısalır.
- Sonuçta kazanan, soru soru döküm ve seri skoru görünür. **Rövanş** aynı ayarlarla, **Başka modla rövanş** yeni
  ayarlarla yeni bir düello kurar; rakibe istek gider, kabul ederse ikisi de yeni lobiye geçer.
- Yatay ekranda üst bar tek satırdır: solda oyuncu, ortada soru ve sayaç, sağda rakip. Dikey telefonda iki satırdır:
  üstte çıkış ve iki oyuncu kutusu, altta tam genişlikte soru şeridi (soru, sayaç, soru bitince sonraki soruya geri
  sayım).
- Rakip 30 saniyeden uzun süre bağlantısız kalırsa düello hükmen kazanılır.
- Düellolar genel sıralamaya ve "en çok yanlış yapılanlar" istatistiğine işlenmez.

### Oda

Bir grup aynı sorularla kendi içinde yarışır. Giriş ekranında **Arkadaşlarımla** kartında **Oda** seçilince ikinci adımda
oda adı, harita ve mod, tur sayısı (1 / 3 / 5), süre (15 dk / 30 dk / 1 saat) ve kişi sınırı (5 / 10 / 20 / 50) seçilir.
Oda `/oda?kod=<kod>` sayfasındadır; kod ya da bağlantı gruba gönderilir, kodu olan Arkadaşlarımla kartındaki kod alanından da girer.

- **Lobi:** katılanlar görünür; katılım yalnızca lobide açıktır. Oda sahibi en az 2 oyuncuyla **Başlat** der, süre o an
  işlemeye başlar. Başlatılmayan oda 24 saat sonra kapanır. Oda başladıktan sonra bağlantıyı açan katılamaz ama
  sıralamayı izleyebilir.
- **Turlar:** her tur normal bir yarış turudur (10 soru, 120 saniye); her turun soruları odadaki herkes için aynıdır
  ve tur başlayana kadar gizlidir. Turlar sırayla, oda süresi içinde istenen anda ve birer kez oynanır. Başlatılıp
  bırakılan tur "yarım" sayılır: 0 puan, 120 saniye.
- **Oda sıralaması:** tur tur puanlar, toplam puan ve toplam süre canlı güncellenir; toplam puana, eşitlikte toplam
  süreye göre dizilir. Dikey telefonda tablo sıra, oyuncu ve puandan oluşur (süre puanın altında); tur tur puanlar
  geniş ekranda görünür. Süre bitince oda kapanır ve ilk üç kürsüde gösterilir.
- Oda turları genel sıralamaya ve "en çok yanlış yapılanlar" istatistiğine de işlenir.
- Bir oyuncunun aynı anda en fazla 3 açık odası olabilir.

### Günlük meydan okuma

Her gün (Türkiye saatiyle, gece yarısı değişir) Türkiye, Plaka, Dünya, Bayrak ve Başkent için ayrı birer meydan okuma vardır. Bir
modun 10 sorusu o gün ilk başlatıldığında sunucuda seçilir ve gün boyu herkes için aynıdır. Her oyuncu her modu günde bir
kez oynar; başlatılıp bırakılan tur da hakkı kullanır. Tur yarışla aynı biçimdedir (10 soru, 120 saniye), sunucuda
doğrulanır ve genel sıralamaya da işlenir. Giriş gerekir (misafir de olur). Meydan okuma yerel sorularla oynanmaz:
sunucuya ulaşılamazsa ya da mod bugün oynandıysa ana ekrandaki şeritte not çıkar.

Ana ekranın başlığında, profil resminin yanında bir rozet durur: gün serisi ("🔥 3"; seri yoksa "🗓 Günlük"); bugün
oynanmamış bir meydan okuma varsa köşesinde kırmızı nokta. Hiç açılmadıysa bir halka atar. Dokununca **Günün meydan
okuması** alttan açılır: tarih, seri, yeni meydan okumaya kalan süre ve beş mod ikişerli, tek kalan tam satır (oynanmamışta "Oyna",
bitirilende skor, bırakılanda "Bırakıldı"). Oynanmamış moda dokununca tur başlar; bitirilen mod seçilir ve altında o
modun günlük sıralaması, oyuncunun sonucu ve paylaşma tuşu görünür. Her ekranda yalnızca rozet vardır; kartlar ekranı
doldurur. Meydan okuma açılamazsa (bugün oynandı, bağlantı yok) sayfa kendiliğinden açılır ve notu gösterir. Sonuç ekranında skor, süre, günün sıralamasındaki yer, gün serisi,
soru soru kareler, paylaşma tuşu ve günün sıralaması vardır; "Tekrar oyna" yoktur.

Gün serisi: en az bir meydan okumanın bitirildiği ardışık günler. Bir gün kaçırılırsa sıfırlanır; bugün henüz oynanmadıysa
dünden geriye sayılır. Paylaşım metni:

```
Harita Avcısı · 25 Ekim · Dünya
🟩🟩🟥🟩🟩🟩🟥🟩🟩🟩 8/10 · 01:12
```

Sunucu: `start_daily_round` turu açar (soruları `daily_challenges` tablosunda saklar), `daily_leaderboard` view'i bugünün
sonuçlarını, `my_daily` oyuncunun bugünkü durumunu ve serisini döndürür; tur ve sonuç `daily_day` sütununu taşır
(`lib/daily.ts`, `intro/DailyChallenge.tsx`: rozet ve alttan açılan sayfa).

### Profil

Hesap menüsündeki **Profilim** `/profil` sayfasını açar; profili yalnızca oyuncunun kendisi görür. Başlıkta profil
resmi, ad, hesap türü (Google / Misafir) ve ilk oyun tarihi; altında yarış özeti (tur, başarı oranı, en uzun seri,
oynanan gün), düellolar (oynanan, galibiyet, beraberlik, mağlubiyet), her sıralamadaki en iyi sonuç ve sıra ve son
10 yarış turu. Düello kartlarına dokununca alttan açılan sayfada o sonuçtaki düellolar listelenir (son 100): rakip, mod
ve kural, tarih, skor; hükmen biten düello işaretlenir. Misafir hesapta verinin çıkışta ya da cihaz
değişince kaybolacağı yazar. Antrenman kaydedilmediği için profilde yoktur; oda turları yarış turu sayılır. Veri tek bir
sunucu fonksiyonundan gelir (`my_profile`). Alttan açılan sayfa sıralamayla ortaktır (`BottomSheet.tsx`).

### Rozetler

17 rozet var (`lib/badges.ts`): gün serisi (3, 7, 30 gün), ilk günlük meydan okuma, tam gün (aynı gün beş meydan
okuma), Türkiye / Plaka / Dünya / Bayrak / Başkent'te 10/10, Şimşek (45 saniyenin altında 10/10), 81 il ve 100 ülke (yarışlarda
en az bir kez doğru bilinen farklı yerler), ilk ve 10. düello galibiyeti, Kürsü (bir sıralamada ilk üç) ve Zirve (bir
sıralamada birinci). Hangisinin kazanıldığını ve ilerlemeyi sunucu mevcut veriden hesaplar (`my_badges`); kazanılan rozet
`player_badges` tablosuna yazılır ve kaybolmaz (sıralamada geçilse de Kürsü kalır). Geçmişte hak edilmiş rozetler ilk
çağrıda verilir.

Profilde rozetler gruplarıyla (gün serisi, günlük meydan okuma, kusursuz tur, harita ustalığı, düello, sıralama) ve her
grupta kademe sırasıyla dizilir (3 → 7 → 30 gün); telefonda tek sütun, geniş ekranda gruplar iki sütunda. Her rozet bir
satırdır: kazanılanlar renkli ve tarihli, kazanılmamışlar soluk; nasıl kazanılacağı ve ilerlemesi (ör. "54/81") yazar. Yarış, günlük meydan okuma ve düello sonuç ekranında yeni kazanılan rozetler kısa bir kutlamayla çıkar (en fazla
üçü tek tek, fazlası "+2 rozet daha"); profile bağlantı verir.

### Harita

Harita tekerlek, sürükleme, iki parmakla sıkıştırma ve +/− tuşlarıyla yakınlaştırılıp kaydırılabilir. Dokunmatikte
parmak bir yere denk gelmezse (ör. Malta'nın yanında denize) 16 piksele kadar yakındaki yer seçilir; farede bu tolerans yoktur. Cevaba canlı tepki verilir: doğru yer bir an büyüyüp
yerine oturur, yanlış tıklanan yer sarsılır, puan yeşil yanıp büyür. Üç ve daha uzun doğru serisinde haritanın üstünde
"🔥 3 seri" rozeti belirir. Android'de (tarayıcı ve uygulama) doğru cevapta kısa, yanlışta çift titreşim olur
(`lib/haptics.ts`); iPhone Safari titreşimi desteklemez. Hareket azaltma açıksa animasyonlar oynamaz. Doğru cevap görünümün dışındaysa harita onu gösterecek şekilde kayar ve sonraki soruda oyuncunun bıraktığı görünüme döner.
Yanlış cevapta tıklanan yerin adı da kırmızı bir etikette yazar (plaka turunda plakasıyla), sonraki soruya geri sayımın
yanında: dikey telefonda soru şeridinde, yatayda haritanın üstünde. Yanlış cevapta doğru yer ekranda çok küçükse (24 pikselden küçük; ör. dikey telefonda Malta, Dominika) harita oraya
yumuşak bir geçişle yakınlaşır, sonraki soruda geri döner; doğru bilende harita yerinde kalır. Haritanın görünen alanı
ekranın en-boy oranındadır: açılışta harita tam sığar, yakınlaşınca dikey telefonda da ekranın tamamı dolar
(`useMapZoom.ts`).

Dikey telefonda oyunun üst barı iki satırdır: üstte çıkış / bitir, doğru sayısı, kalan süre ve yeni tur; altında tam
genişlikte soru şeridi (ad, büyük bayrak ya da plaka; cevaptan sonra seri ve sonraki soruya geri sayım). Düellodaki
şeritle aynı düzendir.

**Yön.** Tüm ekranlar ve oyunlar (antrenman, yarış, düello, oda turu) dikeyde de oynanır; telefonu yan çevirmek
zorunlu değildir. Harita dikeyde yaklaşık yarı boyuta indiği için haritanın sol altında kapatılabilir bir "Yan
çevirirsen harita büyür" ipucu durur. Mobil uygulamada ipucunun yerinde **Yatay moda geç** tuşu vardır (aşağıda).

Dikey telefonda ilk oyundan önce bir kez iki adımlı bir ipucu açılır (`PlayTips.tsx`): oyun ekranının üstünde bulanık
bir katmanda uygulamanın kartı, önce yan çevrilen telefonun içinde büyüyen harita, sonra iki parmakla Malta'ya
yakınlaşan harita animasyonu. Oyuncu ilk adımda telefonu yan çevirirse adım tamamlanmış sayılır ve kart iki parmak
adımına geçer; mobil uygulamada ilk adımda **Yatay moda geç** tuşu da vardır. Süreli oyunun süresi kart kapanınca
başlar. Düelloda geri sayım sunucuda işlediği için kart lobide çıkar (yön kilidi orada konmaz); odada turun başlatma
isteğinden önce çıkar. Görüldüğü cihazda hatırlanır; bir daha yalnızca tanıtımdaki **Telefonda** ekranında görülür.
Hareket azaltma açıksa animasyonların son karesi durağan gösterilir.

### Sağlamlık

- **Arka plana alma:** Turun saati duvar saatidir (`Date.now`); telefon kilitlenip açılınca ya da uygulamadan çıkıp
  dönülünce süre kaldığı yerden doğru işler ve kaydedilen süre sunucunun ölçtüğüyle uyuşur. Düello ve odada uygulamaya
  dönülünce ya da bağlantı gelince durum sıradaki yoklamayı beklemeden hemen sorulur.
- **Bağlantı kopması:** Bağlantı yokken ekranın altında bir uyarı durur (`ConnectionBanner`). Antrenman bağlantısız da
  oynanır; yarış, düello ve oda tuşları "Bağlantı yok" diyerek kapanır. Yarış skoru kaydedilemezse sonuç ekranında
  **Tekrar dene** çıkar ve bağlantı gelince kendiliğinden yeniden denenir. Tur başlarken sunucuda açılamadıysa skor
  sonradan kaydedilemez; sonuç ekranı bunu söyler.
- **Klavye:** Dokunmatik cihazda bir yazı alanına odaklanılınca klavye açıldıktan sonra alan ekranın ortasına kaydırılır
  (`KeyboardFocus`); yatay telefonda alt kartlardaki kod alanı klavyenin altında kalmaz.

### Dil (Türkçe / İngilizce)

Arayüz Türkçe ve İngilizcedir (`lib/i18n`). İlk açılışta cihazın / tarayıcının dili seçilir (Türkçeyse Türkçe, değilse
İngilizce); hesap menüsündeki Türkçe / English seçimi tarayıcıda hatırlanır. Dil değişince bütün sayfa o dilde yeniden
kurulur (`LocaleRoot`); bu yüzden bileşenler ve saf fonksiyonlar metni doğrudan `messages()`tan okur. Sunucuda ve ilk
çizimde Türkçe çizilir.

- **Sözlükler:** `tr.ts` şablondur; `en.ts` aynı yapıda olmak zorundadır, eksik çeviri derlemede ve testte yakalanır.
  Değişken içeren metinler fonksiyondur.
- **Yer adları:** ülkelerin ve başkentlerin İngilizce adları `places-en.ts`'te; `countryName` ve `capitalOf` arayüz
  dilindeki adı döndürür. İl adları özel isim olduğu için çevrilmez.
- **Sunucu mesajları:** `supabase/schema.sql`'in hata mesajları Türkçedir; İngilizce arayüzde `server-messages.ts`
  karşılığını gösterir. Sunucuya yeni bir mesaj eklenince buraya da eklenmeli; test bütün mesajları denetler.
- **Yasal sayfalar:** Gizlilik Politikası, Kullanım Koşulları, Hesap Silme ve KVKK Aydınlatma Metni iki dildedir
  (`LegalPage` dile göre birini gösterir). KVKK metninin İngilizcesi bilgi amaçlı çeviridir: aydınlatma yükümlülüğü
  Türkçe metinle yerine getirilir; İngilizce sayfanın üstünde esas metnin Türkçe olduğunu söyleyen not ve Türkçeye
  geçiş bağlantısı durur.
- **Logo ve başlık:** marka "Harita Avcısı" kalır; İngilizcede logonun altında küçük "Map Hunter" yazar. Sekmedeki sayfa
  başlığı da dile uyar.

### Paylaşım

Site bağlantısı LinkedIn, WhatsApp ya da X'te paylaşılınca logolu, Türkiye haritalı bir önizleme kartı çıkar
(`app/opengraph-image.png`, 1200×630; başlık ve açıklama `app/layout.tsx`'te). Görsel derlemede değil, sitedeki başlık
yazı tipiyle bilgisayardaki Chrome'da üretilir; logo ya da tanıtım cümlesi değişirse yeniden çalıştırılır:

```bash
node scripts/generate-og-image.mjs
```

Yarış sonucundaki **Skorumu paylaş** (antrenman skoru karşılaştırılabilir olmadığı için orada yok) telefonda sistemin paylaşma menüsünü açar ("Harita Avcısı'nda Dünya
yarışında 9/10 yaptım, süre 00:47. Sıralamada 3. sıradayım. Sen kaç yaparsın?" ve site bağlantısı); menü yoksa
(masaüstü tarayıcı, Android uygulaması) aynı metni panoya kopyalar.

### Uygulama olarak yükleme

Site telefona ve tablete uygulama gibi eklenebilir; ana ekranda **Harita Avcısı** adıyla nişangah simgesi görünür
ve tarayıcı çubukları olmadan, telefonun tutuluşuna göre açılır.

- **Android (Chrome):** menü (⋮) → **Uygulamayı yükle** ya da **Ana ekrana ekle**.
- **iPhone / iPad (Safari):** Paylaş → **Ana Ekrana Ekle**.

Tanım `app/manifest.ts`'te; simgeler `public/icons/` ve `app/apple-icon.png`.

### Mobil uygulama (Capacitor)

Site `next build` ile düz dosyalar olarak derlenir (`output: "export"`, çıktı `out/`). Aynı dosyalar Capacitor ile iOS
(`ios/`) ve Android (`android/`) uygulamasına girer; uygulama sayfaları cihazın içinden sunar. Bu yüzden sunucu gerektiren
Next.js özellikleri kullanılmaz: düello ve oda kodu adresin parçası değil sorgu dizgisidir (`/duello?kod=ABCD`), eski
`/duello/ABCD` ve `/oda/ABCD` bağlantıları `vercel.json`'da yeni adrese yönlenir.

Gerekenler: Xcode (iOS), Android Studio ve Java 21 (Android; Gradle 8 daha yeni Java ile çalışmaz, `JAVA_HOME` 21'i göstermeli).

```bash
npm run mobil     # derle ve iki platforma kopyala (cap sync)
npm run ios       # derle, kopyala, Xcode'da aç
npm run android   # derle, kopyala, Android Studio'da aç
```

İkon ve açılış ekranı `scripts/generate-app-assets.mjs` ile logodaki nişangahtan üretilir; iOS dosyalarını betik
kendisi yazar, Android boyutlarını `capacitor-assets` üretir (komut betiğin başında). iOS açılış ekranı tam ekran bir
resim değil, `LaunchScreen.storyboard`'da düz zemin ve ortada rozettir.

Uygulama sitedeki gibi dikeyde de açılır (iPhone'da `Info.plist`, Android'de `AndroidManifest.xml`). Dikeyde oyun
haritasının sol altındaki **Yatay moda geç** ekranı yataya kilitler (`@capacitor/screen-orientation`, `lib/orientation.ts`;
telefonun yön kilidi açık olsa bile döner); oyun haritası kapanınca kilit kalkar.

Uygulamaya özgü davranışlar:

- **Android geri tuşu** (`NativeBackButton`, `lib/hooks/useBackHandler.ts`): önce açık pencere (giriş, sıralama,
  tanıtım, hesap silme) kapanır; oyundan ve sonuçtan ana menüye, giriş adımından ayarlara dönülür; düello ve oda
  turunda çıkış onayı sorulur. Bunlar yoksa geçmişte geri gidilir (ayar ekranından oyun seçimine), geçmiş de yoksa
  uygulamadan çıkılır.
- **Titreşim** (`@capacitor/haptics`, `lib/haptics.ts`): uygulamada iPhone'da da çalışır; doğru cevapta "başarılı",
  yanlışta "hata" dokunuşu.
- **Paylaşım** (`@capacitor/share`, `lib/share.ts`): uygulamada sistemin paylaşma menüsü açılır (Android'in
  WebView'inde tarayıcının paylaşma API'si yok).

Uygulama kimliği
(`capacitor.config.ts` → `appId`) şimdilik geçicidir; mağazaya ilk yüklemeden sonra değiştirilemez.

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır. Antrenman Supabase olmadan da oynanabilir; yarış turları için aşağıdaki Supabase kurulumu gerekir.

### Testler

```bash
npm test
```

Testler `tests/` altındadır (Vitest) ve tarayıcı ya da Supabase gerektirmez:

- `game.test.ts`, `daily.test.ts`: tur seçimi, sıralamalar, etiketler, günün Türkiye saatiyle değişmesi, paylaşım metni.
- `data.test.ts`: 179 ülkenin ve 81 ilin haritada olması, kıtalar, başkentler, rozet kimlikleri.
- `sql.test.ts`: `supabase/schema.sql` bellekte çalışan bir PostgreSQL'e (PGlite) yüklenir; Supabase'in `auth` şeması ve
  rolleri en küçük hâliyle taklit edilir. Puanın ve serinin sunucuda hesaplanması, uydurulmuş ya da sırası değiştirilmiş
  soruların reddi, günlük meydan okuma (herkese aynı sorular, günde bir hak, seri), başkent havuzu ve rozetler denenir.
  Şemaya dokunan her değişiklikten sonra çalıştırın.

## Proje yapısı

```
app/
  page.tsx              Oyun durumu, zamanlayıcılar ve ekranlar arası akış
  layout.tsx            Kök düzen, viewport ve başlık yazı tipi
  icon.svg              Nişangah favicon'u
  apple-icon.png        iOS ana ekran simgesi
  manifest.ts           Uygulama olarak yükleme tanımı (ad, simgeler, yatay açılış)
  globals.css           Tailwind, harita SVG'si için stiller ve açılış animasyonu
  components/
    IntroScreen.tsx     Giriş ekranı: oyun seçimi (adım 1) ve ayarlar (adım 2), açılış animasyonu
    intro/              Giriş ekranının parçaları: iki grup kartı ve kod alanı (ModeGrid), ortak adım 2 düzeni
                        (SetupParts), Yarış/Antrenman, Düello ve Oda ayarları, oyunların ve grupların renk ve
                        simgeleri (games.tsx)
    MapDemo.tsx         Haritada soru-cevap döngüsü: adım 2'deki canlı önizleme ve tanıtımın harita demosu
    AuthPanel.tsx       Yarış öncesi giriş adımı (Google / misafir)
    GameTopBar.tsx      Oyun sırasındaki üst bar (soru, bayrak, puan, süre)
    GameMap.tsx         Tıklanabilir harita, yakınlaştırma tuşları
    ResultScreen.tsx    Tam ekran sonuç: skor ve yanında seri / süre, tekrar oyna + paylaş, başka tur seç, en çok yanlış yapılanlar, sıralama; antrenman özeti
    Logo.tsx            Nişangah rozetli oyun adı (giriş ve sonuç ekranlarının başlığı)
    MostMissed.tsx      Sonuç ekranındaki "En çok yanlış yapılanlar" listesi
    Leaderboard.tsx     Sekmeli sıralama listesi
    LeaderboardPanel.tsx Giriş ekranından açılan sıralama katmanı
    RoundControls.tsx   Oyun sırasında turu yeniden başlatma / tur değiştirme
    PlayButton.tsx      Rozetli oyna tuşu
    duel/               Düello: lobi, oyun, sonuç ve ortak parçalar (DuelScreen hepsini yönetir)
    room/               Oda: lobi, oda panosu (sıralama, kürsü), odadaki tur (RoomScreen yönetir)
    SignInPanel.tsx     Düello ve oda için giriş adımı (Google / misafir)
  duello/page.tsx       Düello sayfası; kodu sorgu dizgisinden (?kod=) okuyup DuelScreen'i çizer
  oda/page.tsx          Oda sayfası; kodu sorgu dizgisinden (?kod=) okuyup RoomScreen'i çizer
lib/
  game.ts               Ortak tipler, tur seçimi (PlayChoice), sıralama tanımları (BOARDS)
  intro-preferences.ts  Giriş ekranı seçimlerini (son oyun, harita, kapsam, soru tipi, düello ayarları) tarayıcıda saklar
  hooks/
    usePlayer.ts        Supabase oturumu
    useMapMarkup.ts     SVG haritayı indirip önbelleğe alır ve tıklanabilir yapar
    useMapZoom.ts       viewBox tabanlı yakınlaştırma, kaydırma ve açılış görünümü
    useMostMissed.ts    location_stats view'inden o modda en çok yanlış yapılan yerleri çeker
    useLeaderboard.ts   Yarış turunu sunucuda açar ve sorularını alır (start_ranked_round), sonucu tur başına bir kez kaydeder
                        (finish_round), sıralamaları çeker, realtime abonelik.
                        useLeaderboards ise kayıt yapmadan yalnızca okur (giriş ekranındaki panel)
  turkish-plates.ts     81 il + plaka kodu
  world-capitals.ts     Başkent turunda sorulan 174 ülkenin Türkçe başkent adları
  world-countries.ts    179 ülke + ISO kodu; eski "normal" düellolarının havuzu ("common"), kıta listeleri, kıta görünümleri ve kapsamlar (WorldScope)
  shuffle.ts            Fisher-Yates karıştırma
  supabase.ts           Supabase istemcisi (env yoksa null döner)
  auth.ts               Google ve misafir girişi (ana sayfa ve düello ortak kullanır)
  duel.ts               Düello tipleri, kurallar, modlar ve yer kimliğinden soruya geçiş
  hooks/useDuel.ts      Düelloya katılır, durumu düzenli aralıklarla sorar, cevap / hazır / rövanş işlemleri
  hooks/useRoundPlay.ts Bir turun oynanışı (sorular, 120 sn, 3 sn gösterim, puan ve seri); ana sayfa ve oda kullanır
  room.ts               Oda tipleri ve ayar seçenekleri
  hooks/useRoom.ts      Odaya katılır, durumu yoklar, odayı ve turları başlatır
scripts/
  generate-duel-pools.mjs  Soru havuzlarını world-countries.ts ve world-capitals.ts'ten schema.sql'e yazar
tests/                  Birim ve sunucu testleri (npm test)
public/maps/            turkey.svg, world.svg
public/flags/           179 ülkenin 4:3 bayrakları (<iso>.svg)
supabase/schema.sql     do_harita_avcisi şeması: tablolar, RLS politikaları, tur fonksiyonları, leaderboard ve location_stats view'leri, realtime
```

### Haritalar, bayraklar ve yazı tipi

Tüm varlıklar projeyle birlikte sunulur; çalışma zamanında dış bir CDN'e istek yapılmaz.

| Varlık | Kaynak | Lisans |
| --- | --- | --- |
| `maps/turkey.svg` | [dnomak/svg-turkiye-haritasi](https://github.com/dnomak/svg-turkiye-haritasi) | MIT |
| `maps/world.svg` | [flekschas/simple-world-map](https://github.com/flekschas/simple-world-map) | CC BY-SA 3.0 |
| `flags/*.svg` | [lipis/flag-icons](https://github.com/lipis/flag-icons) 7.5.0 | MIT |
| Başlık yazı tipi | [Stack Sans Notch](https://fonts.google.com/specimen/Stack+Sans+Notch), `next/font` ile derlemede gömülür | OFL 1.1 |

Türkiye haritasında Kıbrıs vardı; hiç sorulmadığı (ve kuzeyi "00" koduyla tıklanabildiği) için haritadan çıkarıldı ve
haritanın görünüm kutusu Türkiye'ye göre daraltıldı. Tıklanabilir alanlar Türkiye haritasında `data-plakakodu`, dünya haritasında ISO 3166-1 alpha-2 `id` değeri üzerinden eşleştirilir; bayrak dosyaları da aynı ISO koduyla adlandırılır. Kıta görünümleri `world.svg` koordinatlarıyla `world-countries.ts` içinde sabit tanımlıdır: bazı ülkelerin şekilleri denizaşırı topraklarını da içerdiği için kutudan türetilmez.

## Supabase ve oturum açma

1. Supabase projesi oluşturun.
2. SQL Editor'de [`supabase/schema.sql`](../supabase/schema.sql) dosyasını çalıştırın. Her şey `do_harita_avcisi` şemasında kurulur, böylece aynı Supabase projesindeki başka uygulamalarla karışmaz. Dosya idempotent'tir; şema değiştiğinde (ör. yeni bir `variant` eklendiğinde) tekrar çalıştırın. `create table if not exists` var olan tablonun kısıtlarını değiştirmediği için, kurulu bir veritabanında böyle değişiklikler (ör. tür listesindeki bir kısıt) tek seferlik bir geçiş dosyasıyla yapılır (`supabase/YYYY-MM-ad.sql`); dosya SQL Editor'de bir kez çalıştırılır ve sonra depodan silinir, kalıcı tanım `schema.sql`'de kalır.
3. Settings > API > **Exposed schemas** listesine `do_harita_avcisi` ekleyin; istemci bu şemaya bağlanır (`lib/supabase.ts`'teki `SUPABASE_SCHEMA`).
4. Authentication > Providers altında **Google** ve **Anonymous sign-ins** sağlayıcılarını etkinleştirin. Google Cloud OAuth istemcinizde Supabase'in callback URL'sini yetkili yönlendirme adresi olarak ekleyin.
5. `.env.example` dosyasını `.env.local` olarak kopyalayın ve proje URL'si ile Publishable Key değerlerini girin.
6. Authentication > URL Configuration ekranında Site URL `https://haritaavcisi.com` olmalı. Redirect URLs listesine yerel
   adresinizi, `https://haritaavcisi.com/**`, `https://www.haritaavcisi.com/**` ve Vercel önizleme adreslerini ekleyin. Mobil uygulamanın
   Google girişinden dönebilmesi için Redirect URLs listesinde `com.haritaavcisi.app://auth/callback` de bulunmalı.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### Hesap silme

Giriş yapmış oyuncu hesabını uygulamanın içinden kalıcı olarak silebilir (App Store ve Google Play bunu şart koşar):
ana menüdeki hesap menüsü → **Hesap silme** sayfasının sonundaki **Hesabımı sil** (`legal/AccountDeletionPanel.tsx`). Tuş ana
ekranda durmaz; orada görünmesi insanı silmeye yöneltir. Onaydan sonra `delete_my_account()` fonksiyonu oturumdaki kullanıcının `auth.users`
satırını siler; skorlar, turlar, cevaplar, düellolar ve odalar `on delete cascade` ile birlikte gider.

### Veri modeli

Yarış sonuçları `game_results` tablosunda tutulur; antrenman sonuçları hiç kaydedilmez. Her satır `game_mode` (`turkey` / `world`) ve `variant` ile bir sıralamaya bağlanır:

| Sıralama | `game_mode` | `variant` |
| --- | --- | --- |
| Türkiye | `turkey` | `normal` |
| Plaka | `turkey` | `plates` |
| Dünya | `world` | `hard` |
| (eski) Dünya · Normal | `world` | `normal` |
| Bayrak | `world` | `flags` |
| Başkent | `world` | `capitals` |

Dünyanın 58 tanınmış ülkelik `normal` türü oyundan kaldırıldı: arayüzde seçilemez, sıralaması gösterilmez, eski
skorlar tabloda durur. Sunucu bu türü güncellenmemiş uygulamalardan gelebilecek istekler için kabul etmeye devam eder;
eski `normal` düello ve odalar "Dünya · Tanınmış ülkeler" diye görünür, rövanşları 179 ülkelik modla kurulur.

RLS politikaları sıralamayı herkese açar: giriş yapmamış ziyaretçi de sıralamayı okuyabilir. Tarayıcının
tabloya yazma izni yoktur; sonuçlar yalnızca sunucudaki fonksiyonlarla kaydedilir:

- `start_ranked_round(game_mode, variant)`: yarış turu başlarken `game_rounds` tablosunda bir tur açar, 10 sorusunu
  sunucuda seçer (düello ve odayla aynı havuzdan, `duel_pool`) ve turla birlikte saklar; tur kimliğini ve soruları
  sırayla döndürür. Tur tarayıcıda ancak sorular gelince başlar (arada "Tur hazırlanıyor" katmanı); süre sorular gelince
  işlemeye başlar. Sunucuya ulaşılamazsa tur yerel sorularla oynanır ve sonucu kaydedilemez.
- `start_round(game_mode, variant)`: eski yol. Yalnızca tur açar, soruları tarayıcı seçer; güncellenmemiş uygulamalar
  ve `start_ranked_round` eklenmemiş bir veritabanı için durur (istemci "fonksiyon yok" yanıtında buna döner). Bütün
  uygulamalar güncellendiğinde kapatılmalı: o zamana kadar bu yolla açılan turun sonucu yalnızca süre ve biçimden
  denetlenir.
- `finish_round(round_id, duration_ms, answers)`: `answers`, cevaplanan soruların sırayla listesidir
  (`[{"location": "34", "selected": "41"}, ...]`). Puanı ve en uzun seriyi bu listeden kendisi hesaplar; turun
  oyuncuya ait olduğunu, daha önce kaydedilmediğini ve sürenin mümkün olduğunu denetleyip sonucu yazar. Turun soruları
  sunucuda seçildiyse cevapların sırayla tam o sorulara verildiğini de doğrular; tarayıcı kendi seçtiği sorularla
  uydurulmuş bir sonuç gönderemez.
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
`lib/world-countries.ts` ya da `lib/world-capitals.ts` değişirse `node scripts/generate-duel-pools.mjs` çalıştırılıp
`schema.sql` yeniden uygulanır. Başkent havuzu, başkenti listede olan ülkelerdir.

### Oda

`rooms` (ayarlar, başlama ve bitiş anı), `room_players` ve `room_questions` (her turun 10 sorusu) tabloları tarayıcıya
kapalıdır. Odadaki bir tur, `game_rounds` ve `game_results` tablolarında `room_id` / `room_round` ile işaretli normal bir
yarış turudur; bu yüzden `finish_round`'un bütün denetimlerinden geçer ve genel sıralamaya da yazılır. Oda turunda
`finish_round` ayrıca cevapların sırayla o turun sorularına verildiğini doğrular.

| Fonksiyon | İş |
| --- | --- |
| `create_room(name, mode, variant, round_count, duration_minutes, max_players)` | Oda kurar, kodu döndürür |
| `code_kind(code)` | Ana ekrandaki kod alanı için kodun düelloya mı odaya mı ait olduğu (giriş gerekmez) |
| `join_room(code)` | Lobideyse ve yer varsa oyuncuyu ekler; değilse katılamama nedeniyle durumu döndürür |
| `get_room(code)` | Oda durumu ve sıralaması |
| `start_room(code)` | Oda sahibi başlatır; her turun soruları seçilir (turlar arasında tekrar yok) |
| `start_room_round(code, round)` | Sıradaki turu açar ve sorularını döndürür; turlar sırayla, birer kez |
| `abandon_round(round_id)` | Oyuncu turu bırakır; tur hemen "yarım" sayılır |

## Vercel ile yayınlama

1. Depoyu Vercel'e içe aktarın; `main` dalına her push yeni bir production derlemesi başlatır.
2. Vercel Project Settings > Environment Variables altında iki `NEXT_PUBLIC_SUPABASE_*` değişkenini ekleyin.
3. Yayınlanan alan adını Supabase Authentication URL Configuration'a ekleyin.

Ziyaret istatistikleri Vercel Web Analytics ile tutulur (`app/components/WebAnalytics.tsx`): çerezsiz, yalnızca
sitede; mobil uygulamada yüklenmez. Sorgu dizgisi (`?kod=…`) ve adresin `#` parçası (web'de Google girişinden dönen
oturum belirteci) gönderilmeden atılır. Veri toplanması için Vercel Project Settings > Analytics'te açılması gerekir.

Bir derleme hazır olduğu halde yayına alınmadıysa (ör. önceki bir Instant Rollback sonrası), Deployments listesinde **⋯ → Promote to Production** ile yayına alınabilir.

## Google Play sürümü

```bash
npm run android:release
```

`scripts/android-release.mjs` versionCode'u bir artırır, versionName'i `package.json`'daki sürümden alır, siteyi
derleyip Android projesine kopyalar ve imzalı paketi `release/harita-avcisi-<sürüm>-<kod>.aab` olarak bırakır
(depoya girmez). Derleme başarılı olunca `android/app/build.gradle`'daki sürüm değişikliği commit edilir.

Paket, Play App Signing'e yüklenen **yükleme anahtarıyla** imzalanır. Anahtar depoda değil:
`~/.android-anahtarlar/harita-avcisi/` altında `upload-keystore.jks` ve şifresini taşıyan `keystore.properties`
(yol `HARITA_AVCISI_KEYSTORE` ile değiştirilebilir). İkisi birlikte yedeklenmeli; kaybolursa Play Console'dan yükleme
anahtarı sıfırlama istenir. Uygulamanın asıl imza anahtarını Google saklar.

## Kontroller

```bash
npm run lint
npm run build
```
