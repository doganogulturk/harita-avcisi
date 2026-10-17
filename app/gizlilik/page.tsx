import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, DATA_CONTROLLER, LegalPage } from "../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Gizlilik Politikası · Harita Avcısı",
  description: "Harita Avcısı hangi verileri neden işler, kimlerle paylaşır ve ne kadar saklar.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Gizlilik Politikası" updated="18 Ekim 2026">
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
        kaydedilmez. Yalnızca oyun tercihlerin (son seçtiğin harita, mod gibi) kendi cihazında saklanır.
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
      <p>
        Bu politikayı güncellediğimizde yeni hâlini bu sayfada yayımlar, üstteki tarihi değiştiririz.
      </p>
    </LegalPage>
  );
}
