import type { Metadata } from "next";
import Link from "next/link";
import { AccountDeletionPanel } from "../components/legal/AccountDeletionPanel";
import { ContactEmail, DATA_CONTROLLER, LegalPage } from "../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Hesap Silme · Harita Avcısı",
  description: "Harita Avcısı hesabını ve bütün verilerini nasıl silersin.",
};

const TURKISH = (
  <>
    <p>
      Bu sayfa, {DATA_CONTROLLER} tarafından geliştirilen <strong>Harita Avcısı</strong> oyununda (web sitesi, iOS ve
      Android uygulaması) hesabını ve verilerini nasıl silebileceğini anlatır.
    </p>

    <h2>Oyunun içinden silme (hemen)</h2>
    <ol>
      <li>Harita Avcısı&apos;nı aç (uygulamada ya da sitede) ve silmek istediğin hesapla giriş yapmış ol.</li>
      <li>
        Ana menüde sağ üstteki profil resmine dokun, açılan menüden <strong>Hesap silme</strong>&apos;yi seç; bu sayfa açılır.
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
  </>
);

const ENGLISH = (
  <>
    <p>
      This page explains how to delete your account and data in <strong>Harita Avcısı</strong> (the website and the iOS
      and Android apps), developed by {DATA_CONTROLLER}.
    </p>

    <h2>Delete from within the game (immediately)</h2>
    <ol>
      <li>Open Harita Avcısı (in the app or on the website) and make sure you&apos;re signed in with the account you want to delete.</li>
      <li>
        On the home screen, tap your profile picture at the top right and choose <strong>Delete account</strong> from the
        menu; this page opens.
      </li>
      <li>
        Tap <strong>Delete my account</strong> at the bottom of the page and confirm in the dialog.
      </li>
    </ol>
    <p>Your account and all the data below are deleted immediately and you are signed out. This can&apos;t be undone.</p>

    <h2>If you can&apos;t access the app</h2>
    <p>
      If you uninstalled the app or no longer have the device you played on as a guest, send an email with the subject
      &ldquo;Account deletion&rdquo; to <ContactEmail />, including your Google account&apos;s email address or the name
      shown on the leaderboard. We complete your request within 30 days at the latest.
    </p>

    <h2>What is deleted</h2>
    <ul>
      <li>Your account information: name, email address, profile photo and account ID,</li>
      <li>All your leaderboard scores and the answers you gave in races,</li>
      <li>The duels you created or joined, the rooms you created, and your records in rooms you joined.</li>
    </ul>
    <p>
      Deletion is permanent; none of this data is kept. Only the service providers&apos; server logs (technical records
      such as IP addresses) are deleted when their own short retention periods end. Details in the{" "}
      <Link href="/gizlilik">Privacy Policy</Link>.
    </p>

    <h2>If you played without signing in</h2>
    <p>
      If you only played Practice without signing in, you have no account and no data about you is kept on the server.
      You can remove the game preferences left on your device by clearing your browser data or uninstalling the app.
    </p>

    <AccountDeletionPanel />
  </>
);

/** Google Play, hesap silmenin uygulama dışından da anlatıldığı bir sayfa ister; bu adres mağaza kaydına yazılır. */
export default function AccountDeletionPage() {
  return <LegalPage en={{ title: "Account deletion", body: ENGLISH }} tr={{ title: "Hesap Silme", body: TURKISH }} />;
}
