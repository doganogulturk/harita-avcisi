import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, DATA_CONTROLLER, LegalPage } from "../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Kullanım Koşulları · Harita Avcısı",
  description: "Harita Avcısı'nın kullanım koşulları, oyun kuralları ve kaynak lisansları.",
};

/** Haritalar, bayraklar ve yazı tipinin kaynakları; iki dilde aynı tablo. */
function SourcesTable({ headers, rows }: { headers: [string, string, string]; rows: [string, string, string, string] }) {
  return (
    <table>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{rows[0]}</td>
          <td>
            <a href="https://github.com/dnomak/svg-turkiye-haritasi" rel="noreferrer" target="_blank">
              dnomak/svg-turkiye-haritasi
            </a>
          </td>
          <td>MIT</td>
        </tr>
        <tr>
          <td>{rows[1]}</td>
          <td>
            <a href="https://github.com/flekschas/simple-world-map" rel="noreferrer" target="_blank">
              flekschas/simple-world-map
            </a>
          </td>
          <td>
            <a href="https://creativecommons.org/licenses/by-sa/3.0/" rel="noreferrer" target="_blank">
              CC BY-SA 3.0
            </a>
          </td>
        </tr>
        <tr>
          <td>{rows[2]}</td>
          <td>
            <a href="https://github.com/lipis/flag-icons" rel="noreferrer" target="_blank">
              lipis/flag-icons
            </a>
          </td>
          <td>MIT</td>
        </tr>
        <tr>
          <td>{rows[3]}</td>
          <td>
            <a href="https://fonts.google.com/specimen/Stack+Sans+Notch" rel="noreferrer" target="_blank">
              Stack Sans Notch
            </a>
          </td>
          <td>SIL Open Font License 1.1</td>
        </tr>
      </tbody>
    </table>
  );
}

const TURKISH = (
  <>
    <p>
      Harita Avcısı&apos;nı (web sitesi ve iOS ile Android uygulamaları) kullanarak bu koşulları kabul etmiş olursun.
      Kişisel verilerinin nasıl işlendiği <Link href="/gizlilik">Gizlilik Politikası</Link>&apos;nda anlatılır.
    </p>

    <h2>Hizmet</h2>
    <p>
      Harita Avcısı, {DATA_CONTROLLER} tarafından sunulan, Türkiye ve dünya haritası üzerine ücretsiz bir bilgi
      oyunudur. Oyun &ldquo;olduğu gibi&rdquo; sunulur; kesintisiz ya da hatasız çalışacağı, sıralamanın ve
      kayıtların her zaman korunacağı garanti edilmez. Oyunun özelliklerini önceden haber vermeden değiştirebilir,
      bir bölümünü ya da tamamını kapatabiliriz.
    </p>

    <h2>Hesap</h2>
    <ul>
      <li>Yarış, düello ve oda modları için Google ile ya da misafir olarak giriş gerekir.</li>
      <li>
        Misafir hesabı yalnızca giriş yaptığın cihazda ve tarayıcıda durur. Oturum bilgisi silinirse (ör. tarayıcı
        verilerini temizlediğinde ya da uygulamayı kaldırdığında) o hesaba yeniden erişilemez.
      </li>
      <li>
        Hesabını istediğin an silebilirsin; bkz. <Link href="/hesap-silme">Hesap Silme</Link>.
      </li>
    </ul>

    <h2>Ad ve davranış kuralları</h2>
    <p>Sıralamada, düellolarda ve odalarda görünen ad herkese açıktır. Şunlar yasaktır:</p>
    <ul>
      <li>Hakaret, küfür, nefret söylemi, müstehcenlik içeren ya da başkasını taciz eden adlar,</li>
      <li>Başka bir kişi ya da kurum gibi davranmak,</li>
      <li>
        Puanı ya da sıralamayı hile, otomatik araç, oyunun kodunu veya sunucuya giden istekleri değiştirme gibi
        yollarla etkilemeye çalışmak,
      </li>
      <li>Hizmetin çalışmasını bozmaya, aşırı yük bindirmeye ya da güvenliğini aşmaya çalışmak.</li>
    </ul>
    <p>
      Bu kurallara uymayan adları değiştirme ya da kaldırma, ilgili skorları sıralamadan çıkarma ve hesabı kapatma
      hakkımız saklıdır.
    </p>

    <h2>Fikri mülkiyet ve kaynaklar</h2>
    <p>
      Oyunun tasarımı ve kodu {DATA_CONTROLLER}&apos;e aittir. Haritalar, bayraklar ve yazı tipi aşağıdaki açık
      lisanslı kaynaklardan alınmıştır:
    </p>
    <SourcesTable headers={["Varlık", "Kaynak", "Lisans"]} rows={["Türkiye haritası", "Dünya haritası", "Bayraklar", "Başlık yazı tipi"]} />
    <p>
      Haritalar oyun amacıyla kullanılır; gösterilen sınırlar resmî sınırları ya da herhangi bir siyasi görüşü temsil
      etmez.
    </p>

    <h2>Sorumluluğun sınırı</h2>
    <p>
      Harita Avcısı ücretsiz bir eğlence ve öğrenme aracıdır. Yürürlükteki mevzuatın izin verdiği ölçüde, oyunun
      kullanılmasından ya da kullanılamamasından doğan dolaylı zararlardan, kaybolan skor ve kayıtlardan sorumlu
      tutulamayız.
    </p>

    <h2>Değişiklikler</h2>
    <p>
      Bu koşulları güncellediğimizde yeni hâlini bu sayfada yayımlar, üstteki tarihi değiştiririz. Güncellemeden sonra
      oyunu kullanmaya devam etmen yeni koşulları kabul ettiğin anlamına gelir.
    </p>

    <h2>Uygulanacak hukuk ve iletişim</h2>
    <p>
      Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Soruların ve bildirimlerin için: <ContactEmail />.
    </p>
  </>
);

const ENGLISH = (
  <>
    <p>
      By using Harita Avcısı (the website and the iOS and Android apps) you accept these terms. How your personal data
      is processed is explained in the <Link href="/gizlilik">Privacy Policy</Link>.
    </p>

    <h2>The service</h2>
    <p>
      Harita Avcısı is a free geography quiz game on maps of Türkiye and the world, offered by {DATA_CONTROLLER}. The game
      is provided &ldquo;as is&rdquo;; there is no guarantee that it will run without interruptions or errors, or that
      the leaderboard and records will always be kept. We may change features, or close part or all of the game, without
      prior notice.
    </p>

    <h2>Accounts</h2>
    <ul>
      <li>Races, duels and rooms require signing in with Google or as a guest.</li>
      <li>
        A guest account exists only on the device and browser you signed in with. If the session is deleted (for example
        when you clear browser data or uninstall the app), that account can&apos;t be accessed again.
      </li>
      <li>
        You can delete your account at any time; see <Link href="/hesap-silme">Account deletion</Link>.
      </li>
    </ul>

    <h2>Names and conduct</h2>
    <p>The name shown on the leaderboard, in duels and in rooms is public. The following are not allowed:</p>
    <ul>
      <li>Names that are insulting, profane, hateful, obscene or harass others,</li>
      <li>Impersonating another person or organization,</li>
      <li>
        Trying to influence scores or the leaderboard through cheating, automated tools, or by modifying the game&apos;s
        code or the requests sent to the server,
      </li>
      <li>Trying to disrupt, overload or break the security of the service.</li>
    </ul>
    <p>
      We reserve the right to change or remove names that break these rules, remove the related scores from the
      leaderboard and close the account.
    </p>

    <h2>Intellectual property and sources</h2>
    <p>
      The game&apos;s design and code belong to {DATA_CONTROLLER}. The maps, flags and font come from the following
      openly licensed sources:
    </p>
    <SourcesTable headers={["Asset", "Source", "License"]} rows={["Map of Türkiye", "World map", "Flags", "Heading font"]} />
    <p>
      The maps are used for the purposes of the game; the borders shown don&apos;t represent official borders or any
      political position.
    </p>

    <h2>Limitation of liability</h2>
    <p>
      Harita Avcısı is a free tool for fun and learning. To the extent permitted by applicable law, we can&apos;t be held
      liable for indirect damages arising from using or being unable to use the game, or for lost scores and records.
    </p>

    <h2>Changes</h2>
    <p>
      When we update these terms, we publish the new version on this page and change the date above. Continuing to use
      the game after an update means you accept the new terms.
    </p>

    <h2>Governing law and contact</h2>
    <p>
      These terms are governed by the laws of the Republic of Türkiye. For questions and notices: <ContactEmail />.
    </p>
  </>
);

export default function TermsPage() {
  return (
    <LegalPage
      en={{ title: "Terms of Use", updated: "26 October 2026", body: ENGLISH }}
      tr={{ title: "Kullanım Koşulları", updated: "13 Ekim 2026", body: TURKISH }}
    />
  );
}
