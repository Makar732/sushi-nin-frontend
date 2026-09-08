export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: "pizza", name: "Пицца", slug: "pizza", icon: "🍕", description: "Итальянская и американская сочная пицца на пышном и тонком тесте" },
  { id: "salads", name: "Салаты", slug: "salads", icon: "🥗", description: "Свежие авторские салаты с морепродуктами и мясом" },
  { id: "hot-rolls", name: "Горячие роллы", slug: "hot-rolls", icon: "🔥", description: "Хрустящие темпура и запеченные горячие роллы" },
  { id: "snacks", name: "Закуски", slug: "snacks", icon: "🍟", description: "Сырные палочки, крылышки, гренки и пивные сеты" },
  { id: "maki", name: "Маки", slug: "maki", icon: "🍱", description: "Классические маки роллы в нори" },
  { id: "rolls", name: "Роллы", slug: "rolls", icon: "🥢", description: "Фирменные премиальные роллы с лососем, тунцом и креветкой" },
  { id: "pasta", name: "Паста", slug: "pasta", icon: "🍝", description: "Сливочные итальянские пасты с пармезаном" },
  { id: "soups", name: "Супы", slug: "soups", icon: "🍜", description: "Азиатский Том Ям, крем-супы и солянка" },
  { id: "sets", name: "Сеты", slug: "sets", icon: "🎁", description: "Выгодные большие наборы роллов для компании" },
  { id: "burgers", name: "Бургеры", slug: "burgers", icon: "🍔", description: "Сочные бургеры на мягких булочках с мраморной котлетой" },
  { id: "european", name: "Европейская кухня", slug: "european", icon: "🥩", description: "Стейки, медальоны, нарезки и изысканные горячие блюда" },
];

export const FILTER_CHIPS = [
  { id: "all", label: "Все блюда", icon: "✨" },
  { id: "hit", label: "Хиты 💥", icon: "💥" },
  { id: "spicy", label: "Острые 🌶️", icon: "🌶️" },
  { id: "baked", label: "Запечённые 🧀", icon: "🧀" },
  { id: "nomeat", label: "Без мяса 🥑", icon: "🥑" },
];
