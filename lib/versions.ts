import { type Locale } from "@/lib/i18n";

/** Bir sürüm: numarası, çıktığı ay ve öne çıkan değişiklikleri, iki dilde. */
export type Version = {
  version: string;
  date: Record<Locale, string>;
  notes: Record<Locale, string[]>;
};

/**
 * Sürüm geçmişi (Hakkında sayfası), en yenisi başta. Yeni sürümde başa bir kayıt eklenir; package.json'daki sürüm,
 * Android'in versionName'i ve iOS'un MARKETING_VERSION'ı en üstteki numarayla aynı olmalı (tests/versions.test.ts
 * package.json'ı denetler). Maddeler mağaza sürüm notlarından (docs/GOOGLE-PLAY.md, docs/APP-STORE.md) kısaltılır.
 */
export const VERSIONS: Version[] = [
  {
    version: "1.6.0",
    date: { tr: "Kasım 2026", en: "November 2026" },
    notes: {
      tr: [
        "Komşuluk artık beş modda: İller, Plakalar, Ülkeler, Bayraklar ve Başkentler.",
        "Yeni soru: \"komşu olmayan hangisi?\" Olumlu ve olumsuz sorular karışık gelir.",
        "Dünya turlarında yanlış cevaptan sonra doğru ülkenin komşuları da gösterilir.",
        "Soru biçimi seçiminde, biçimin nasıl oynandığını gösteren kısa bir animasyon.",
      ],
      en: [
        "Neighbours now works in all five modes: Provinces, Plates, Countries, Flags and Capitals.",
        "New question: \"which one doesn't border it?\" Positive and negative questions come mixed.",
        "In world rounds, a wrong answer now also shows the right country's neighbours.",
        "A short animation shows how the chosen question style is played.",
      ],
    },
  },
  {
    version: "1.5.0",
    date: { tr: "Kasım 2026", en: "November 2026" },
    notes: {
      tr: [
        "Oyna için giriş gerekmez; giriş yaparsan turların profilinde ve rozetlerinde birikir.",
        "Yeni soru biçimleri: Şıklı (işaretli yeri dört şıktan bul) ve Komşuluk (işaretli ille komşu olanı bul).",
        "Zayıf yerlerin: en çok yanlış yaptığın yerler sonuç ekranında; tek dokunuşla onlarla antrenman yap.",
        "Günün meydan okuması ana ekranın altında; herkese açık sıralama artık yalnızca günlük.",
      ],
      en: [
        "Play needs no sign-in; sign in and your rounds add up in your profile and badges.",
        "New question styles: Multiple choice (find the marked place among four options) and Neighbours (find the one that borders the marked province).",
        "Your weak spots: the places you miss most on the result screen; practise them with one tap.",
        "The daily challenge sits at the bottom of the home screen; the only public leaderboard is now the daily one.",
      ],
    },
  },
  {
    version: "1.4.0",
    date: { tr: "Kasım 2026", en: "November 2026" },
    notes: {
      tr: [
        "Yeni oyunlar: Ülkeler ve İller. Bütün dünyayı ya da bir kıtayı, bütün Türkiye'yi ya da bir bölgeyi haritaya yerleştir.",
        "OYNA'nın üstünde Yarış / Antrenman anahtarı.",
        "Arkadaşlarla: düello, oda ve kodla katılma tek yerde.",
        "Yeni Profil: dil, ses, Hakkında ve sürüm geçmişi; istatistikler ve rozetler ayrı sayfada.",
      ],
      en: [
        "New games: Countries and Provinces. Fill in the whole world or a continent, all of Turkey or a region.",
        "A Race / Practice switch above PLAY.",
        "With friends: duel, room and joining with a code in one place.",
        "New Profile: language, sound, About and version history; stats and badges on their own page.",
      ],
    },
  },
  {
    version: "1.3.0",
    date: { tr: "Kasım 2026", en: "November 2026" },
    notes: {
      tr: [
        "Yeni oyun: İlçeler. 81 ilin 973 ilçesini haritaya yerleştir.",
        "Silüetli il kartları; ada, plakaya, bölgeye ya da ilçe sayısına göre sıralama.",
        "Açılışta yeni animasyon: nişangâh hedefi buluyor.",
      ],
      en: [
        "New game: Districts. Place all 973 districts of Turkey's 81 provinces.",
        "Province cards with silhouettes; sort by name, plate, region or district count.",
        "New launch animation: the crosshair finds its target.",
      ],
    },
  },
  {
    version: "1.2.0",
    date: { tr: "Kasım 2026", en: "November 2026" },
    notes: {
      tr: [
        "Oyun gibi yeni görünüm: büyük OYNA tuşu, renkli mod kartları.",
        "Oyun sırasında seri rozeti ve doğru cevapta +1; yanlış cevapta dokunduğun yer net görünür.",
        "Ses efektleri, sonuçta yıldızlar ve konfeti.",
      ],
      en: [
        "A game-like new look: big PLAY button, colourful mode cards.",
        "Streak badge and +1 on correct answers; on a wrong answer the place you tapped is shown clearly.",
        "Sound effects, stars and confetti on results.",
      ],
    },
  },
  {
    version: "1.1.1",
    date: { tr: "Ekim 2026", en: "October 2026" },
    notes: {
      tr: ["App Store'da ilk sürüm: iPhone ve iPad, Apple ile giriş.", "Yenilenen ana ekran: Yarış, Antrenman ve arkadaşlarla oyunlar tek dokunuşla."],
      en: ["First release on the App Store: iPhone and iPad, Sign in with Apple.", "Refreshed home screen: Race, Practice and games with friends one tap away."],
    },
  },
  {
    version: "1.1.0",
    date: { tr: "Ekim 2026", en: "October 2026" },
    notes: {
      tr: [
        "Başkentler: başkent gelir, ülkesini bul.",
        "Günün meydan okuması: her gün herkese aynı sorular, gün serisi.",
        "17 rozet ve profil sayfası; İngilizce dil desteği.",
        "Skorlar sunucuda doğrulanıyor.",
      ],
      en: [
        "Capitals: a capital appears, find its country.",
        "Daily challenge: the same questions for everyone each day, with day streaks.",
        "17 badges and a profile page; English language support.",
        "Scores are verified on the server.",
      ],
    },
  },
  {
    version: "1.0.0",
    date: { tr: "Ekim 2026", en: "October 2026" },
    notes: {
      tr: [
        "Google Play'de ilk sürüm.",
        "Türkiye'nin 81 ili ve 179 ülke; plaka ve bayrak modları.",
        "Sıralamalı yarış, süresiz antrenman, düello ve oda.",
      ],
      en: [
        "First release on Google Play.",
        "Turkey's 81 provinces and 179 countries; plate and flag modes.",
        "Ranked races, untimed practice, duels and rooms.",
      ],
    },
  },
];

/** Uygulamanın şu anki sürümü: geçmişin en üstündeki. */
export const CURRENT_VERSION = VERSIONS[0].version;
