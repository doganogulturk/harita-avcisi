import type { Metadata } from "next";
import Link from "next/link";
import { AccountDeletionPanel } from "../components/legal/AccountDeletionPanel";
import { ContactEmail, DATA_CONTROLLER, LegalPage } from "../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Hesap Silme · Harita Avcısı",
  description: "Harita Avcısı hesabını ve bütün verilerini nasıl silersin.",
};

/** Google Play, hesap silmenin uygulama dışından da anlatıldığı bir sayfa ister; bu adres mağaza kaydına yazılır. */
export default function AccountDeletionPage() {
  return (
    <LegalPage title="Hesap Silme">
      <p>
        Bu sayfa, {DATA_CONTROLLER} tarafından geliştirilen <strong>Harita Avcısı</strong> oyununda (web sitesi, iOS ve
        Android uygulaması) hesabını ve verilerini nasıl silebileceğini anlatır.
      </p>

      <h2>Oyunun içinden silme (hemen)</h2>
      <ol>
        <li>Harita Avcısı&apos;nı aç (uygulamada ya da sitede) ve silmek istediğin hesapla giriş yapmış ol.</li>
        <li>
          Ana menüde sağ üstteki <strong>ⓘ</strong> menüsünden <strong>Hesap silme</strong>&apos;yi seç; bu sayfa açılır.
        </li>
        <li>
          Sayfanın sonundaki <strong>Hesabımı sil</strong> tuşuna dokun ve açılan pencerede onayla.
        </li>
      </ol>
      <p>Hesabın ve aşağıdaki bütün verilerin hemen silinir, oturumun kapanır. Bu işlem geri alınamaz.</p>

      {/* Google Play, silmenin uygulamaya girmeden de istenebilmesini şart koşar: uygulamayı kaldıran ya da misafir
          olarak oynadığı cihaza artık erişemeyen oyuncu hesabına giremez, ona kalan yol budur. */}
      <h2>Uygulamaya erişemiyorsan</h2>
      <p>
        Uygulamayı kaldırdıysan ya da misafir olarak oynadığın cihaza artık erişemiyorsan <ContactEmail /> adresine
        &ldquo;Hesap silme&rdquo; konulu bir e-posta gönder; Google hesabının e-posta adresini ya da sıralamada görünen
        adını yaz. Talebini en geç 30 gün içinde sonuçlandırırız.
      </p>

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

      {/* Giriş yapmış oyuncu hesabını doğrudan buradan siler; ne silineceğini okuduktan sonra, sayfanın sonunda. */}
      <AccountDeletionPanel />
    </LegalPage>
  );
}
