# Harita Avcısı · Geliştirici notları

Oyunun ayrıntılı kuralları, kurulum, Supabase veri modeli ve mobil uygulama derlemesi. Kısa tanıtım için
[README](../README.md).

## Oyun

Ana ekran, oyun ve sonuç ekranı koyu bir deniz zemininde durur (`.sea-backdrop`); tuşlar altındaki kalın kenarla
basılabilir oyun tuşlarıdır (`.press`, kenar rengi `--press-edge`), basınca kenarın içine iner. Bu sayfa açıkken iOS
uygulamasında durum çubuğu yazıları açık renklidir, tarayıcı çubuğu deniz rengine boyanır (`DarkSystemBars`); düello, oda
ve profil sayfaları açık zeminlidir.

Giriş ekranı iki adımlıdır (`intro/ModeGrid.tsx`). İlk adımda en üstte büyük, yeşil ve hafifçe nabız gibi atan
**OYNA** tuşu durur: simgesi solda, "OYNA" ve altında kuralı ("10 soru · 120 sn · giriş gerekmez") sola yaslı, yani Antrenman ve
Arkadaşlarla tuşlarıyla aynı düzende (simge iki satıra yayıldığı için onlardan büyüktür). OYNA, Oyna'nın mod ekranını açar.
Hemen altında yan yana iki tuş durur: sarı **Antrenman** (alt satırı "Süre yok, sınır yok"; simgesi antrenman konisidir ve ayar ekranının rozetinde ile tanıtımda da aynıdır, tek tanım `GameIcon`'un `practice` dalı; Antrenman'ın mod ekranını açar) ve
turuncu **Arkadaşlarla** (Düello, Oda ve kodla katılma). Genel sıralama ve liderler panosu yoktur. Davetle gelen oyuncu
kodu Arkadaşlarla ekranındaki alana yazıp **Katıl**'a basar; düello ve oda kodları aynı biçimde olduğu için kodun
hangisine ait olduğunu sunucu söyler (`code_kind`, `lib/join-code.ts`), kod bulunamazsa alanın altında yazar.
**Haritayı tamamla** kutusu (Ülkeler, İller, İlçeler) bunların yanında ya da altında durur. En altta, tam genişlikte
**Günün meydan okuması** girişi (yalnızca Supabase tanımlıysa) açık sayfanın kapalı başlığı gibi görünen tek bir
şerittir (`DailyEntry`). **Dikey telefonda** (`portrait-phone`) ekranın altına sabittir (`DailyDock`): tam genişlikte, üst
köşeleri yuvarlak, üstünde küçük bir tutamaç çizgisi ve alttaki güvenli alan payı (`safe-area-inset-bottom`) vardır;
ızgara şerit kadar alt boşluk bırakır ki son satır altında kalmasın. Şerit yalnızca ana ekranda çizilir: Oyna,
Antrenman, Arkadaşlarla ekranlarında, tanıtım açıkken ve günlük sayfası açıkken görünmez. **Geniş ve yatay ekranda**
şerit akışta durur, en çok 36rem genişliğinde ve iki sütunun altında ortalıdır, basılabilir bir oyun tuşu gibidir.
Şeritte bugünkü durum (Bugün 1/5; hepsi bitince "Bugünün hepsi tamam" ve yeşil), gün serisi ve sonraki meydan okumaya
kalan süre yazar; bugünün durumu zaten "1/5" gibi yazıldığı için ayrıca nokta ya da rozet yoktur. **Oynanmamış mod varken şerit nefes alır**
(`daily-breathe`, `globals.css`): Oyna'dan daha yumuşak (en çok %1,5 büyür, Oyna %2,5) ve yarım tur geç başlar (1,2 sn gecikme), yani ikisi
sırayla atar ve dikkat için yarışmaz; beş mod da bitince durur ve yeşil kalır. Telefondaki sabit alt şerit büyümez (kenarlardan taşardı),
yalnızca parlaklığı atar (`daily-glow`). Hareketi azaltma ayarı açıkken ikisi de durur. Dokununca günün meydan okuması alttan
açılır (`DailySheet`; geniş ekranda ortada pencere) ve arka plan belirgin biçimde bulanıklaşıp kararır (`BottomSheet`,
`isFocused`); arka plana dokunmak, ✕, Esc ve Android geri tuşu kapatır. Şerit ile sayfa ayrı öğelerdir (şerit büyüyüp
sayfaya dönüşmez); sayfa açıkken şerit gizlenir. Sayfada üstte tarih, seri ve kalan süre, altında bir kural notu ("Her mod günde bir kez
oynanır; başlatıp bırakırsan hakkın gider") ve iki bölüm durur. Bölüm başlıkları Oyna ekranındakiyle aynı bileşendir
(`SectionTitle`): Türkiye'de Türk bayrağı, Dünya'da dünya simgesi ve haritanın adı, yanında ince bir çizgi; günlük
sayfası açık zeminli olduğu için başlık koyu yazıyla çizilir (`tone="light"`). Bölümün modları **yan yana** kartlardır:
Türkiye'de iki (**İller**, **Plakalar**), Dünya'da üç (**Ülkeler**, **Bayraklar**, **Başkentler**); adlar Oyna
ekranıyla aynıdır. Her kartta üstte mod adı, altında bugünkü durum yazar: oynanmamış mod açık gül tonunda ve "Başla ›",
bitirilen yeşil ve "✓ 8/10" (sıra kartta yazmaz; sonucun ayrıntısında görünür), bırakılan gri ve "Bırakıldı". Durum yalnızca renkle değil yazıyla da söylenir ve
çarpı kullanılmaz: oynanmamış mod hâlâ yapılabilir, bırakılan mod bugün için bitmiştir. Oynanmamış moda dokununca tur
başlar. Bitirilmiş ya da bırakılmış moda dokununca sayfa o modun ayrıntısına geçer: oyuncunun sonucu, paylaşma tuşu ve
günün sıralaması; **Modlara dön** ile liste açılır (liste ve ayrıntı aynı anda gösterilmez, sayfa telefonda uzamasın
diye). Sunucu ve rozetler değişmedi: beş mod duruyor, yalnızca sunum değişti.
Geniş ve yatay ekranda iki sütundur: solda OYNA ile altındaki iki tuş, sağda Haritayı tamamla; günlük girişi altlarında
ortada durur. Dikey telefonda hepsi alt alta ve günlük girişi altta sabittir. Ekran yetmezse (küçük telefon) liste kayar.
400 pikselden dar ekranlarda başlıktaki logo küçülür, 360 pikselden dar ekranlarda nişangah rozeti gizlenir. Zeminde
silik enlem-boylam çizgileri ve dünya haritası vardır. Çok geniş ekranda içerik ortada en fazla 80rem genişlikte durur
ve yazılar büyür. Yasal sayfalar (Gizlilik, KVKK, Koşullar, Hesap silme) ekranın altında satır
kaplamaz; başlığın sağındaki hesap menüsündedir (`AccountMenu`): profil resmine (giriş yoksa kişi simgesine) dokununca
açılır, içinde oyuncunun adı, tanıtımı yeniden açan **Nasıl oynanır?**, dil seçimi, ses efektlerini açıp kapatan
**Ses açık / kapalı**, yasal sayfalar ve **Çıkış yap** durur. Logo ve hesap
menüsü yalnızca ana ekranın başlığındadır: mod ve kurulum ekranlarında ← tuşu, sonuç ekranında **Ana menü** bağlantısı,
düello ve oda lobisinde ve profilde sol üstteki ev tuşu (`HomeButton`) ana menüye döner. Yasal sayfalar logolu
başlığını korur.

İkinci adımda harita ve soru tipi ayrı ayrı seçilmez: beş mod tek seçimdir: **İller**, **Plakalar** (Türkiye), **Ülkeler**,
**Bayraklar**, **Başkentler** (Dünya). Oyna ve Antrenman bunları gruplanmış listeyle (`intro/ModeList.tsx`), Düello ve Oda renkli
küçük karolarla (`intro/ModeTiles.tsx`) gösterir.

**Oyna ve Antrenman** (`intro/SoloSetup.tsx`): üstte **←** tuşu ve oyunun adı; altında **"Nasıl oynamak istersin?"** soru biçimi
seçicisi (`intro/StylePicker.tsx`); altında **Türkiye** ve **Dünya** listeleri.

- **Soru biçimi seçicisi** üç büyük karttır (simge, başlık, tek satır açıklama): **Haritaya dokun**, **Şıklı**, **Komşuluk**. Seçili kart
  oyunun renginde dolar. Şıklı ve Komşuluk'ta, oyuncu o biçimi bir kez seçene kadar **YENİ** rozeti görünür; bu yalnızca cihazda bir
  bayraktır (`harita-avcisi:style-choose-seen`, `style-neighbors-seen`), sunucuya ya da analitiğe bir şey gitmez. Kartlar rem tabanlı otomatik ızgarada durur (`repeat(auto-fit, minmax(5.5rem, 1fr))`): normal yazıda üç sütun, telefonda büyük yazı ayarı
  açıkken iki ya da bir sütun; böylece başlık ("Haritaya dokun") kelime ortasından bölünmez ve kırpılmaz, dar ekranda gerekirse iki satıra iner.
  Kartlardaki kısa açıklama 416 pikselin altında ve alçak ekranda gizlenir; seçili biçimin açıklaması kartların altında tek satır olarak görünür. Seçici bir
  mod değil bir biçimdir ve beş modun hepsine uygulanır; Komşuluk bunun tek istisnasıdır (aşağıda).
- **Mod listeleri** iPhone Ayarlar gibi tek bir kapta, ince çizgilerle ayrılmış satırlardır. Her satırda solda modun görseli
  (Türk bayrağı, plaka, dünya, bayrak destesi, başkent binası), ortada adı ve kaç yerden sorulduğu, sağda **Başla** tuşu durur;
  satırın tamamı da dokunmayla başlatır (küçük tuş tek hedef olsaydı dokunma alanı daralırdı). **Renk tektir**: Türkiye kırmızı, Dünya
  mavi; eskiden beş modun beş ayrı rengi göz yoruyordu, artık modlar renkle değil görselleriyle ayrışır. Dikey telefonda bölümler alt alta,
  alçak ve geniş ekranda yan yana durur (Dünya daha geniş sütunda). Dar ekranda (≤360 piksel) **Başla** yazısı gizlenir, yalnızca oynat
  simgesi kalır. Harita henüz yüklenmediyse satır "hazırlanıyor" der ve kapalıdır.
- **Komşuluk seçiliyken** yalnızca **İller** satırı kalır: Plakalar satırı ve bütün Dünya bölümü gizlenir (kapalı gri satır yerine, liste
  dağınık görünmesin ve "neden kapalı" sorusu doğmasın) ve İller listesi en çok 42rem genişliğinde durur. Ülkeler ve Bayraklar için
  komşuluk eklenirse bu satırlar listede kalır.
- Giriş gerekmez, bağlantı yokken de oynanır. Antrenmanda Dünya bölümünün başlığının **bir alt satırında** kıta seçimi durur (Tümü, Afrika,
  Amerika, Asya, Avrupa); yan yana olunca dar ekranda taşıp yatay kayıyordu, şimdi sarmalanır ve hiçbir seçenek gizlenmez (360-412 pikselde tek
  satır, 320'de iki satır). Ülkeler ve Bayraklar'ın sayısı seçilen kıtaya göre değişir.

**Düello ve Oda** (`intro/SetupParts.tsx`, `SetupShell`): solda üstte **←** ve oyunun adı, altında aynı beş mod küçük
karolar olarak (seçili olan parlak, diğerleri soluk) ve bu seçimle dönen canlı önizleme: haritada soru çıkar ("🏛️ Kanberra
hangi ülke?"), bir saniye sonra doğru yer yeşil yanar, sonraki soruya geçilir. Önizleme, küçük haritada da görünsün diye
büyük ve tanınır yerlerden sorar; hareket azaltma açıksa durur. "Nasıl oynanır?" demosuyla aynı bileşendir
(`MapDemo.tsx`). Soru tipinin ne demek olduğu ("Başkent gelir, ülkesini bul") haritanın sol alt köşesinde kısa bir not
olarak durur.

Önizleme haritası oyun haritası gibi denizde kum rengidir. Sağdaki panelin en üstünde oyunun renginde büyük, basılabilir
eylem tuşu (**Düelloyu kur**, **Odayı kur**), altında **Ayarlar**: düelloda kural, odada ad, tur sayısı, süre ve kişi
sınırı. Alçak (yatay telefon) ekranda beş mod karosu tek satırdır, görselleri gizlenir; ayarların etiketi solda, seçici
sağda olur. Dikey telefonda harita kartı ekranın boş kalan yerini alır. Başlıktaki logo
her adımdan ilk adıma döner. İkinci adım tarayıcı geçmişine bir kayıt olarak eklenir (adres değişmez); telefonda geri
hareketi siteden çıkmaz, oyun seçimine döner. Tüm seçimler tarayıcıda hatırlanır.

Sayfa açılınca deniz zemininde kısa (~2,4 sn) bir açılış animasyonu oynar: arkada silik bir Türkiye haritası belirir
(`public/maps/turkey-outline.svg`, ~10 KB, `npm run maps:districts` üretir); büyük nişangah simgesi haritanın batısından
gelip üzerinde hedef arar gibi kayar, İç Anadolu'ya kilitlenir ve etrafından bir halka yayılır; hemen altında "harita
avcısı" açılır (alt alta, `Logo size="curtain"`), ekranın en
altında küçük ve soluk "doğan oğultürk" imzası gelir, sonra katman çekilir (`IntroCurtain`). İlk ziyarette açılış animasyonundan sonra bir tanıtım açılır (`intro/Guide.tsx`): nasıl oynanır (gerçek
Türkiye ve dünya haritalarında isim, plaka, bayrak ve başkent soruları; sorulan yer yeşil yanar), dokunmatik cihazda **Telefonda**
(yan çevir ve iki parmakla yakınlaştır animasyonları), tek başına ve arkadaşlarla oynanan oyunlar, arkadaşlarla oynamak. Kaydırarak, ok tuşlarıyla ya da alttaki
tuşlarla gezilir; **Geç** her ekranda durur. Son ekranın asıl tuşu **Başlayalım** ana ekrandaki oyun seçimine döner; giriş
yapılmamışsa Google ve misafir girişi seçenek olarak sunulur. Görüldüğü tarayıcıda hatırlanır, giriş yapmış oyuncuya
gösterilmez; başlıktaki hesap menüsünde **Nasıl oynanır?** ile yeniden açılır.

Sayfa ilk açıldığında oyunun adı ekranın ortasında belirir, ardından bu katman çekilerek seçim ekranı açılır.
Açılış sayfa yaşamı boyunca bir kez oynar; oyundan ana menüye ya da **←** ile ilk adıma dönüşte
tekrarlanmaz, kartlar beklemeden görünür. Hareket azaltma açıksa hiç gösterilmez.

### Oyna

Giriş gerekmez. Her tur 10 soru ve toplam 120 saniyedir. Doğru cevaptan sonra yaklaşık 1 saniyede sonraki soruya geçilir;
yanlış cevapta doğru yer (ve tıklanan yerin adı) en fazla 3 saniye gösterilir, haritaya dokununca ya da klavyede Enter ile
hemen geçilir (cevaptan sonraki ilk 350 ms'de yanlışlıkla çift dokunuş sayılmaz). Günün meydan okumasında ve oda turunda
bu kısa gösterim kapalıdır: herkes her cevaptan sonra aynı 3 saniyeyi bekler (`useRoundPlay`, `isQuick`).

**Kayıt.** Giriş yapmış oyuncunun turu sunucuda açılır (`start_ranked_round`), bitince `finish_round` ile kaydedilir:
profil, rozetler ve "en çok yanlış yapılanlar" bu kayıtlardan hesaplanır. Girişsiz oyuncunun turu yerel sorularla oynanır
ve hiçbir yere kaydedilmez; sonuç ekranında giriş daveti çıkar ve bu turun kaydedilmediğini söyler. Genel (tüm zamanların)
sıralaması yoktur; herkese açık tek sıralama günün meydan okumasınındır. Giriş ekranının sağ üstündeki **Giriş yap** ile
oyuncu istediği an giriş yapabilir (Google, iOS'ta Apple ya da misafir adı; misafir adı alanında öneri yoktur, yalnızca
"Görünecek adın" yer tutucusu durur ve ad boşken tuş pasiftir). Giriş yalnızca günün meydan okuması, düello ve oda için zorunludur.

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

Sonuç ekranı bu oturum odaklıdır (`SessionReview.tsx`). Solda dar özet kartında skor, seri, süre ve soru başına küçük
kareler (yeşil doğru, kırmızı yanlış) ile tuşlar durur. Karelerin hemen altında **Yanlış cevapladıkların** her zaman açıktır
(`WrongAnswers`): her yanlış tek satırdır, solda sorulan yer (bayrak turunda bayrak, plaka turunda plaka, başkent turunda
"Kanberra · Avustralya"), sağında oyuncunun tıkladığı yer ("Sen: Sivas"; dikey telefonda yer kazanmak için alt satır
yok). Hiç yanlış yoksa bölüm çizilmez. Uzun antrenmanda ilk altı yanlış görünür ("Hepsini göster"). Sağdaki geniş
alanda **Doğru cevapladıkların** kapalı başlar (`RightAnswers`), açılınca kompakt etiketler gösterir; altında geri planda
en çok yanlış yapılanlar durur. Günün meydan okuması sonucu eski düzenini korur (`RoundReview`: kareler ve "Soruları gör").

Tur bitince sonuç ekranında asıl tuş **Tekrar oyna** aynı turu yeniden başlatır; **Başka tur seç** Oyna'nın ayar
ekranını açar (antrenmanda **Tekrar antrenman** ve **Başka antrenman seç**). Yatay telefonda sonuç ekranı iki
sütundur: solda özet ve tuşlar, sağda tur dökümü, (girişsizse giriş daveti ve) giriş yapmış oyuncunun kendi zayıf yerleri,
geri planda herkesin en çok yanlış yaptıkları.

**Senin zayıf yerlerin** (`WeakSpots.tsx`, `useWeakSpots.ts`, sunucuda `my_weak_spots`): giriş yapmış oyuncuya, o modda
yalnızca kendi cevaplarından en çok yanlış yaptığı yerler (en çok 10). Her satırda yer, en çok neyle karıştırdığı ve
"3/4 yanlış" yazar. Sıralama herkesin listesiyle aynı ölçüyü (Wilson alt sınırı) kullanır, ama oyuncunun kendi
cevaplarına uygulanır ve son 30 gündeki cevap tam, daha eskisi yarım sayılır: oyuncu bir yeri öğrendikçe oranı düşer ve
liste yeni yanlışlara döner. Hiç yanlışı olmayan yer listeye girmez. Liste en az 3 yer içeriyorsa altında **Bunları
çalış** tuşu çıkar: aynı modun antrenmanını yalnızca bu yerlerle başlatır (`PlayChoice.focusIds`; kıta süzgeci sıfırlanır,
çünkü zayıf yerler kıtaya bakmadan hesaplanır). Etiket "Antrenman · Dünya · Bayrak · Zayıf yerlerin" olur. Girişsiz
oyuncuda bölüm çizilmez; giriş daveti (`inviteBody`) bunu anlatır. Antrenman cevapları kaydedilmediği için antrenmanda
yapılan yanlışlar bu listeyi değiştirmez; liste yalnızca Oyna, günlük ve oda turlarından beslenir.

Tur bittiğinde o modda **herkesin en çok yanlış yaptığı 5 yer** gösterilir: giriş yapan oyuncuların turlarındaki cevaplarından,
yanlış oranının güvenilir alt sınırına (Wilson, %95) göre. Yalnızca orana göre sıralanınca bir kez sorulup bir kez
yanlış bilinen yer (1/1, %100), yedi kez sorulup altısında yanlış bilinen yerin (6/7) önüne geçiyordu; bu ölçü az
sorulan yerleri geri iter. Sıralama tarayıcıda yapılır (`useMostMissed.ts`). Her yerin altında en çok neyle
karıştırıldığı yazar ("Tunceli sanılıyor"); oyuncunun o turda kendisinin de yanlış
yaptığı yerler işaretlenir. Türkiye'de İsim ile Plaka, dünyada isim, Bayrak ve Başkent ayrı değerlendirilir.

### Soru biçimi: haritaya dokun ya da şıklı

Oyna ve Antrenman'ın ayar ekranındaki soru biçimi seçicisinde **Haritaya dokun** (olağan biçim: yerin adı, bayrağı,
başkenti ya da plakası sorulur, oyuncu haritada bulur) ya da **Şıklı** (harita bir yeri sarı renkle işaretler ve nabız gibi
atar, oyuncu dört şıktan hangisi olduğunu seçer). Seçim hatırlanır (`useAnswerStyle`) ve `PlayChoice.choices` ile tura
taşınır; "Tekrar oyna", "Bunları çalış" ve oyun içi mod değiştirme onu korur. Etiket "Antrenman · Türkiye · Şıklı" olur.
Günlük meydan okuma, düello ve odada şıklı biçim yoktur.

- **Şıklar modun kendi gösterimiyle çizilir** (`AnswerChoices.tsx`): İller ve Ülkeler'de yerin adı, Bayraklar'da yalnızca
  bayrak, Başkentler'de yalnızca başkent, Plakalar'da plaka rozeti. Cevaptan sonra her şıkkın altında yerin adı görünür; doğru
  şık yeşil, yanlış seçilen kırmızı olur, diğerleri solar. Masaüstünde 1-4 tuşları şık seçer.
- **Yanlış şıklar** önce aynı bölgeden (Türkiye) ya da aynı kıtadan (dünya) seçilir, yetmezse havuzun geri kalanından
  (`lib/choices.ts`). Havuz turun kendi havuzudur (kıta antrenmanında yalnızca o kıta, Başkentler'de başkenti olanlar);
  "Bunları çalış" odağı havuzu daraltmaz, yoksa şıklar hep aynı birkaç yerden gelirdi.
- **Üst çubuk yerin adını vermez**: "Bu hangi il?", "Bu ülkenin bayrağı hangisi?" gibi ne sorulduğunu söyler; adı cevaptan
  sonra "· Gaziantep" olarak ekler.
- **Haritada işaretli yer** `map-marked` sınıfıyla (sarı, nabız) boyanır. Ekranda çok küçükse (Malta, Lüksemburg) harita
  oraya yakınlaşır, en çok 8 kata kadar (`useMapZoom.focusOn`); değilse oyuncunun bıraktığı görünüme döner. Şıklı soruda harita
  seçim almaz, yalnızca gezilir (kaydırma, yakınlaştırma) ve yerlere Tab ile gelinmez. Hareket azaltma açıksa nabız durur.
- **Sunucu değişmez.** Cevap yine `{location, selected}`'tir: seçilen şık bir yer kimliğidir (Türkiye'de başında sıfır olmayan
  plaka, dünyada ISO kodu) ve `finish_round` aynı doğrulamayı yapar. Şıklı turlar mevcut türlerle (`variant`) kaydedilir; ayrım
  yoktur. Bunun iki sonucu bilinçli bir takastır: dört şıklı turda 10/10 daha kolaydır, bu yüzden `perfect_*`,
  `provinces_81` ve `countries_100` rozetleri şıklı turlardan da kazanılır; "Senin zayıf yerlerin" ve "herkesin en çok yanlış
  yaptıkları" iki biçimin cevabını karıştırır (şıklıda yanlış şıklar aynı bölgeden geldiği için karışıklık oranları farklıdır).
  Ayırmak gerekirse ayrı bir `variant` gerekir: dört tabloda `check (variant in (...))` kısıtı ve fonksiyonlardaki listeler,
  canlıda tek seferlik bir geçiş.

### Komşuluk (Türkiye illeri)

**Tablo.** `lib/turkish-neighbors.ts` 81 ilin kara sınırı komşularını tutar (199 komşu çifti, il başına 1-9, ortalama 4,9). Dosya elle
yazılmaz: `npm run maps:neighbors` (`scripts/build-neighbors.mjs`) `public/maps/provinces/all.svg` içinden üretir. Bu haritada
bütün iller aynı sınır noktalarını paylaştığı için iki il en az 2 ortak köşede buluşuyorsa komşudur (tek köşede değen iller, yani
dörtlü kavşaklar komşu sayılmaz). Üretilen dosyanın başında kaynağın özeti (sha256) yazar; `tests/neighbors.test.ts` il haritası
değişmişse (özet tutmuyorsa) tablonun yeniden üretilmesi gerektiğini söyler. Elle düzeltme gerekirse betikteki `CORRECTIONS`'a nedeniyle
yazılır; şu an boştur. Yalnızca Türkiye vardır: `world.svg`'de ülkeler arasında boşluk bulunduğu için aynı yöntem dünyada çalışmaz
(Fransa–Almanya gibi çiftlerde ortak köşe sıfır çıkar) ve ülkeler için dış bir veri kaynağı ve lisans kararı gerekir.

**Doğrulama (2026-11).** Harita çıktısı iki bağımsız kaynakla karşılaştırıldı. Wikidata'nın "ortak sınır" ilişkisiyle 197 çift
uyuştu, 3 çift ayrıştı; ayrışanlar OpenStreetMap il sınırlarında ortak sınır çizgisi (way) aranarak çözüldü ve harita üçünde de doğru
çıktı: İstanbul–Kırklareli ve Bilecik–Kocaeli komşudur (Wikidata'da eksik), Bursa–Sakarya komşu değildir (Wikidata'da fazla). Not:
kontrol için başta hafızadan yazılmış bir liste kullanılmıştı ve 15 çelişkili çiftin 12'sinde yanlış çıktı; bu yüzden doğruluk kaynağı
olarak yalnızca yukarıdaki iki kaynak sayılır. `tests/neighbors.test.ts` doğrulanmış 16 komşu ve 11 komşu olmayan çifti kalıcı olarak
denetler. Sınır: bu karşılaştırma yalnızca kara sınırını ölçer; deniz ya da boğaz karşısında kalan iller komşu sayılmaz. Üç kaynağın
haberleşmediği (hepsinin aynı hatayı yaptığı) bir çift olabilir; 199 çiftin her biri tek tek elle sınanmadı.

**Oyundaki kullanımı.** İller ve Plakalar'da, Oyna, Antrenman ve günlük meydan okumada, yanlış cevaptan sonra doğru ilin komşuları
haritada kesik çizgili açık yeşille (`map-neighbor`) işaretlenir ve adları haritanın altında yazar ("Komşuları: Adıyaman · Diyarbakır ·
…"). Oyuncunun tıkladığı yer doğru ilin komşusuysa kırmızı kalır ve "Senin cevabın" etiketine **Komşu il** rozeti eklenir. Doğru cevapta
hiçbir şey gösterilmez; dünya haritasında yoktur. Düello ve odada kapalıdır (`GameMap.neighborIds` verilmez).

### Komşuluk sorusu (Oyna ve Antrenman, yalnızca İller, kaydedilmez)

Oyna ve Antrenman ayar ekranlarındaki **Soru biçimi** seçicisinin üçüncü seçeneği **Komşuluk**'tur. Seçilince yalnızca **İller** karosu açık
kalır; Plakalar ve Dünya bölümü listeden çıkar (komşuluk yalnızca Türkiye illerinde vardır). Oyna'da tur 10 soru ve 120 saniyedir, Antrenman'da süresiz
sürer. Soru "Kayseri ile komşu olan hangisi?" biçimindedir:

- **Konu ve cevap.** Soru havuzundaki il cevaptır; haritada işaretlenen (turuncu çerçeveli, sarı) il **konu**dur ve cevabın komşularından
  biridir. Konu, tur numarası ve sorunun sırasından türetilir (`neighborSubject`, `lib/neighbors.ts`): aynı soruda hep aynıdır, sonuç ekranı
  soru başına konuyu yeniden kurar, ayrıca bir yerde saklanmaz.
- **Şıklar** (`neighborOptions`): cevap ve konuyla komşu olmayan üç il. Yanlış şıklar önce "komşunun komşusu" illerden seçilir (konuya yakın
  ama komşu değil), yetmezse kalan illerden tamamlanır; konunun kendisi şık olmaz. Şıklardan yalnızca biri konunun komşusudur; bu, 81 ilin
  hepsi ve bütün komşuları için `tests/neighbors.test.ts`'te denetlenir.
- **Cevaptan sonra**, doğru da yanlış da olsa: konunun bütün komşuları haritada kesik çizgili açık yeşille işaretlenir ve adları yazılır
  ("Erzincan · komşuları: Bayburt · Bingöl · …"); doğru cevap düz yeşil, yanlış seçilen kırmızı, konu işaretli kalır. Olağan turlarda
  komşular yalnızca yanlış cevaptan sonra gösterilir (`GameMap.alwaysShowNeighbors`).
- **Sonuç ekranı.** Döküm her satırda konuyu da yazar ("Sivas ile komşu: Kayseri · Sen: Van"); doğrular açık başlar. "Senin zayıf yerlerin" ve
  "herkesin en çok yanlışları" gösterilmez, çünkü cevap bir yerin adı değil bir komşuluk bilgisidir. Oyna sonucunda "Komşuluk turları kaydedilmez"
  notu çıkar; giriş yapmış oyuncu bunu bir kayıt hatası sanmasın, girişsiz oyuncuya "ilerlemen kaydedilsin mi?" daveti de gösterilmez.
- **Hiçbir yerde kaydedilmez, sunucu değişmez** (`isSavedChoice`, `lib/game.ts`). Oyna'da bile komşuluk turu sunucuda açılmaz, `finish_round`
  çağrılmaz ve rozet, profil ya da zayıf yerlere hiçbir şey yazılmaz. Sebep sunucunun turu reddetmesi değildir: `finish_round` komşuluk
  turunu kabul eder, çünkü cevap (`location`, sunucunun seçtiği il) ile seçilen şık (`selected`) zaten geçerli il kimlikleridir ve doğruluk
  `location = selected` ile hesaplanır. Sebep kaydın **anlamıdır**: sunucu soru konusunu (haritada işaretli il) bilmez, yalnızca cevap olan ili
  görür; kayıt "Kayseri bilindi" gibi okunur. Bu da `provinces_81` rozetini ("her ili en az bir kez doğru bil"), "senin zayıf yerlerin" listesini
  ve herkesin "en çok yanlış yapılanlar" istatistiğini yanlış besler (Kayseri'yi haritada bulamamak ile Sivas'ın komşusunu bilememek
  karışır). Ayrıştırmak ya da komşuluğu kayıtlı yapmak istenirse ayrı bir `variant` gerekir: dört tabloda `check (variant in (...))` kısıtı ve
  fonksiyonlardaki tür listeleri, yani canlıda ikinci bir SQL geçişi.
- **Üst çubuk.** Soru uzun olabildiği için masaüstü üst çubuğunun yan sütunları küçülebilir (`minmax(0,1fr)`); soru kartı ortada kalır, tur
  etiketi ("ANTRENMAN · TÜRKİYE · KOMŞULUK") yer daraldıkça kısalır ve 900 pikselin altında gizlenir. Oyna'nın üst çubuğu (süre ve
  ilerleme çubukları ayrı satırlarda) komşuluk sorusuyla 1440, 1280, 1024, 768 (dikey), 390 (dikey) ve 844 (yatay) pikselde çakışmadan sığar.

### Antrenman

Giriş, süre ve soru sınırı yoktur; havuz bitince yeniden karıştırılır ve oyuncu **Bitir** diyene kadar sürer. Sonuçlar kaydedilmez, turun sonunda doğru sayısı, başarı oranı, en uzun seri ve süre gösterilir.
En çok yanlış yapılanlar listesi antrenmanın sonunda da çıkar; giriş yapan oyuncuların turlarından hesaplanır ve antrenmanın
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
- Düellolar "en çok yanlış yapılanlar" istatistiğine işlenmez.

### Oda

Bir grup aynı sorularla kendi içinde yarışır. Giriş ekranında **Arkadaşlarımla** kartında **Oda** seçilince ikinci adımda
oda adı, harita ve mod, tur sayısı (1 / 3 / 5), süre (15 dk / 30 dk / 1 saat) ve kişi sınırı (5 / 10 / 20 / 50) seçilir.
Oda `/oda?kod=<kod>` sayfasındadır; kod ya da bağlantı gruba gönderilir, kodu olan Arkadaşlarımla kartındaki kod alanından da girer.

- **Lobi:** katılanlar görünür; katılım yalnızca lobide açıktır. Oda sahibi en az 2 oyuncuyla **Başlat** der, süre o an
  işlemeye başlar. Başlatılmayan oda 24 saat sonra kapanır. Oda başladıktan sonra bağlantıyı açan katılamaz ama
  sıralamayı izleyebilir.
- **Turlar:** her tur normal bir turdur (10 soru, 120 saniye; her cevaptan sonra 3 saniye gösterim); her turun soruları odadaki herkes için aynıdır
  ve tur başlayana kadar gizlidir. Turlar sırayla, oda süresi içinde istenen anda ve birer kez oynanır. Başlatılıp
  bırakılan tur "yarım" sayılır: 0 puan, 120 saniye.
- **Oda sıralaması:** tur tur puanlar, toplam puan ve toplam süre canlı güncellenir; toplam puana, eşitlikte toplam
  süreye göre dizilir. Dikey telefonda tablo sıra, oyuncu ve puandan oluşur (süre puanın altında); tur tur puanlar
  geniş ekranda görünür. Süre bitince oda kapanır ve ilk üç kürsüde gösterilir.
- Oda turları profile ve "en çok yanlış yapılanlar" istatistiğine de işlenir (genel sıralama yoktur).
- Bir oyuncunun aynı anda en fazla 3 açık odası olabilir.

### Günlük meydan okuma

Her gün (Türkiye saatiyle, gece yarısı değişir) Türkiye, Plaka, Dünya, Bayrak ve Başkent için ayrı birer meydan okuma vardır. Bir
modun 10 sorusu o gün ilk başlatıldığında sunucuda seçilir ve gün boyu herkes için aynıdır. Her oyuncu her modu günde bir
kez oynar; başlatılıp bırakılan tur da hakkı kullanır. Tur Oyna ile aynı biçimdedir (10 soru, 120 saniye; her cevaptan sonra herkes için 3 saniye gösterim), sunucuda
doğrulanır ve günün sıralamasına işlenir; uygulamadaki herkese açık tek sıralama budur. Giriş gerekir (misafir de olur). Meydan okuma yerel sorularla oynanmaz:
sunucuya ulaşılamazsa ya da mod bugün oynandıysa ana ekrandaki şeritte not çıkar.

Ana ekrandaki **Günün meydan okuması** girişi yukarıda anlatılmıştır (`DailyEntry`, dikey telefonda altta sabit `DailyDock`).
Dokununca günün meydan okuması alttan açılır: tarih, seri, yeni meydan okumaya kalan süre ve iki bölümde (Türkiye, Dünya)
yan yana beş mod kartı (oynanmamışta "Başla ›", bitirilende skor, bırakılanda "Bırakıldı"). Oynanmamış moda dokununca tur
başlar; bitirilen mod seçilir ve altında o modun günlük sıralaması, oyuncunun sonucu (sırasıyla birlikte) ve paylaşma tuşu
görünür. Meydan okuma açılamazsa (bugün oynandı, bağlantı yok) sayfa kendiliğinden açılır ve notu gösterir. Sonuç
ekranında skor, süre, günün sıralamasındaki yer, gün serisi, soru soru kareler, paylaşma tuşu ve günün sıralaması vardır;
"Tekrar oyna" yoktur.

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
resmi, ad, hesap türü (Google / Misafir) ve ilk oyun tarihi; altında tur özeti (tur, başarı oranı, en uzun seri,
oynanan gün), düellolar (oynanan, galibiyet, beraberlik, mağlubiyet), her moddaki en iyi sonuç ve son
10 tur. Düello kartlarına dokununca alttan açılan sayfada o sonuçtaki düellolar listelenir (son 100): rakip, mod
ve kural, tarih, skor; hükmen biten düello işaretlenir. Misafir hesapta verinin çıkışta ya da cihaz
değişince kaybolacağı yazar. Antrenman kaydedilmediği için profilde yoktur; oda turları dahildir. Veri tek bir
sunucu fonksiyonundan gelir (`my_profile`). Alttan açılan sayfa sıralamayla ortaktır (`BottomSheet.tsx`).

### İlçeler (Haritayı tamamla)

Ana ekrandaki **İlçeler** karosu (köşesinde "Yeni") `/ilceler` sayfasını açar (`components/districts/DistrictScreen.tsx`).
Önce il seçilir (`components/districts/ProvincePicker.tsx`). Her il bir oyun kartıdır (telefonda tek sütun, genişledikçe
2–5 sütun): saydam, denizin üstünde cam gibi; ortasında ilin beyaz silüeti durur. Dört köşede etiketler vardır: sol
üstte plaka, sağ üstte bölgenin renginde coğrafi bölge (`lib/turkish-regions.ts`, yedi bölge; renk yalnızca burada), sol
altta ilin adı (uzun adlar
kademeli küçülür, hiçbir genişlikte kırpılmaz), sağ altta ilçe sayısı. Etiketlerin iç köşesi yuvarlaktır; iki yanındaki
içbükey kıvrımlar (`CornerLabel`) onları kartın kenarlarına bağlar. Üstte arama (ad ya da plaka) ve sıralama: **A–Z**,
**Plaka**, **Bölge** (bölge başlıklarıyla gruplu; bölgeler arayüz dilindeki adlarına göre alfabetik, il sayısı başlığın
en sağında; bölge başlıkta yazdığı için kartlarda bölge etiketi gizlenir) ve **İlçe sayısı** (azdan çoğa); seçilen sıralama tarayıcıda hatırlanır.
Silüetler `public/maps/districts/provinces.json`'da (plaka → [viewBox, yol], ~23 KB), bir kez indirilir. Sonra o ilin bütün ilçeleri haritada boş (kum
rengi) gelir; alttaki listede (yatay ve geniş ekranda sağda) ilçe adları Türkçe alfabe sırasıyla durur. Oyuncu haritadan bir
ilçeye ve listeden bir ada dokunur; sırası serbesttir (önce ad da seçilebilir). Eşleşme doğruysa ilçe yeşile döner, adı
haritaya ilçenin içine sığacak boyda yazılır (çok küçük ilçede yazılmaz, yakınlaşınca okunur) ve ad listeden düşer.
Yanlışsa ilçe ve ad bir an kırmızı yanar, süreye 5 saniye eklenir. Üst barda yerleşen ilçe akışı (✓ 9/25), süre (cezalar
dahil), seri rozeti ve hata sayısı durur; süre ilk dokunuşta başlar. 12'den çok ad kalınca listenin üstünde arama kutusu
çıkar. Bütün ilçeler yerleşince sonuç kartı: yıldızlar (hatasız 3; puan, ilçe sayısından hata sayısı düşülerek
`RoundCelebration`'daki oranla), süre, hata, **Tekrar oyna** ve **Başka il**. Tur kaydedilmez; kişisel rekorlar ve il
koleksiyonu sıradaki adımda.

Haritalar ve adlar `npm run maps:districts` (`scripts/build-district-maps.mjs`) ile üretilir: resmî sınırları HDX'ten
indirir (`.cache/`, depoya girmez), verideki bozuk Türkçe adları (ı yerine i, fazladan nokta) Wikipedia'nın "Districts of
Turkey" il tablolarıyla il bazında eşleştirip düzeltir, her il için sınırları mapshaper ile komşular arasında boşluk
bırakmadan sadeleştirir (%6) ve `public/maps/districts/<plaka>.svg` ile `lib/districts-data.ts`'i yazar. Her ilçe
`<path id="TUR006007" data-lx data-ly>` olur; kod "TUR" + plaka + sıra, `data-lx/ly` adın yazılacağı iç nokta. Eşleşmeyen
ad ya da haritada eksik ilçe kalırsa betik durur. Toplam ~630 KB; il seçilince yalnızca o ilin dosyası indirilir. Aynı
betik il sınırlarını %1 sadeleştirip kartların silüet dosyasını da yazar.

### Rozetler

17 rozet var (`lib/badges.ts`): gün serisi (3, 7, 30 gün), ilk günlük meydan okuma, tam gün (aynı gün beş meydan
okuma), Türkiye / Plaka / Dünya / Bayrak / Başkent'te 10/10, Şimşek (günün meydan okumasında 45 saniyenin altında 10/10), 81 il ve 100 ülke (turlarda
en az bir kez doğru bilinen farklı yerler), ilk ve 10. düello galibiyeti, Kürsü (günün meydan okumasında ilk üç) ve Zirve (günün
meydan okumasında birinci; o gün o modu en az 3 oyuncu bitirmiş olmalı, günlerden en iyi sıra sayılır). Hangisinin kazanıldığını ve ilerlemeyi sunucu mevcut veriden hesaplar (`my_badges`); kazanılan rozet
`player_badges` tablosuna yazılır ve kaybolmaz (sıralamada geçilse de Kürsü kalır). Geçmişte hak edilmiş rozetler ilk
çağrıda verilir.

Profilde rozetler gruplarıyla (gün serisi, günlük meydan okuma, kusursuz tur, harita ustalığı, düello, günün sıralaması) ve her
grupta kademe sırasıyla dizilir (3 → 7 → 30 gün); telefonda tek sütun, geniş ekranda gruplar iki sütunda. Her rozet bir
satırdır: kazanılanlar renkli ve tarihli, kazanılmamışlar soluk; nasıl kazanılacağı ve ilerlemesi (ör. "54/81") yazar. Oyna, günlük meydan okuma ve düello sonuç ekranında yeni kazanılan rozetler kısa bir kutlamayla çıkar (en fazla
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
şeritle aynı düzendir. Üst bar koyu deniz renginde bir oyun göstergesidir; soru beyaz, altı kalın kenarlı bir kartta
durur. Son 10 saniyede her saniye kısa bir tık sesi gelir. İki doğrudan itibaren puanın yanında 🔥 seri rozeti durur (3'te turuncu, 5'te kırmızı).
Oyna'da, günün meydan okumasında ve oda turunda üst barda iki akış satırı alt alta durur. Soru akışı: turun soruları
kadar bölüm (cevaplananlar yeşil ya da kırmızı, beklenen soru beyaz ve hafifçe parlar, gelecekler soluk), solunda o ana
kadarki doğru ve sorulan soru sayısı ("1/2"; tur 0/0 ile başlar). Süre akışı: kalan süre yazısı ve eriyen çubuk; çubuk
yeşilden sarıya, son 10 saniyede kırmızıya döner ve yanıp söner. İki satırın yazıları eşit genişlikte, çubukları aynı
hizadan başlar. Dikey telefonda soru kartının üstünde, geniş ekranda üst barın altında tam genişliktedir; üst barda
ayrıca puan ve süre yazmaz (antrenmanda "doğru/cevaplanan" üst barda kalır). Harita denizde kum rengidir (`.map-sea`); doğru cevapta dokunulan yerden "+1" uçar.
Yanlış cevapta oyuncunun dokunduğu yerin adı sorudan ayrı, haritanın alt ortasında kırmızı bir etikette çarpıyla ve
"Senin cevabın" başlığıyla yazar; haritada kırmızı yanan yerle eşleşir.

**Ses.** Doğru, yanlış, seri, son saniyeler ve tur sonu için kısa efektler (`lib/sound.ts`). Ses dosyası yoktur, notalar
Web Audio ile o an üretilir. Tarayıcılar sesi ancak dokunuşla açılan bir ses bağlamında çaldığı için bağlam ilk dokunuşta
açılır. Hesap menüsünden kapatılır, seçim tarayıcıda hatırlanır. Sonuç ekranının başında puan oranına göre 0–3 yıldız
(kusursuz 3, %70 2, %40 1) ve övgü durur; en az 5 soruluk kusursuz turda fanfar ve konfeti (`RoundCelebration.tsx`).

**Yön.** Tüm ekranlar ve oyunlar (Oyna, antrenman, düello, oda turu) dikeyde de oynanır; telefonu yan çevirmek
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
- **Bağlantı kopması:** Bağlantı yokken ekranın altında bir uyarı durur (`ConnectionBanner`). Oyna ve Antrenman bağlantısız
  da oynanır (skor kaydedilmez); düello ve oda tuşları "Bağlantı yok" diyerek kapanır. Giriş yapmış oyuncunun skoru kaydedilemezse sonuç ekranında
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

Oyna sonucundaki **Skorumu paylaş** (antrenman skoru karşılaştırılabilir olmadığı için orada yok) telefonda sistemin paylaşma menüsünü açar ("Harita Avcısı'nda Dünya
turunda 9/10 yaptım, süre 00:47. Sen kaç yaparsın?" ve site bağlantısı); menü yoksa
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

- **Android geri tuşu** (`NativeBackButton`, `lib/hooks/useBackHandler.ts`): önce açık pencere (giriş, günün meydan okuması,
  tanıtım, hesap silme) kapanır; oyundan ve sonuçtan ana menüye, giriş adımından ayarlara dönülür; düello ve oda
  turunda çıkış onayı sorulur. Bunlar yoksa geçmişte geri gidilir (ayar ekranından oyun seçimine), geçmiş de yoksa
  uygulamadan çıkılır.
- **Titreşim** (`@capacitor/haptics`, `lib/haptics.ts`): uygulamada iPhone'da da çalışır; doğru cevapta "başarılı",
  yanlışta "hata" dokunuşu.
- **Paylaşım** (`@capacitor/share`, `lib/share.ts`): uygulamada sistemin paylaşma menüsü açılır (Android'in
  WebView'inde tarayıcının paylaşma API'si yok).

- **Apple ile giriş** (yalnızca iOS; App Store, Google girişi olan uygulamada bunu da ister): `lib/auth.ts` →
  `startAppleSignIn`. iOS'un kendi Apple penceresi uygulamanın içindeki küçük bir eklentiyle açılır
  (`ios/App/App/AppleSignInPlugin.swift`; `AppViewController` köprüye kaydeder). Hazır topluluk eklentisi Capacitor 8'in
  Swift paketleriyle çözülmediği için uygulamanın içinde. Dönen kimlik belirteci Supabase'de `signInWithIdToken` ile
  oturuma çevrilir; bu yüzden Supabase'de Services ID ya da altı ayda bir yenilenen gizli anahtar gerekmez. Apple adı
  yalnızca ilk girişte verir, o zaman `full_name` olarak yazılır; ad hiç yoksa sıralamada e-posta (çoğu zaman Apple'ın
  gizli adresi) görünmesin diye misafirlerdeki gibi bir takma ad verilir. Düğme giriş penceresinde (`AuthPanel`) ve
  tanıtımın son ekranında (`Guide`) çıkar; web'de ve Android'de görünmez. Profilde hesap türü oturumdaki
  `app_metadata.provider`'dan okunur.

iOS projesindeki mağaza ayarları: takım `358VBZ4XZK` (otomatik imzalama), Sign in with Apple yetkisi
(`App.entitlements`), şifreleme beyanı (`Info.plist` → `ITSAppUsesNonExemptEncryption`), Apple'ın gizlilik bildirimi
(`PrivacyInfo.xcprivacy`; App Store Connect'teki App Privacy yanıtlarıyla aynı olmalı).

Uygulama kimliği (`capacitor.config.ts` → `appId`, `com.haritaavcisi.app`) iki mağazada da kayıtlı; değiştirilemez.

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır. Oyna ve Antrenman Supabase olmadan da oynanabilir (bir şey kaydedilmez); turların kaydı, günün meydan okuması, düello ve oda için aşağıdaki Supabase kurulumu gerekir.

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
    intro/              Giriş ekranının parçaları: ana ekran (ModeGrid), ortak adım 2 düzeni (SetupParts), Oyna/Antrenman
                        ayarı (SoloSetup: soru biçimi seçicisi StylePicker + gruplanmış mod listesi ModeList), Düello ve Oda
                        ayarları (ModeTiles karoları), oyunların ve grupların renk ve simgeleri (games.tsx)
    MapDemo.tsx         Haritada soru-cevap döngüsü: adım 2'deki canlı önizleme ve tanıtımın harita demosu
    AuthPanel.tsx       Günün meydan okumasından önceki giriş adımı (Google / misafir)
    GameTopBar.tsx      Oyun sırasındaki üst bar (soru, bayrak, puan, süre)
    GameMap.tsx         Tıklanabilir harita, yakınlaştırma tuşları; şıklı soruda (isMarking) işaretli yeri boyar ve oraya odaklanır
    AnswerChoices.tsx   Şıklı sorunun dört şıkkı (ad, bayrak, başkent ya da plaka), cevaptan sonra yeşil/kırmızı
    ResultScreen.tsx    Tam ekran sonuç: skor ve yanında seri / süre, tekrar oyna + paylaş, başka tur seç, girişsiz oyuncuya giriş daveti, geri planda en çok yanlış yapılanlar; günlük sonucu günün sıralamasıyla; antrenman özeti
    SessionReview.tsx   Oyna ve antrenman sonucunda bu turun dökümü: yanlışlar önde ve vurgulu, doğrular altta kompakt
    RoundReview.tsx     Soru kareleri (RoundSquares) ve açılır döküm (günlük sonuçta kullanılır)
    Logo.tsx            Nişangah rozetli oyun adı (ana ekranın ve yasal sayfaların başlığı)
    HomeButton.tsx      Lobi ve profilde ana menüye dönen ev tuşu
    MostMissed.tsx      Sonuç ekranındaki "En çok yanlış yapılanlar" listesi (herkesin)
    WeakSpots.tsx       Sonuç ekranındaki "Senin zayıf yerlerin" listesi ve "Bunları çalış" tuşu (oyuncunun kendisinin)
    Leaderboard.tsx     Sekmeli sıralama listesi (günün meydan okumasının sıralaması)
    RoundControls.tsx   Oyun sırasında turu yeniden başlatma / tur değiştirme
    PlayButton.tsx      Rozetli oyna tuşu; ekranın asıl tuşunun (basılabilir yeşil) sınıfı
    RoundCelebration.tsx  Sonuç ekranındaki yıldızlar, övgü, bitiş sesi ve konfeti
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
    useMapZoom.ts       viewBox tabanlı yakınlaştırma, kaydırma ve açılış görünümü; focusOn: şıklı soruda işaretli yere odaklanma
    useMostMissed.ts    location_stats view'inden o modda en çok yanlış yapılan yerleri çeker
    useWeakSpots.ts     my_weak_spots ile giriş yapmış oyuncunun o moddaki zayıf yerlerini çeker
    useRoundSave.ts     Giriş yapmış oyuncunun turunu sunucuda açar ve sorularını alır (start_ranked_round), sonucu tur başına
                        bir kez kaydeder (finish_round); girişsizde hiçbir şey yazmaz. Sıralama çekmez, abonelik kurmaz
  turkish-plates.ts     81 il + plaka kodu
  world-capitals.ts     Başkent turunda sorulan 174 ülkenin Türkçe başkent adları
  world-countries.ts    179 ülke + ISO kodu; eski "normal" düellolarının havuzu ("common"), kıta listeleri, kıta görünümleri ve kapsamlar (WorldScope)
  shuffle.ts            Fisher-Yates karıştırma
  choices.ts            Şıklı soru için dört şık: doğru cevap ve aynı bölge/kıtadan üç yanlış
  neighbors.ts          neighborIds / areNeighbors: bir ilin komşuları; neighborSubject / neighborOptions: komşuluk sorusunun konusu ve şıkları (yalnızca Türkiye)
  turkish-neighbors.ts  81 ilin komşuluk tablosu (scripts/build-neighbors.mjs üretir, elle düzenlenmez)
  supabase.ts           Supabase istemcisi (env yoksa null döner)
  auth.ts               Google ve misafir girişi (ana sayfa ve düello ortak kullanır)
  duel.ts               Düello tipleri, kurallar, modlar ve yer kimliğinden soruya geçiş
  hooks/useDuel.ts      Düelloya katılır, durumu düzenli aralıklarla sorar, cevap / hazır / rövanş işlemleri
  hooks/useRoundPlay.ts Bir turun oynanışı (sorular, 120 sn, 3 sn gösterim, puan ve seri); ana sayfa ve oda kullanır
  room.ts               Oda tipleri ve ayar seçenekleri
  hooks/useRoom.ts      Odaya katılır, durumu yoklar, odayı ve turları başlatır
scripts/
  generate-duel-pools.mjs  Soru havuzlarını world-countries.ts ve world-capitals.ts'ten schema.sql'e yazar
  build-neighbors.mjs      İl haritasından lib/turkish-neighbors.ts komşuluk tablosunu üretir (npm run maps:neighbors)
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
| `maps/districts/<plaka>.svg` | [HDX cod-ab-tur](https://data.humdata.org/dataset/cod-ab-tur) (BM OCHA, kaynak Harita Genel Komutanlığı), sadeleştirildi | CC BY-IGO |
| `flags/*.svg` | [lipis/flag-icons](https://github.com/lipis/flag-icons) 7.5.0 | MIT |
| Başlık yazı tipi | [Stack Sans Notch](https://fonts.google.com/specimen/Stack+Sans+Notch), `next/font` ile derlemede gömülür | OFL 1.1 |

Türkiye haritasında Kıbrıs vardı; hiç sorulmadığı (ve kuzeyi "00" koduyla tıklanabildiği) için haritadan çıkarıldı ve
haritanın görünüm kutusu Türkiye'ye göre daraltıldı. Tıklanabilir alanlar Türkiye haritasında `data-plakakodu`, dünya haritasında ISO 3166-1 alpha-2 `id` değeri üzerinden eşleştirilir; bayrak dosyaları da aynı ISO koduyla adlandırılır. Kıta görünümleri `world.svg` koordinatlarıyla `world-countries.ts` içinde sabit tanımlıdır: bazı ülkelerin şekilleri denizaşırı topraklarını da içerdiği için kutudan türetilmez.

## Supabase ve oturum açma

1. Supabase projesi oluşturun.
2. SQL Editor'de [`supabase/schema.sql`](../supabase/schema.sql) dosyasını çalıştırın. Her şey `do_harita_avcisi` şemasında kurulur, böylece aynı Supabase projesindeki başka uygulamalarla karışmaz. Dosya idempotent'tir; şema değiştiğinde (ör. yeni bir `variant` eklendiğinde) tekrar çalıştırın. `create table if not exists` var olan tablonun kısıtlarını değiştirmediği için, kurulu bir veritabanında böyle değişiklikler (ör. tür listesindeki bir kısıt) tek seferlik bir geçiş dosyasıyla yapılır (`supabase/YYYY-MM-ad.sql`); dosya SQL Editor'de bir kez çalıştırılır ve sonra depodan silinir, kalıcı tanım `schema.sql`'de kalır.
3. Settings > API > **Exposed schemas** listesine `do_harita_avcisi` ekleyin; istemci bu şemaya bağlanır (`lib/supabase.ts`'teki `SUPABASE_SCHEMA`).
4. Authentication > Providers altında **Google**, **Apple** ve **Anonymous sign-ins** sağlayıcılarını etkinleştirin. Google Cloud OAuth istemcinizde Supabase'in callback URL'sini yetkili yönlendirme adresi olarak ekleyin. Apple'da **Client IDs** alanına `com.haritaavcisi.app` yazılır; Secret Key boş kalır (giriş yalnızca iOS uygulamasında, kimlik belirteciyle).
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

Giriş yapmış oyuncunun Oyna turları, günün meydan okuması ve oda turları `game_results` tablosunda tutulur; antrenman ve girişsiz oyuncunun turları hiç kaydedilmez. Her satır `game_mode` (`turkey` / `world`) ve `variant` ile bir moda bağlanır:

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

RLS politikaları sonuçları herkese açık okutur (günün sıralaması giriş yapmadan da görünür); `leaderboard` view'i
(her oyuncunun her moddaki en iyi sonucu) artık yalnızca profildeki en iyi sonuçlar ve henüz güncellenmemiş uygulama
sürümleri içindir, yeni uygulama genel sıralama göstermez. Tarayıcının
tabloya yazma izni yoktur; sonuçlar yalnızca sunucudaki fonksiyonlarla kaydedilir:

- `start_ranked_round(game_mode, variant)`: Oyna turu (giriş yapmış oyuncu için) başlarken `game_rounds` tablosunda bir tur açar, 10 sorusunu
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
  Soruların bitmediği tur ancak 120 saniye dolduysa kabul edilir. 10 soruluk tur günün meydan okumasında ve oda turunda en
  az 30 saniye sürer (9 × 3 saniyelik gösterim + soru başına 0,3 saniye); serbest turda (Oyna, Antrenman) cevaptan sonra
  gösterim atlanabildiği için yalnızca soru başına 0,3 saniye (10 soru için 3 saniye) beklenir. Sunucu hangi uygulama
  sürümünün çağırdığını bilmez; türü `game_rounds.daily_day` ve `room_id` ayırır. Kaydedilen süre, sunucunun ölçtüğünden belirgin
  biçimde kısa olamaz. Oyuncunun adı ve fotoğrafı tarayıcıdan değil oturumdan alınır.

Her cevap `round_answers` tablosuna da yazılır (sorulan yer, tıklanan yer, doğru mu). Bu tablo tarayıcıya kapalıdır;
`location_stats` view'i her sıralamada her yerin kaç kez sorulduğunu, kaç kez yanlış cevaplandığını ve en çok hangi
yerle karıştırıldığını herkese açık olarak toplar. Türkiye'de yerler başında sıfır olmadan plakayla (`6`, `34`),
dünyada ISO koduyla (`tr`) tutulur. Oyuncunun kendi zayıf yerleri `my_weak_spots(game_mode, variant, limit)` ile okunur: fonksiyon
yalnızca `auth.uid()` satırlarını toplar (tablo tarayıcıya kapalıdır), girişsiz çağrıyı ve geçersiz modu reddeder, `limit`
en az 1 ve en çok 50'dir. Eski cevaplar yarım ağırlıkla sayılır (30 günden eski).

Doğru cevap sorudan belli olduğu için (sorulan ülkenin kodu, tıklanacak alanın kodudur) bu denetimler
cevapları otomatik veren bir betiği engelleyemez; engelledikleri, hiç oynanmamış bir turun ya da imkânsız
bir sürenin kaydedilmesidir. Günün sıralaması `daily_leaderboard` view'inden okunur. İstemci artık `game_results` için gerçek zamanlı abonelik kurmaz; `supabase_realtime` yayını ve `replica identity full` yalnızca henüz güncellenmemiş uygulama sürümleri için durur, onlar kalkınca kaldırılabilir.

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
turdur; bu yüzden `finish_round`'un bütün denetimlerinden geçer ve profile de yazılır. Oda turunda
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

## App Store sürümü

Sürüm numarası `package.json` ile aynı tutulur: Xcode projesinde `MARKETING_VERSION`
(`ios/App/App.xcodeproj/project.pbxproj`, iki yapılandırmada). Her yüklemede yapı numarası (`CURRENT_PROJECT_VERSION`)
bir artırılır; App Store Connect aynı numarayı ikinci kez kabul etmez. 1.1.1 için yapı 1 ve 2 yüklendi; 1.2.0 yapı 3.

```bash
npm run build && npx cap sync ios
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' \
  -archivePath /tmp/HaritaAvcisi.xcarchive -allowProvisioningUpdates archive
xcodebuild -exportArchive -archivePath /tmp/HaritaAvcisi.xcarchive -exportOptionsPlist ExportOptions.plist \
  -exportPath /tmp/ha-export -allowProvisioningUpdates
```

`ExportOptions.plist` depoda değil; içinde `method` = `app-store-connect`, `destination` = `upload`, `teamID` =
`358VBZ4XZK`, `signingStyle` = `automatic` olur. Yükleme, Xcode'a eklenmiş Apple hesabıyla yapılır (Xcode → Settings →
Accounts). Yüklenen yapı birkaç dakika işlendikten sonra TestFlight'ta görünür; dahili test grubundakiler TestFlight
uygulamasından kurar.

Mağaza metinleri, App Privacy ve yaş derecelendirmesi yanıtları, inceleme notu ve ekran görüntüleri:
[APP-STORE.md](APP-STORE.md).

## Kontroller

```bash
npm run lint
npm run build
```
