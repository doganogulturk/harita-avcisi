import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, DATA_CONTROLLER, LegalPage } from "../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Gizlilik Politikası · Harita Avcısı",
  description: "Harita Avcısı hangi verileri neden işler, kimlerle paylaşır ve ne kadar saklar.",
};

const TURKISH = (
  <>
    <p>
      Bu politika, Harita Avcısı web sitesinde ve iOS ile Android uygulamalarında (birlikte &ldquo;Harita Avcısı&rdquo;)
      hangi kişisel verilerin işlendiğini, neden işlendiğini ve bu veriler üzerindeki haklarını anlatır. Kişisel
      verilerin 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamındaki ayrıntıları için{" "}
      <Link href="/kvkk">KVKK Aydınlatma Metni</Link>&apos;ne bakabilirsin.
    </p>

    <h2>Veri sorumlusu</h2>
    <p>
      Harita Avcısı&apos;nı {DATA_CONTROLLER} geliştirir ve işletir. Gizlilikle ilgili her soru ve talep için:{" "}
      <ContactEmail />.
    </p>

    <h2>Giriş yapmadan</h2>
    <p>
      Antrenman modu ve sıralamayı görüntüleme giriş gerektirmez. Bu durumda hesabın olmaz ve oyun sonuçların
      kaydedilmez. Yalnızca oyun tercihlerin (son seçtiğin harita, mod, dil gibi) kendi cihazında saklanır.
    </p>

    <h2>İşlenen veriler</h2>
    <h3>Hesap bilgileri</h3>
    <ul>
      <li>
        <strong>Google ile giriş:</strong> Google hesabındaki adın, e-posta adresin, profil fotoğrafının adresi ve
        Google hesap kimliğin. Google şifrene hiçbir zaman erişmeyiz.
      </li>
      <li>
        <strong>Misafir girişi:</strong> yalnızca yazdığın ad. Gerçek adını yazmak zorunda değilsin.
      </li>
    </ul>

    <h3>Oyun verileri</h3>
    <ul>
      <li>Yarış turlarının sonuçları: puan, süre, en uzun doğru serisi ve tarih.</li>
      <li>Yarış turlarında verdiğin cevaplar (hangi yer soruldu, hangisini seçtin).</li>
      <li>Düello ve oda kayıtları: kurduğun ya da katıldığın düello ve odalar, bunlardaki cevapların ve puanların.</li>
    </ul>

    <h3>Teknik veriler</h3>
    <p>
      Siteyi ve uygulamayı barındıran hizmet sağlayıcılar, güvenlik ve işletim amacıyla IP adresi, tarayıcı ya da
      cihaz bilgisi ve istek zamanı gibi sunucu kayıtlarını kısa süreliğine tutar.
    </p>

    <h3>Ziyaret istatistikleri</h3>
    <p>
      Web sitesinde hangi sayfaların kaç kez açıldığını görmek için Vercel Web Analytics kullanılır. Çerez kullanmaz
      ve seni tanımaz: yalnızca anonim sayfa görüntülemelerini, kabaca hangi ülkeden ve hangi cihaz türünden
      (telefon, bilgisayar) gelindiğini sayar. Seni siteler arasında takip etmez, bir profil çıkarmaz. Düello ve oda
      kodları adresten silinerek gönderilir. Bu istatistik yalnızca web sitesinde vardır; iOS ve Android
      uygulamalarında hiçbir analitik hizmeti çalışmaz.
    </p>

    <h3>Cihazında saklananlar</h3>
    <p>
      Oturum bilgin ve oyun tercihlerin cihazının yerel depolamasında tutulur. Harita Avcısı reklam ya da izleme
      çerezi kullanmaz, reklam hizmeti barındırmaz. Tek analitik, yukarıdaki çerezsiz ziyaret istatistikleridir.
    </p>

    <h2>Herkese açık olanlar</h2>
    <p>
      Sıralama giriş yapmadan da görülebilir. Bir yarış turunu bitirdiğinde <strong>adın, profil fotoğrafın</strong>{" "}
      (Google ile girdiysen) ve <strong>skorun</strong> sıralamada herkese görünür. Düello ve odalarda da rakiplerin
      adını ve fotoğrafını görür. E-posta adresin hiçbir zaman gösterilmez. Adının görünmesini istemiyorsan misafir
      olarak takma bir adla oynayabilirsin.
    </p>
    <p>
      &ldquo;En çok yanlış yapılan yerler&rdquo; listesi tüm oyuncuların yarış cevaplarından toplu olarak hesaplanır;
      bu listede kimin ne cevap verdiği görünmez.
    </p>

    <h2>Verileri neden işliyoruz</h2>
    <ul>
      <li>Hesabını oluşturmak ve oturumunu açık tutmak.</li>
      <li>Skorlarını kaydetmek ve sıralamayı göstermek.</li>
      <li>Düello ve odaları çalıştırmak, rakiplerine adını ve fotoğrafını göstermek.</li>
      <li>Puanı sunucuda hesaplayarak hileyi önlemek ve hizmetin güvenliğini sağlamak.</li>
      <li>&ldquo;En çok yanlış yapılan yerler&rdquo; gibi toplu oyun istatistiklerini üretmek.</li>
      <li>Web sitesinin hangi sayfalarının ne kadar kullanıldığını anonim olarak görüp siteyi iyileştirmek.</li>
    </ul>
    <p>Verilerini reklam, profil çıkarma ya da pazarlama için kullanmayız ve kimseye satmayız.</p>

    <h2>Hizmet sağlayıcılar ve yurt dışına aktarım</h2>
    <p>Harita Avcısı şu hizmet sağlayıcılarla çalışır; veriler yalnızca hizmetin sunulması için onlara iletilir:</p>
    <table>
      <thead>
        <tr>
          <th>Sağlayıcı</th>
          <th>Ne için</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Supabase</td>
          <td>Veritabanı ve oturum açma: hesap bilgileri ve oyun verileri burada saklanır.</td>
        </tr>
        <tr>
          <td>Vercel</td>
          <td>Web sitesinin barındırılması ve çerezsiz ziyaret istatistikleri (Vercel Web Analytics).</td>
        </tr>
        <tr>
          <td>Google</td>
          <td>Google ile giriş. Profil fotoğrafları Google&apos;ın sunucularından yüklenir.</td>
        </tr>
      </tbody>
    </table>
    <p>
      Bu sağlayıcıların sunucuları Türkiye dışında bulunur; bu nedenle kişisel verilerin yurt dışına aktarılır.
      Ayrıntılar <Link href="/kvkk">KVKK Aydınlatma Metni</Link>&apos;nde.
    </p>

    <h2>Ne kadar saklıyoruz</h2>
    <ul>
      <li>Hesap bilgilerin ve oyun verilerin, hesabını silene kadar saklanır.</li>
      <li>Başlatılıp bitirilmeyen yarış turları bir gün içinde silinir.</li>
      <li>Hesabını sildiğinde hesap bilgilerin ve bütün oyun verilerin hemen ve kalıcı olarak silinir.</li>
    </ul>

    <h2>Hesabını silme</h2>
    <p>
      Hesabını ve bütün verilerini istediğin an uygulamanın içinden silebilirsin. Adımlar ve diğer yollar için{" "}
      <Link href="/hesap-silme">Hesap Silme</Link> sayfasına bakabilirsin.
    </p>

    <h2>Haklarına ilişkin</h2>
    <p>
      Verilerine erişme, düzeltilmesini ya da silinmesini isteme ve KVKK&apos;nın 11. maddesindeki diğer haklarını
      kullanmak için <ContactEmail /> adresine yazabilirsin. Talebine en geç 30 gün içinde yanıt veririz.
    </p>

    <h2>Çocuklar</h2>
    <p>
      Harita Avcısı genel kitleye yönelik bir eğitici oyundur ve özellikle çocuklara yönelik değildir. Google ile
      giriş yalnızca Google&apos;ın yaş koşullarını karşılayan hesaplarla yapılabilir. Misafir girişinde gerçek ad
      yazmak gerekmez; çocukların takma ad kullanmasını öneririz.
    </p>

    <h2>Değişiklikler</h2>
    <p>Bu politikayı güncellediğimizde yeni hâlini bu sayfada yayımlar, üstteki tarihi değiştiririz.</p>
  </>
);

const ENGLISH = (
  <>
    <p>
      This policy explains which personal data the Harita Avcısı website and its iOS and Android apps (together
      &ldquo;Harita Avcısı&rdquo;) process, why they process it, and your rights over that data. For details under
      Türkiye&apos;s Personal Data Protection Law No. 6698, see the <Link href="/kvkk">KVKK notice</Link>.
    </p>

    <h2>Data controller</h2>
    <p>
      Harita Avcısı is developed and operated by {DATA_CONTROLLER}. For any privacy question or request:{" "}
      <ContactEmail />.
    </p>

    <h2>Without signing in</h2>
    <p>
      Practice mode and viewing the leaderboard don&apos;t require an account. In that case you have no account and your
      results aren&apos;t saved. Only your game preferences (such as the last map, mode and language you chose) are
      stored on your own device.
    </p>

    <h2>Data we process</h2>
    <h3>Account information</h3>
    <ul>
      <li>
        <strong>Sign in with Google:</strong> the name, email address, profile photo address and account ID of your
        Google account. We never have access to your Google password.
      </li>
      <li>
        <strong>Guest sign-in:</strong> only the name you type. You don&apos;t have to use your real name.
      </li>
    </ul>

    <h3>Game data</h3>
    <ul>
      <li>Results of your races: score, time, longest correct streak and date.</li>
      <li>The answers you give in races (which place was asked and which one you picked).</li>
      <li>Duel and room records: the duels and rooms you create or join, and your answers and scores in them.</li>
    </ul>

    <h3>Technical data</h3>
    <p>
      The service providers that host the website and the apps keep server logs such as IP address, browser or device
      information and request time for a short period, for security and operations.
    </p>

    <h3>Visit statistics</h3>
    <p>
      The website uses Vercel Web Analytics to see how often pages are opened. It uses no cookies and doesn&apos;t
      identify you: it only counts anonymous page views, roughly which country and which type of device (phone,
      computer) they come from. It doesn&apos;t track you across sites or build a profile. Duel and room codes are
      removed from addresses before they are sent. These statistics exist only on the website; no analytics service
      runs in the iOS and Android apps.
    </p>

    <h3>Stored on your device</h3>
    <p>
      Your session and your game preferences are kept in your device&apos;s local storage. Harita Avcısı uses no
      advertising or tracking cookies and hosts no ad services. The only analytics are the cookieless visit
      statistics above.
    </p>

    <h2>What is public</h2>
    <p>
      The leaderboard can be viewed without signing in. When you finish a race, <strong>your name, profile photo</strong>{" "}
      (if you signed in with Google) and <strong>score</strong> are visible to everyone on the leaderboard. In duels and
      rooms, your opponents also see your name and photo. Your email address is never shown. If you don&apos;t want your
      name shown, you can play as a guest with a nickname.
    </p>
    <p>
      The &ldquo;most missed places&rdquo; list is calculated in aggregate from all players&apos; race answers; it
      doesn&apos;t show who answered what.
    </p>

    <h2>Why we process data</h2>
    <ul>
      <li>To create your account and keep you signed in.</li>
      <li>To save your scores and show the leaderboard.</li>
      <li>To run duels and rooms and show your name and photo to your opponents.</li>
      <li>To prevent cheating by calculating scores on the server, and to keep the service secure.</li>
      <li>To produce aggregate game statistics such as the &ldquo;most missed places&rdquo;.</li>
      <li>To see anonymously which pages of the website are used and improve the site.</li>
    </ul>
    <p>We don&apos;t use your data for advertising, profiling or marketing, and we never sell it.</p>

    <h2>Service providers and international transfers</h2>
    <p>Harita Avcısı works with the following providers; data is shared with them only to deliver the service:</p>
    <table>
      <thead>
        <tr>
          <th>Provider</th>
          <th>Purpose</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Supabase</td>
          <td>Database and sign-in: account information and game data are stored here.</td>
        </tr>
        <tr>
          <td>Vercel</td>
          <td>Website hosting and cookieless visit statistics (Vercel Web Analytics).</td>
        </tr>
        <tr>
          <td>Google</td>
          <td>Sign in with Google. Profile photos are loaded from Google&apos;s servers.</td>
        </tr>
      </tbody>
    </table>
    <p>
      These providers&apos; servers are located outside Türkiye, so your personal data is transferred abroad. Details
      are in the <Link href="/kvkk">KVKK notice</Link>.
    </p>

    <h2>How long we keep data</h2>
    <ul>
      <li>Your account information and game data are kept until you delete your account.</li>
      <li>Races that were started but not finished are deleted within a day.</li>
      <li>When you delete your account, your account information and all game data are deleted immediately and permanently.</li>
    </ul>

    <h2>Deleting your account</h2>
    <p>
      You can delete your account and all your data from within the app at any time. For the steps and other options,
      see the <Link href="/hesap-silme">Account deletion</Link> page.
    </p>

    <h2>Your rights</h2>
    <p>
      To access your data, ask for it to be corrected or deleted, or exercise your other rights under Article 11 of the
      KVKK, write to <ContactEmail />. We reply within 30 days at the latest.
    </p>

    <h2>Children</h2>
    <p>
      Harita Avcısı is an educational game for a general audience and is not specifically aimed at children. Signing in
      with Google is only possible with accounts that meet Google&apos;s age requirements. Guest sign-in doesn&apos;t
      require a real name; we recommend that children use a nickname.
    </p>

    <h2>Changes</h2>
    <p>When we update this policy, we publish the new version on this page and change the date above.</p>
  </>
);

export default function PrivacyPage() {
  return (
    <LegalPage
      en={{ title: "Privacy Policy", updated: "26 October 2026", body: ENGLISH }}
      tr={{ title: "Gizlilik Politikası", updated: "26 Ekim 2026", body: TURKISH }}
    />
  );
}
