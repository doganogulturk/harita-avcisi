import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, DATA_CONTROLLER, LegalPage } from "../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Hesap Silme · Harita Avcısı",
  description: "Harita Avcısı hesabını ve bütün verilerini nasıl silersin.",
};

/** Google Play, hesap silmenin uygulama dışından da anlatıldığı bir sayfa ister; bu adres mağaza kaydına yazılır. */
export default function AccountDeletionPage() {
  return (
    <LegalPage title="Hesap Silme" updated="13 Ekim 2026">
      <p>
        Bu sayfa, {DATA_CONTROLLER} tarafından geliştirilen <strong>Harita Avcısı</strong> oyununda (web sitesi, iOS ve
        Android uygulaması) hesabını ve verilerini nasıl silebileceğini anlatır.
      </p>

      <h2>Oyunun içinden silme (hemen)</h2>
      <ol>
        <li>Harita Avcısı&apos;nı aç (uygulamada ya da sitede) ve silmek istediğin hesapla giriş yapmış ol.</li>
        <li>Ana menüde sağ üstte, adının altındaki <strong>Hesabı sil</strong> bağlantısına dokun.</li>
        <li>
          Açılan pencerede <strong>Hesabımı sil</strong>&apos;e dokunarak onayla.
        </li>
      </ol>
      <p>Hesabın ve aşağıdaki bütün verilerin hemen silinir, oturumun kapanır. Bu işlem geri alınamaz.</p>

      <h2>E-postayla silme talebi</h2>
      <p>
        Uygulamaya artık erişemiyorsan (ör. uygulamayı kaldırdıysan) <ContactEmail /> adresine &ldquo;Hesap silme&rdquo;
        konulu bir e-posta gönder. Hesabını bulabilmemiz için şunlardan birini yaz:
      </p>
      <ul>
        <li>Google ile girdiysen: Google hesabının e-posta adresi (talebi bu adresten göndermen en hızlısı),</li>
        <li>Misafir olarak girdiysen: sıralamada görünen adın ve yaklaşık olarak ne zaman oynadığın.</li>
      </ul>
      <p>Talebini en geç 30 gün içinde sonuçlandırır, silindiğini e-postayla bildiririz.</p>

      <h2>Neler silinir</h2>
      <ul>
        <li>Hesap bilgilerin: adın, e-posta adresin, profil fotoğrafın ve hesap kimliğin,</li>
        <li>Sıralamadaki bütün skorların ve yarış turlarında verdiğin cevaplar,</li>
        <li>Kurduğun ya da katıldığın düellolar ve kurduğun odalar, katıldığın odalardaki kayıtların.</li>
      </ul>
      <p>
        Silme kalıcıdır; bu verilerin hiçbiri saklanmaz. Yalnızca hizmet sağlayıcıların sunucu kayıtları (IP adresi gibi
        teknik kayıtlar) kendi kısa saklama süreleri dolunca silinir. Ayrıntılar için{" "}
        <Link href="/gizlilik">Gizlilik Politikası</Link>.
      </p>

      <h2>Giriş yapmadan oynadıysan</h2>
      <p>
        Antrenman modunu giriş yapmadan oynadıysan hesabın yoktur ve sunucuda sana ait bir veri tutulmaz. Cihazında
        kalan oyun tercihlerini tarayıcı verilerini temizleyerek ya da uygulamayı kaldırarak silebilirsin.
      </p>
    </LegalPage>
  );
}
