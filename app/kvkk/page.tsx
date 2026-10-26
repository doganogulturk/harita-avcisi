import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, DATA_CONTROLLER, LegalPage } from "../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni · Harita Avcısı",
  description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Harita Avcısı aydınlatma metni.",
};

const TURKISH = (
  <>
    <p>
      Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;nun (&ldquo;KVKK&rdquo;) 10. maddesi uyarınca,
      Harita Avcısı web sitesi ve mobil uygulamalarını kullananların kişisel verilerinin nasıl işlendiği hakkında
      bilgi vermek için hazırlanmıştır. Aynı konuların sade bir anlatımı <Link href="/gizlilik">Gizlilik Politikası</Link>
      &apos;ndadır.
    </p>

    <h2>1. Veri sorumlusu</h2>
    <p>
      Veri sorumlusu {DATA_CONTROLLER}&apos;tür. İletişim: <ContactEmail />.
    </p>

    <h2>2. İşlenen kişisel veriler</h2>
    <table>
      <thead>
        <tr>
          <th>Veri kategorisi</th>
          <th>Veriler</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Kimlik</td>
          <td>Ad ve soyad (Google ile girişte), misafir girişinde yazılan ad, profil fotoğrafı</td>
        </tr>
        <tr>
          <td>İletişim</td>
          <td>E-posta adresi (Google ile girişte)</td>
        </tr>
        <tr>
          <td>Müşteri işlem</td>
          <td>Hesap kimliği, yarış sonuçları (puan, süre, seri), verilen cevaplar, düello ve oda kayıtları</td>
        </tr>
        <tr>
          <td>İşlem güvenliği</td>
          <td>IP adresi, tarayıcı veya cihaz bilgisi, oturum bilgileri ve sunucu kayıtları</td>
        </tr>
        <tr>
          <td>Ziyaret istatistikleri</td>
          <td>
            Yalnızca web sitesinde: görüntülenen sayfa (düello ve oda kodu çıkarılarak), kabaca ülke, cihaz türü,
            tarayıcı ve işletim sistemi
          </td>
        </tr>
      </tbody>
    </table>

    <h2>3. İşleme amaçları ve hukuki sebepler</h2>
    <table>
      <thead>
        <tr>
          <th>Amaç</th>
          <th>Hukuki sebep (KVKK m. 5/2)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Hesap oluşturma, oturum açma, skorların kaydedilmesi, sıralama, düello ve odaların sunulması</td>
          <td>(c) Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması</td>
        </tr>
        <tr>
          <td>Puanın sunucuda hesaplanarak hilenin önlenmesi, hizmetin ve bilgi güvenliğinin sağlanması</td>
          <td>(f) Veri sorumlusunun meşru menfaati</td>
        </tr>
        <tr>
          <td>Toplu oyun istatistiklerinin (en çok yanlış yapılan yerler) üretilmesi</td>
          <td>(f) Veri sorumlusunun meşru menfaati</td>
        </tr>
        <tr>
          <td>Web sitesi sayfalarının ne kadar kullanıldığının anonim olarak ölçülmesi ve sitenin iyileştirilmesi</td>
          <td>(f) Veri sorumlusunun meşru menfaati</td>
        </tr>
        <tr>
          <td>Yetkili kurum ve kuruluşların talepleri ile hukuki yükümlülüklerin yerine getirilmesi</td>
          <td>(ç) Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi</td>
        </tr>
      </tbody>
    </table>
    <p>
      Sıralamada ve düello ya da odalarda gösterilen ad ve profil fotoğrafı, oyunun kendisinin bir parçası olarak
      yukarıdaki (c) bendine dayanılarak diğer oyunculara açılır. E-posta adresi hiçbir zaman diğer kullanıcılara
      gösterilmez.
    </p>
    <p>
      Ziyaret istatistikleri Vercel Web Analytics ile toplanır. Bu hizmet çerez kullanmaz, ziyaretçiyi tanımlamaz ve
      siteler arasında takip etmez; yalnızca anonim sayfa görüntüleme sayıları üretir. iOS ve Android uygulamalarında
      analitik hizmeti çalışmaz.
    </p>

    <h2>4. Toplama yöntemi</h2>
    <p>
      Kişisel veriler, web sitesi ve mobil uygulamalar üzerinden elektronik ortamda; Google ile girişte Google&apos;dan,
      misafir girişinde doğrudan kullanıcıdan ve oyun sırasında otomatik yollarla toplanır.
    </p>

    <h2>5. Aktarım</h2>
    <p>
      Kişisel veriler yalnızca hizmetin sunulması amacıyla, veri işleyen sıfatıyla hizmet veren şu sağlayıcılara
      aktarılır: Supabase (veritabanı ve kimlik doğrulama), Vercel (web barındırma ve ziyaret istatistikleri) ve
      Google (Google ile giriş). Bu sağlayıcıların sunucuları Türkiye dışında bulunduğundan veriler yurt dışına
      aktarılmaktadır. Aktarım KVKK m. 9 çerçevesinde yapılır.
    </p>
    <p>
      Bunların dışında kişisel veriler, yalnızca kanunen yetkili kamu kurum ve kuruluşlarına, talep etmeleri hâlinde
      ve hukuki yükümlülük kapsamında aktarılabilir. Kişisel veriler satılmaz, reklam veya pazarlama amacıyla
      paylaşılmaz.
    </p>

    <h2>6. Saklama süresi</h2>
    <p>
      Kişisel veriler hesap silinene kadar saklanır. Hesap uygulama içinden silindiğinde hesap bilgileri ve oyun
      verileri derhâl ve kalıcı olarak silinir. Başlatılıp tamamlanmayan yarış turları bir gün içinde silinir.
      Hizmet sağlayıcıların sunucu kayıtları kendi saklama sürelerine tabidir.
    </p>

    <h2>7. KVKK m. 11 kapsamındaki hakların</h2>
    <p>Veri sorumlusuna başvurarak şu haklarını kullanabilirsin:</p>
    <ol type="a">
      <li>Kişisel verilerinin işlenip işlenmediğini öğrenme,</li>
      <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
      <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
      <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
      <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
      <li>KVKK m. 7&apos;de öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme,</li>
      <li>(e) ve (f) bentleri uyarınca yapılan işlemlerin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
      <li>
        İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhine bir sonucun
        ortaya çıkmasına itiraz etme,
      </li>
      <li>Kanuna aykırı işleme sebebiyle zarara uğraman hâlinde zararın giderilmesini talep etme.</li>
    </ol>

    <h2>8. Başvuru</h2>
    <p>
      Haklarını kullanmak için talebini, adını ve Harita Avcısı&apos;nda kullandığın hesabı (Google ile girdiysen
      e-posta adresini, misafir olarak girdiysen sıralamada görünen adını) belirterek <ContactEmail /> adresine
      iletebilirsin. Başvurun, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ uyarınca en geç 30 gün
      içinde ücretsiz olarak sonuçlandırılır.
    </p>
    <p>
      Hesabını ve verilerini silmek için başvuru yapman gerekmez; bunu uygulamanın içinden hemen yapabilirsin. Bkz.{" "}
      <Link href="/hesap-silme">Hesap Silme</Link>.
    </p>
  </>
);

/** Bilgi amaçlı çeviri: KVKK aydınlatma yükümlülüğü Türkçe metinle yerine getirilir, esas metin Türkçedir. */
const ENGLISH = (
  <>
    <p>
      This notice is provided under Article 10 of Türkiye&apos;s Personal Data Protection Law No. 6698
      (&ldquo;KVKK&rdquo;) to explain how the personal data of people using the Harita Avcısı website and mobile apps is
      processed. The same topics are explained in plain language in the <Link href="/gizlilik">Privacy Policy</Link>.
    </p>

    <h2>1. Data controller</h2>
    <p>
      The data controller is {DATA_CONTROLLER}. Contact: <ContactEmail />.
    </p>

    <h2>2. Personal data processed</h2>
    <table>
      <thead>
        <tr>
          <th>Data category</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Identity</td>
          <td>Name and surname (with Google sign-in), the name entered for guest sign-in, profile photo</td>
        </tr>
        <tr>
          <td>Contact</td>
          <td>Email address (with Google sign-in)</td>
        </tr>
        <tr>
          <td>Customer transaction</td>
          <td>Account ID, race results (score, time, streak), answers given, duel and room records</td>
        </tr>
        <tr>
          <td>Transaction security</td>
          <td>IP address, browser or device information, session information and server logs</td>
        </tr>
        <tr>
          <td>Visit statistics</td>
          <td>
            Website only: page viewed (with duel and room codes removed), approximate country, device type, browser and
            operating system
          </td>
        </tr>
      </tbody>
    </table>

    <h2>3. Purposes and legal grounds</h2>
    <table>
      <thead>
        <tr>
          <th>Purpose</th>
          <th>Legal ground (KVKK Art. 5/2)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Creating accounts, signing in, saving scores, and providing the leaderboard, duels and rooms</td>
          <td>(c) Directly related to the conclusion or performance of a contract</td>
        </tr>
        <tr>
          <td>Preventing cheating by calculating scores on the server, and ensuring service and information security</td>
          <td>(f) Legitimate interest of the data controller</td>
        </tr>
        <tr>
          <td>Producing aggregate game statistics (most missed places)</td>
          <td>(f) Legitimate interest of the data controller</td>
        </tr>
        <tr>
          <td>Anonymously measuring how much website pages are used and improving the site</td>
          <td>(f) Legitimate interest of the data controller</td>
        </tr>
        <tr>
          <td>Responding to requests from authorized authorities and fulfilling legal obligations</td>
          <td>(ç) Necessary for the data controller to fulfil a legal obligation</td>
        </tr>
      </tbody>
    </table>
    <p>
      The name and profile photo shown on the leaderboard and in duels or rooms are shared with other players as part of
      the game itself, based on ground (c) above. The email address is never shown to other users.
    </p>
    <p>
      Visit statistics are collected with Vercel Web Analytics. This service uses no cookies, doesn&apos;t identify
      visitors and doesn&apos;t track them across sites; it only produces anonymous page view counts. No analytics
      service runs in the iOS and Android apps.
    </p>

    <h2>4. Method of collection</h2>
    <p>
      Personal data is collected electronically through the website and mobile apps: from Google with Google sign-in,
      directly from the user with guest sign-in, and automatically during play.
    </p>

    <h2>5. Transfers</h2>
    <p>
      Personal data is transferred only to deliver the service, to the following providers acting as data processors:
      Supabase (database and authentication), Vercel (web hosting and visit statistics) and Google (Google sign-in).
      Because these providers&apos; servers are located outside Türkiye, data is transferred abroad. Transfers are made
      within the framework of KVKK Art. 9.
    </p>
    <p>
      Beyond these, personal data may only be transferred to legally authorized public institutions, upon their request
      and within the scope of a legal obligation. Personal data is not sold and is not shared for advertising or
      marketing.
    </p>

    <h2>6. Retention period</h2>
    <p>
      Personal data is kept until the account is deleted. When the account is deleted from within the app, account
      information and game data are deleted immediately and permanently. Races that were started but not completed are
      deleted within a day. Service providers&apos; server logs are subject to their own retention periods.
    </p>

    <h2>7. Your rights under KVKK Art. 11</h2>
    <p>By applying to the data controller, you can:</p>
    <ol type="a">
      <li>Learn whether your personal data is processed,</li>
      <li>Request information if it has been processed,</li>
      <li>Learn the purpose of processing and whether it is used in line with that purpose,</li>
      <li>Know the third parties in Türkiye or abroad to whom it has been transferred,</li>
      <li>Request correction if it has been processed incompletely or incorrectly,</li>
      <li>Request its deletion or destruction under the conditions set out in KVKK Art. 7,</li>
      <li>Request that the actions under items (e) and (f) be notified to the third parties to whom the data was transferred,</li>
      <li>Object to a result against you arising from the analysis of the processed data exclusively by automated systems,</li>
      <li>Claim compensation if you suffer damage due to unlawful processing.</li>
    </ol>

    <h2>8. Applications</h2>
    <p>
      To exercise your rights, send your request to <ContactEmail />, stating your name and the account you use in
      Harita Avcısı (your email address if you signed in with Google, or the name shown on the leaderboard if you
      signed in as a guest). Under the Communiqué on the Procedures and Principles of Applications to the Data
      Controller, your application is concluded free of charge within 30 days at the latest.
    </p>
    <p>
      You don&apos;t need to apply to delete your account and data; you can do it right away from within the app. See{" "}
      <Link href="/hesap-silme">Account deletion</Link>.
    </p>
  </>
);

export default function KvkkPage() {
  return (
    <LegalPage
      en={{ title: "KVKK Information Notice", updated: "18 October 2026", body: ENGLISH, isCourtesyTranslation: true }}
      tr={{ title: "KVKK Aydınlatma Metni", updated: "18 Ekim 2026", body: TURKISH }}
    />
  );
}
