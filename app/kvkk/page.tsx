import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, DATA_CONTROLLER, LegalPage } from "../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni · Harita Avcısı",
  description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Harita Avcısı aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <LegalPage title="KVKK Aydınlatma Metni" updated="13 Ekim 2026">
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

      <h2>4. Toplama yöntemi</h2>
      <p>
        Kişisel veriler, web sitesi ve mobil uygulamalar üzerinden elektronik ortamda; Google ile girişte Google&apos;dan,
        misafir girişinde doğrudan kullanıcıdan ve oyun sırasında otomatik yollarla toplanır.
      </p>

      <h2>5. Aktarım</h2>
      <p>
        Kişisel veriler yalnızca hizmetin sunulması amacıyla, veri işleyen sıfatıyla hizmet veren şu sağlayıcılara
        aktarılır: Supabase (veritabanı ve kimlik doğrulama), Vercel (web barındırma) ve Google (Google ile giriş).
        Bu sağlayıcıların sunucuları Türkiye dışında bulunduğundan veriler yurt dışına aktarılmaktadır. Aktarım KVKK
        m. 9 çerçevesinde yapılır.
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
    </LegalPage>
  );
}
