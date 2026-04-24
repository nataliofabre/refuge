export const APP_NAME = "Refuge";
export const APP_TAGLINE = "Ton compagnon pour avancer, à ton rythme.";

export const GOAL_TYPES = [
  { value: "risk_reduction", label: "Réduire les risques" },
  { value: "total_stop", label: "Arrêt complet" },
  { value: "financial", label: "Objectif financier" },
  { value: "sleep", label: "Mieux dormir / retrouver un rythme" },
  { value: "other", label: "Autre" },
] as const;

export const CONSUMPTION_CATEGORIES = [
  { value: "alcohol", label: "Alcool", emoji: "🍷", unit: "verres" },
  { value: "tobacco", label: "Tabac / Nicotine", emoji: "🚬", unit: "cigarettes" },
  { value: "cannabis", label: "Cannabis", emoji: "🌿", unit: "joints" },
  { value: "other_substance", label: "Autre substance", emoji: "✨", unit: "épisodes" },
  { value: "behavior", label: "Comportement", emoji: "🎯", unit: "épisodes" },
] as const;

export const ALCOHOL_SUBCATEGORIES = [
  { value: "beer", label: "Bière", standardDrinks: 1 },
  { value: "wine", label: "Verre de vin", standardDrinks: 1 },
  { value: "spirits", label: "Alcool fort", standardDrinks: 1 },
  { value: "cocktail", label: "Cocktail", standardDrinks: 2 },
];

export const EMOTION_STATES = [
  { value: "stress", label: "Stress" },
  { value: "boredom", label: "Ennui" },
  { value: "joy", label: "Joie / fête" },
  { value: "sadness", label: "Tristesse" },
  { value: "anger", label: "Colère" },
  { value: "anxiety", label: "Anxiété" },
  { value: "social_pressure", label: "Pression sociale" },
  { value: "habit", label: "Habitude" },
  { value: "other", label: "Autre" },
] as const;

export const RISK_MOMENTS = [
  "Soir en semaine",
  "Weekend",
  "Fin de journée",
  "Stress au travail",
  "Soirée entre amis",
  "Seul·e à la maison",
  "Après un conflit",
  "Quand je m'ennuie",
];

export const EMERGENCY_CONTACTS = [
  { name: "3114 — Prévention du suicide", tel: "3114" },
  { name: "Alcool Info Service", tel: "0980980930" },
  { name: "Drogues Info Service", tel: "0800231313" },
  { name: "Tabac Info Service", tel: "3989" },
  { name: "SOS Amitié", tel: "0972394050" },
];
