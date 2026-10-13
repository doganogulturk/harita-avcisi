import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, DATA_CONTROLLER, LegalPage } from "../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Kullanım Koşulları · Harita Avcısı",
  description: "Harita Avcısı'nın kullanım koşulları, oyun kuralları ve kaynak lisansları.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Kullanım Koşulları" updated="13 Ekim 2026">
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
      <table>
        <thead>
          <tr>
            <th>Varlık</th>
            <th>Kaynak</th>
            <th>Lisans</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Türkiye haritası</td>
            <td>
              <a href="https://github.com/dnomak/svg-turkiye-haritasi" rel="noreferrer" target="_blank">
                dnomak/svg-turkiye-haritasi
              </a>
            </td>
            <td>MIT</td>
          </tr>
          <tr>
            <td>Dünya haritası</td>
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
            <td>Bayraklar</td>
            <td>
              <a href="https://github.com/lipis/flag-icons" rel="noreferrer" target="_blank">
                lipis/flag-icons
              </a>
            </td>
            <td>MIT</td>
          </tr>
          <tr>
            <td>Başlık yazı tipi</td>
            <td>
              <a href="https://fonts.google.com/specimen/Stack+Sans+Notch" rel="noreferrer" target="_blank">
                Stack Sans Notch
              </a>
            </td>
            <td>SIL Open Font License 1.1</td>
          </tr>
        </tbody>
      </table>
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
    </LegalPage>
  );
}
