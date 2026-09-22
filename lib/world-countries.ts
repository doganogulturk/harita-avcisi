export type CountryTier = "common" | "rare";
export type WorldDifficulty = "normal" | "hard";

export type Country = {
  code: string;
  name: string;
  /** "common": tanınmış ülkeler (Normal havuzu). "rare": yalnızca Zor modda sorulur. */
  tier: CountryTier;
};

/** Kodlar public/maps/world.svg içindeki ISO 3166-1 alpha-2 id değerleriyle birebir eşleşir. */
export const countries: Country[] = [
  { code: "af", name: "Afganistan", tier: "rare" },
  { code: "de", name: "Almanya", tier: "common" },
  { code: "us", name: "Amerika Birleşik Devletleri", tier: "common" },
  { code: "ao", name: "Angola", tier: "rare" },
  { code: "ar", name: "Arjantin", tier: "common" },
  { code: "al", name: "Arnavutluk", tier: "rare" },
  { code: "au", name: "Avustralya", tier: "common" },
  { code: "at", name: "Avusturya", tier: "common" },
  { code: "az", name: "Azerbaycan", tier: "common" },
  { code: "bs", name: "Bahamalar", tier: "rare" },
  { code: "bd", name: "Bangladeş", tier: "rare" },
  { code: "by", name: "Belarus", tier: "rare" },
  { code: "be", name: "Belçika", tier: "common" },
  { code: "bz", name: "Belize", tier: "rare" },
  { code: "bj", name: "Benin", tier: "rare" },
  { code: "ae", name: "Birleşik Arap Emirlikleri", tier: "common" },
  { code: "gb", name: "Birleşik Krallık", tier: "common" },
  { code: "bo", name: "Bolivya", tier: "rare" },
  { code: "ba", name: "Bosna-Hersek", tier: "rare" },
  { code: "bw", name: "Botsvana", tier: "rare" },
  { code: "br", name: "Brezilya", tier: "common" },
  { code: "bn", name: "Brunei", tier: "rare" },
  { code: "bg", name: "Bulgaristan", tier: "common" },
  { code: "bf", name: "Burkina Faso", tier: "rare" },
  { code: "bi", name: "Burundi", tier: "rare" },
  { code: "bt", name: "Butan", tier: "rare" },
  { code: "cv", name: "Cabo Verde", tier: "rare" },
  { code: "dz", name: "Cezayir", tier: "rare" },
  { code: "dj", name: "Cibuti", tier: "rare" },
  { code: "td", name: "Çad", tier: "rare" },
  { code: "cz", name: "Çekya", tier: "common" },
  { code: "cn", name: "Çin", tier: "common" },
  { code: "dk", name: "Danimarka", tier: "common" },
  { code: "cd", name: "Demokratik Kongo Cumhuriyeti", tier: "rare" },
  { code: "do", name: "Dominik Cumhuriyeti", tier: "rare" },
  { code: "dm", name: "Dominika", tier: "rare" },
  { code: "ec", name: "Ekvador", tier: "rare" },
  { code: "gq", name: "Ekvator Ginesi", tier: "rare" },
  { code: "sv", name: "El Salvador", tier: "rare" },
  { code: "id", name: "Endonezya", tier: "common" },
  { code: "er", name: "Eritre", tier: "rare" },
  { code: "am", name: "Ermenistan", tier: "rare" },
  { code: "ee", name: "Estonya", tier: "rare" },
  { code: "sz", name: "Esvatini", tier: "rare" },
  { code: "et", name: "Etiyopya", tier: "rare" },
  { code: "fk", name: "Falkland Adaları", tier: "rare" },
  { code: "ma", name: "Fas", tier: "common" },
  { code: "ci", name: "Fildişi Sahili", tier: "rare" },
  { code: "ph", name: "Filipinler", tier: "common" },
  { code: "fi", name: "Finlandiya", tier: "common" },
  { code: "fr", name: "Fransa", tier: "common" },
  { code: "ga", name: "Gabon", tier: "rare" },
  { code: "gm", name: "Gambiya", tier: "rare" },
  { code: "gh", name: "Gana", tier: "rare" },
  { code: "gn", name: "Gine", tier: "rare" },
  { code: "gw", name: "Gine-Bissau", tier: "rare" },
  { code: "gl", name: "Grönland", tier: "rare" },
  { code: "gt", name: "Guatemala", tier: "rare" },
  { code: "gy", name: "Guyana", tier: "rare" },
  { code: "za", name: "Güney Afrika", tier: "common" },
  { code: "kr", name: "Güney Kore", tier: "common" },
  { code: "ss", name: "Güney Sudan", tier: "rare" },
  { code: "ge", name: "Gürcistan", tier: "rare" },
  { code: "ht", name: "Haiti", tier: "rare" },
  { code: "hr", name: "Hırvatistan", tier: "common" },
  { code: "in", name: "Hindistan", tier: "common" },
  { code: "nl", name: "Hollanda", tier: "common" },
  { code: "hn", name: "Honduras", tier: "rare" },
  { code: "iq", name: "Irak", tier: "common" },
  { code: "ir", name: "İran", tier: "common" },
  { code: "ie", name: "İrlanda", tier: "common" },
  { code: "es", name: "İspanya", tier: "common" },
  { code: "il", name: "İsrail", tier: "rare" },
  { code: "se", name: "İsveç", tier: "common" },
  { code: "ch", name: "İsviçre", tier: "common" },
  { code: "it", name: "İtalya", tier: "common" },
  { code: "is", name: "İzlanda", tier: "rare" },
  { code: "jm", name: "Jamaika", tier: "rare" },
  { code: "jp", name: "Japonya", tier: "common" },
  { code: "kh", name: "Kamboçya", tier: "rare" },
  { code: "cm", name: "Kamerun", tier: "rare" },
  { code: "ca", name: "Kanada", tier: "common" },
  { code: "me", name: "Karadağ", tier: "rare" },
  { code: "qa", name: "Katar", tier: "rare" },
  { code: "kz", name: "Kazakistan", tier: "common" },
  { code: "ke", name: "Kenya", tier: "common" },
  { code: "cy", name: "Kıbrıs", tier: "rare" },
  { code: "kg", name: "Kırgızistan", tier: "rare" },
  { code: "co", name: "Kolombiya", tier: "common" },
  { code: "km", name: "Komorlar", tier: "rare" },
  { code: "cg", name: "Kongo Cumhuriyeti", tier: "rare" },
  { code: "cr", name: "Kosta Rika", tier: "rare" },
  { code: "kw", name: "Kuveyt", tier: "rare" },
  { code: "kp", name: "Kuzey Kore", tier: "rare" },
  { code: "mk", name: "Kuzey Makedonya", tier: "rare" },
  { code: "cu", name: "Küba", tier: "common" },
  { code: "la", name: "Laos", tier: "rare" },
  { code: "ls", name: "Lesotho", tier: "rare" },
  { code: "lv", name: "Letonya", tier: "rare" },
  { code: "lr", name: "Liberya", tier: "rare" },
  { code: "ly", name: "Libya", tier: "rare" },
  { code: "lt", name: "Litvanya", tier: "rare" },
  { code: "lb", name: "Lübnan", tier: "rare" },
  { code: "lu", name: "Lüksemburg", tier: "rare" },
  { code: "hu", name: "Macaristan", tier: "common" },
  { code: "mg", name: "Madagaskar", tier: "rare" },
  { code: "mw", name: "Malavi", tier: "rare" },
  { code: "mv", name: "Maldivler", tier: "rare" },
  { code: "my", name: "Malezya", tier: "rare" },
  { code: "ml", name: "Mali", tier: "rare" },
  { code: "mt", name: "Malta", tier: "rare" },
  { code: "mu", name: "Mauritius", tier: "rare" },
  { code: "mx", name: "Meksika", tier: "common" },
  { code: "eg", name: "Mısır", tier: "common" },
  { code: "mn", name: "Moğolistan", tier: "rare" },
  { code: "md", name: "Moldova", tier: "rare" },
  { code: "mr", name: "Moritanya", tier: "rare" },
  { code: "mz", name: "Mozambik", tier: "rare" },
  { code: "mm", name: "Myanmar", tier: "rare" },
  { code: "na", name: "Namibya", tier: "rare" },
  { code: "np", name: "Nepal", tier: "rare" },
  { code: "ne", name: "Nijer", tier: "rare" },
  { code: "ng", name: "Nijerya", tier: "common" },
  { code: "ni", name: "Nikaragua", tier: "rare" },
  { code: "no", name: "Norveç", tier: "common" },
  { code: "cf", name: "Orta Afrika Cumhuriyeti", tier: "rare" },
  { code: "uz", name: "Özbekistan", tier: "rare" },
  { code: "pk", name: "Pakistan", tier: "common" },
  { code: "pa", name: "Panama", tier: "rare" },
  { code: "pg", name: "Papua Yeni Gine", tier: "rare" },
  { code: "py", name: "Paraguay", tier: "rare" },
  { code: "pe", name: "Peru", tier: "common" },
  { code: "pl", name: "Polonya", tier: "common" },
  { code: "pt", name: "Portekiz", tier: "common" },
  { code: "pr", name: "Porto Riko", tier: "rare" },
  { code: "ro", name: "Romanya", tier: "common" },
  { code: "rw", name: "Ruanda", tier: "rare" },
  { code: "ru", name: "Rusya", tier: "common" },
  { code: "lc", name: "Saint Lucia", tier: "rare" },
  { code: "vc", name: "Saint Vincent ve Grenadinler", tier: "rare" },
  { code: "st", name: "Sao Tome ve Principe", tier: "rare" },
  { code: "sn", name: "Senegal", tier: "rare" },
  { code: "sc", name: "Seyşeller", tier: "rare" },
  { code: "rs", name: "Sırbistan", tier: "rare" },
  { code: "sl", name: "Sierra Leone", tier: "rare" },
  { code: "sg", name: "Singapur", tier: "rare" },
  { code: "sk", name: "Slovakya", tier: "rare" },
  { code: "si", name: "Slovenya", tier: "rare" },
  { code: "sb", name: "Solomon Adaları", tier: "rare" },
  { code: "so", name: "Somali", tier: "rare" },
  { code: "lk", name: "Sri Lanka", tier: "rare" },
  { code: "sd", name: "Sudan", tier: "rare" },
  { code: "sr", name: "Surinam", tier: "rare" },
  { code: "sy", name: "Suriye", tier: "rare" },
  { code: "sa", name: "Suudi Arabistan", tier: "common" },
  { code: "cl", name: "Şili", tier: "common" },
  { code: "tj", name: "Tacikistan", tier: "rare" },
  { code: "tz", name: "Tanzanya", tier: "rare" },
  { code: "th", name: "Tayland", tier: "common" },
  { code: "tw", name: "Tayvan", tier: "rare" },
  { code: "tg", name: "Togo", tier: "rare" },
  { code: "tt", name: "Trinidad ve Tobago", tier: "rare" },
  { code: "tn", name: "Tunus", tier: "rare" },
  { code: "tr", name: "Türkiye", tier: "common" },
  { code: "tm", name: "Türkmenistan", tier: "rare" },
  { code: "ug", name: "Uganda", tier: "rare" },
  { code: "ua", name: "Ukrayna", tier: "common" },
  { code: "om", name: "Umman", tier: "rare" },
  { code: "uy", name: "Uruguay", tier: "common" },
  { code: "jo", name: "Ürdün", tier: "rare" },
  { code: "vu", name: "Vanuatu", tier: "rare" },
  { code: "ve", name: "Venezuela", tier: "common" },
  { code: "vn", name: "Vietnam", tier: "common" },
  { code: "ye", name: "Yemen", tier: "rare" },
  { code: "nc", name: "Yeni Kaledonya", tier: "rare" },
  { code: "nz", name: "Yeni Zelanda", tier: "common" },
  { code: "gr", name: "Yunanistan", tier: "common" },
  { code: "zm", name: "Zambiya", tier: "rare" },
  { code: "zw", name: "Zimbabve", tier: "rare" },
];

export const commonCountries = countries.filter((country) => country.tier === "common");

export function countryCount(difficulty: WorldDifficulty): number {
  return difficulty === "hard" ? countries.length : commonCountries.length;
}

export type Continent = "europe" | "asia" | "africa" | "america";

/**
 * Kıta başına ülke kodları. İki kıtaya yayılan ülkeler (Türkiye, Rusya, Kazakistan, Kafkasya, Kıbrıs)
 * hem Avrupa'da hem Asya'da sorulur. Amerika tek kıta olarak sorulur; Orta Amerika ve Karayipler dahildir.
 * Okyanusya'nın haritada yalnızca 6 ülkesi olduğu için kıta seçeneği yoktur; bu ülkeler yalnızca dünya
 * turlarında sorulur.
 */
const CONTINENT_MEMBERS: Record<Continent, string> = {
  europe:
    "al at by be ba bg hr cz dk ee fi fr de gr hu is ie it lv lt lu mt md me nl mk no pl pt ro rs sk si es se ch ua gb " +
    "tr ru kz az ge am cy",
  asia:
    "af bd bt bn kh cn in id ir iq il jp jo kw kg la lb my mv mn mm np kp om pk ph qa sa sg kr lk sy tw tj th tm ae uz vn ye " +
    "tr ru kz az ge am cy",
  africa:
    "dz ao bj bw bf bi cv cm cf td km cg cd dj eg gq er sz et ga gm gh gn gw ci ke ls lr ly mg mw ml mr mu ma mz na ne ng " +
    "rw st sn sc sl so za ss sd tz tg tn ug zm zw",
  america: "us ca mx gl bs bz cr cu dm do sv gt ht hn jm ni pa pr lc vc tt ar bo br cl co ec fk gy py pe sr uy ve",
};

export type MapBox = { x: number; y: number; width: number; height: number };

/**
 * Giriş ekranında bu sırayla (alfabetik) listelenir.
 * Kıta antrenmanında haritanın açılış görünümü, public/maps/world.svg koordinatlarıyla.
 * Ülke kutularından türetilmedi: Fransa, Portekiz ve Norveç gibi ülkelerin şekilleri
 * denizaşırı topraklarını da içerdiği için kutu kıtanın çok dışına taşıyor.
 */
export const CONTINENTS: { id: Continent; label: string; view: MapBox }[] = [
  { id: "africa", label: "Afrika", view: { x: 345, y: 430, width: 205, height: 195 } },
  { id: "america", label: "Amerika", view: { x: 30, y: 250, width: 365, height: 445 } },
  { id: "asia", label: "Asya", view: { x: 460, y: 300, width: 330, height: 265 } },
  { id: "europe", label: "Avrupa", view: { x: 355, y: 322, width: 165, height: 123 } },
];

const continentCodes = {} as Record<Continent, ReadonlySet<string>>;
for (const [continent, codes] of Object.entries(CONTINENT_MEMBERS) as [Continent, string][]) {
  continentCodes[continent] = new Set(codes.split(" "));
}

export function continentLocationIds(continent: Continent): ReadonlySet<string> {
  return continentCodes[continent];
}

export function countriesIn(continent: Continent): Country[] {
  return countries.filter((country) => continentCodes[continent].has(country.code));
}

export function continentInfo(continent: Continent) {
  return CONTINENTS.find((option) => option.id === continent)!;
}

/** Giriş ekranında Dünya turunun kapsamı: bir havuz ya da tek bir kıta. */
export type WorldScope = WorldDifficulty | Continent;

export function isContinentScope(scope: WorldScope): scope is Continent {
  return scope !== "normal" && scope !== "hard";
}

const allCountryCodes: ReadonlySet<string> = new Set(countries.map((country) => country.code));
const commonCountryCodes: ReadonlySet<string> = new Set(commonCountries.map((country) => country.code));

/** Kapsama giren ülkeler; giriş ekranındaki önizleme haritasında bunlar vurgulanır. */
export function scopeLocationIds(scope: WorldScope): ReadonlySet<string> {
  if (isContinentScope(scope)) return continentCodes[scope];
  return scope === "hard" ? allCountryCodes : commonCountryCodes;
}

export function scopeCountryCount(scope: WorldScope): number {
  return scopeLocationIds(scope).size;
}
