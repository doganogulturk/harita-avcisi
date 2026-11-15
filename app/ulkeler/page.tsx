import type { Metadata } from "next";
import { CountryScreen } from "../components/countries/CountryScreen";

export const metadata: Metadata = {
  title: "Ülkeler · Harita Avcısı",
  description: "Bütün dünyayı ya da bir kıtayı seç, ülkeleri haritadaki yerine yerleştir.",
};

export default function CountriesPage() {
  return <CountryScreen />;
}
