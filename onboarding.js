/**
 * Meal Plan — Onboarding Questionnaire (module)
 * Spec: Drive Onboarding Questionnaire + Meal Templates (updated planning procedure).
 * User opens questionnaire.html (self-contained). This mirrors the same logic.
 * NO global recipe scaling — builds from protein → carbs → fats per Meal Templates.
 */
(function (global) {
  "use strict";

  const ACTIVITY_FACTOR = {
    sedentary: 12,
    light: 13.5,
    moderate: 15,
    active: 17,
    very_active: 19,
  };

  const MACRO_PRESETS = {
    cutting: { p: 33, c: 42, f: 25, label: "33 p | 42 c | 25 f (recommended for weight loss)" },
    maintenance: { p: 28, c: 42, f: 30, label: "28 p | 42 c | 30 f (recommended for weight maintenance)" },
    bulking: { p: 25, c: 45, f: 30, label: "25 p | 45 c | 30 f (recommended for weight gain)" },
  };

  const MEAL_OPTIONS = {
    "2m1s": { meals: 2, snacks: 1, label: "2 meals, 1 snack" },
    "3m": { meals: 3, snacks: 0, label: "3 meals" },
    "3m2s": { meals: 3, snacks: 2, label: "3 meals, 2 snacks" },
    "4m": { meals: 4, snacks: 0, label: "4 meals" },
    "5m": { meals: 5, snacks: 0, label: "5 meals" },
  };

  /* Per-unit food database — approximate USDA-style macros + micros */
  /* Micro keys: fiber_g, sodium_mg, potassium_mg, calcium_mg, iron_mg,
     vitA_mcg, vitC_mg, vitD_mcg, vitB12_mcg, magnesium_mg, zinc_mg */
  const MICRO_KEYS = [
    "fiber_g",
    "sodium_mg",
    "potassium_mg",
    "calcium_mg",
    "iron_mg",
    "vitA_mcg",
    "vitC_mg",
    "vitD_mcg",
    "vitB12_mcg",
    "magnesium_mg",
    "zinc_mg",
  ];

  /** Adult RDA/DRI / Daily Value style targets (mixed adult) */
  const MICRO_TARGETS = {
    fiber_g: { label: "Fiber", target: 28, unit: "g" },
    sodium_mg: { label: "Sodium", target: 2300, unit: "mg" },
    potassium_mg: { label: "Potassium", target: 3400, unit: "mg" },
    calcium_mg: { label: "Calcium", target: 1000, unit: "mg" },
    iron_mg: { label: "Iron", target: 18, unit: "mg" },
    vitA_mcg: { label: "Vitamin A (RAE)", target: 900, unit: "mcg" },
    vitC_mg: { label: "Vitamin C", target: 90, unit: "mg" },
    vitD_mcg: { label: "Vitamin D", target: 20, unit: "mcg" },
    vitB12_mcg: { label: "Vitamin B12", target: 2.4, unit: "mcg" },
    magnesium_mg: { label: "Magnesium", target: 400, unit: "mg" },
    zinc_mg: { label: "Zinc", target: 11, unit: "mg" },
  };

  function M(o) {
    const out = {};
    MICRO_KEYS.forEach((k) => {
      out[k] = o[k] || 0;
    });
    return out;
  }

  const FOOD = {
    almond_milk_oz: { name: "unsweetened almond milk", unit: "oz", kcal: 5, p: 0.2, c: 0.2, f: 0.4, m: M({ calcium_mg: 56, vitA_mcg: 19, vitD_mcg: 0.3, vitE: 0, potassium_mg: 20, sodium_mg: 19 }) },
    milk_skim_oz: { name: "skim milk", unit: "oz", kcal: 10.6, p: 1.05, c: 1.5, f: 0.05, m: M({ calcium_mg: 38, potassium_mg: 49, sodium_mg: 13, vitA_mcg: 19, vitD_mcg: 0.4, vitB12_mcg: 0.16, magnesium_mg: 3.5, zinc_mg: 0.13, iron_mg: 0.01 }) },
    milk_2pct_oz: { name: "2% milk", unit: "oz", kcal: 15, p: 1, c: 1.5, f: 0.625, m: M({ calcium_mg: 37, potassium_mg: 44, sodium_mg: 14, vitA_mcg: 17, vitD_mcg: 0.4, vitB12_mcg: 0.14, magnesium_mg: 3.4, zinc_mg: 0.12 }) },
    protein_scoop: { name: "protein powder", unit: "scoop", kcal: 120, p: 24, c: 3, f: 1, m: M({ calcium_mg: 120, sodium_mg: 150, potassium_mg: 160, iron_mg: 0.5, magnesium_mg: 20, zinc_mg: 1.5, vitB12_mcg: 0.5 }) },
    banana: { name: "banana", unit: "medium", kcal: 105, p: 1.3, c: 27, f: 0.4, m: M({ fiber_g: 3.1, potassium_mg: 422, magnesium_mg: 32, vitC_mg: 10.3, vitA_mcg: 3, calcium_mg: 6, iron_mg: 0.3, zinc_mg: 0.2 }) },
    berries_cup: { name: "mixed berries", unit: "cup", kcal: 70, p: 1, c: 17, f: 0.5, m: M({ fiber_g: 6, vitC_mg: 30, vitA_mcg: 8, potassium_mg: 180, calcium_mg: 25, iron_mg: 0.6, magnesium_mg: 15 }) },
    blueberries_cup: { name: "blueberries", unit: "cup", kcal: 84, p: 1.1, c: 21, f: 0.5, m: M({ fiber_g: 3.6, vitC_mg: 14, potassium_mg: 114, vitaminK: 0, calcium_mg: 9, iron_mg: 0.4, magnesium_mg: 9 }) },
    strawberries_cup: { name: "strawberries", unit: "cup", kcal: 50, p: 1, c: 12, f: 0.5, m: M({ fiber_g: 3, vitC_mg: 89, potassium_mg: 220, calcium_mg: 24, iron_mg: 0.6, magnesium_mg: 18, vitA_mcg: 1 }) },
    cherries_cup: { name: "frozen cherries", unit: "cup", kcal: 90, p: 1.5, c: 22, f: 0.3, m: M({ fiber_g: 2.5, vitC_mg: 10, potassium_mg: 268, calcium_mg: 18, iron_mg: 0.5, magnesium_mg: 14, vitA_mcg: 19 }) },
    mango_cup: { name: "mango", unit: "cup", kcal: 100, p: 1.4, c: 25, f: 0.6, m: M({ fiber_g: 2.6, vitC_mg: 60, vitA_mcg: 89, potassium_mg: 277, calcium_mg: 18, magnesium_mg: 17, iron_mg: 0.3 }) },
    spinach_cup: { name: "spinach", unit: "cup", kcal: 7, p: 0.9, c: 1.1, f: 0.1, m: M({ fiber_g: 0.7, vitA_mcg: 281, vitC_mg: 8, calcium_mg: 30, iron_mg: 0.8, magnesium_mg: 24, potassium_mg: 167, zinc_mg: 0.2 }) },
    oats_cup: { name: "dry oats", unit: "cup", kcal: 300, p: 10, c: 54, f: 6, m: M({ fiber_g: 8, iron_mg: 3.6, magnesium_mg: 110, zinc_mg: 2.9, potassium_mg: 293, calcium_mg: 42, sodium_mg: 2 }) },
    chia_tbsp: { name: "chia seeds", unit: "tbsp", kcal: 58, p: 2, c: 5, f: 3.5, m: M({ fiber_g: 4.1, calcium_mg: 76, magnesium_mg: 40, iron_mg: 0.9, zinc_mg: 0.5, potassium_mg: 50 }) },
    hemp_tbsp: { name: "hemp hearts", unit: "tbsp", kcal: 55, p: 3.2, c: 0.8, f: 4.5, m: M({ fiber_g: 0.4, magnesium_mg: 70, iron_mg: 1.2, zinc_mg: 1.5, calcium_mg: 14, potassium_mg: 120 }) },
    walnuts_tbsp: { name: "walnuts", unit: "tbsp", kcal: 48, p: 1.1, c: 1, f: 4.8, m: M({ fiber_g: 0.5, magnesium_mg: 12, zinc_mg: 0.2, iron_mg: 0.2, potassium_mg: 32, calcium_mg: 7 }) },
    pb_tbsp: { name: "peanut butter", unit: "tbsp", kcal: 94, p: 4, c: 3.2, f: 8, m: M({ fiber_g: 1, magnesium_mg: 25, zinc_mg: 0.5, iron_mg: 0.3, potassium_mg: 100, sodium_mg: 70, calcium_mg: 7 }) },
    chia_tsp: { name: "chia seeds", unit: "tsp", kcal: 19.3, p: 0.67, c: 1.67, f: 1.17, m: M({ fiber_g: 1.37, calcium_mg: 25, magnesium_mg: 13, iron_mg: 0.3, zinc_mg: 0.17, potassium_mg: 17 }) },
    hemp_tsp: { name: "hemp hearts", unit: "tsp", kcal: 18.3, p: 1.07, c: 0.27, f: 1.5, m: M({ fiber_g: 0.13, magnesium_mg: 23, iron_mg: 0.4, zinc_mg: 0.5, calcium_mg: 5, potassium_mg: 40 }) },
    walnuts_tsp: { name: "walnuts", unit: "tsp", kcal: 16, p: 0.37, c: 0.33, f: 1.6, m: M({ fiber_g: 0.17, magnesium_mg: 4, zinc_mg: 0.07, iron_mg: 0.07, potassium_mg: 11, calcium_mg: 2 }) },
    pb_tsp: { name: "peanut butter", unit: "tsp", kcal: 31.3, p: 1.33, c: 1.07, f: 2.67, m: M({ fiber_g: 0.33, magnesium_mg: 8, zinc_mg: 0.17, iron_mg: 0.1, potassium_mg: 33, sodium_mg: 23, calcium_mg: 2 }) },
    pumpkin_cup: { name: "pumpkin puree", unit: "cup", kcal: 80, p: 2.7, c: 19, f: 0.7, m: M({ fiber_g: 7, vitA_mcg: 1900, vitC_mg: 10, potassium_mg: 505, calcium_mg: 64, iron_mg: 3.4, magnesium_mg: 56 }) },
    raisins_cup: { name: "raisins", unit: "cup", kcal: 430, p: 4.5, c: 114, f: 0.7, m: M({ fiber_g: 5.4, potassium_mg: 1086, iron_mg: 2.7, magnesium_mg: 46, calcium_mg: 73, sodium_mg: 16, zinc_mg: 0.3 }) },
    maple_tsp: { name: "maple syrup", unit: "tsp", kcal: 17, p: 0, c: 4.4, f: 0, m: M({ calcium_mg: 7, potassium_mg: 14, magnesium_mg: 1, zinc_mg: 0.05, iron_mg: 0.01 }) },
    honey_tsp: { name: "honey", unit: "tsp", kcal: 21, p: 0, c: 5.8, f: 0, m: M({ potassium_mg: 3.5, calcium_mg: 0.4 }) },
    cacao_tsp: { name: "cacao powder", unit: "tsp", kcal: 8, p: 0.5, c: 1.2, f: 0.4, m: M({ fiber_g: 0.7, iron_mg: 0.5, magnesium_mg: 10, zinc_mg: 0.15, potassium_mg: 30, calcium_mg: 5 }) },
    beef_oz: { name: "93% lean ground beef (cooked)", unit: "oz", kcal: 48, p: 7, c: 0, f: 2.2, m: M({ iron_mg: 0.7, zinc_mg: 1.5, vitB12_mcg: 0.7, potassium_mg: 90, sodium_mg: 20, magnesium_mg: 6, calcium_mg: 4, vitA_mcg: 1 }) },
    turkey_oz: { name: "lean ground turkey (cooked)", unit: "oz", kcal: 45, p: 7.2, c: 0, f: 1.8, m: M({ zinc_mg: 0.9, iron_mg: 0.4, vitB12_mcg: 0.4, potassium_mg: 80, sodium_mg: 25, magnesium_mg: 7, calcium_mg: 5 }) },
    chicken_oz: { name: "chicken breast (cooked)", unit: "oz", kcal: 46, p: 8.8, c: 0, f: 1, m: M({ zinc_mg: 0.3, iron_mg: 0.15, vitB12_mcg: 0.1, potassium_mg: 73, sodium_mg: 20, magnesium_mg: 8, calcium_mg: 4 }) },
    chicken_thigh_oz: { name: "chicken thigh (cooked)", unit: "oz", kcal: 55, p: 7.2, c: 0, f: 2.9, m: M({ zinc_mg: 0.5, iron_mg: 0.25, vitB12_mcg: 0.15, potassium_mg: 70, sodium_mg: 25, magnesium_mg: 7, calcium_mg: 4 }) },
    salmon_oz: { name: "salmon fillet (cooked)", unit: "oz", kcal: 59, p: 6.5, c: 0, f: 3.6, m: M({ vitD_mcg: 3.2, vitB12_mcg: 0.9, potassium_mg: 110, sodium_mg: 15, magnesium_mg: 8, zinc_mg: 0.2, iron_mg: 0.15, calcium_mg: 4, vitA_mcg: 10 }) },
    cod_oz: { name: "cod fillet (cooked)", unit: "oz", kcal: 30, p: 6.5, c: 0, f: 0.2, m: M({ vitB12_mcg: 0.3, vitD_mcg: 0.15, potassium_mg: 90, sodium_mg: 25, magnesium_mg: 8, zinc_mg: 0.15, calcium_mg: 5, iron_mg: 0.1 }) },
    shrimp_oz: { name: "shrimp (cooked)", unit: "oz", kcal: 28, p: 6.8, c: 0.2, f: 0.3, m: M({ sodium_mg: 110, potassium_mg: 50, magnesium_mg: 10, zinc_mg: 0.4, iron_mg: 0.2, vitB12_mcg: 0.4, calcium_mg: 15 }) },
    lettuce_cup: { name: "lettuce", unit: "cup", kcal: 8, p: 0.6, c: 1.5, f: 0.1, m: M({ fiber_g: 0.7, vitA_mcg: 100, vitC_mg: 3, potassium_mg: 80, calcium_mg: 15, iron_mg: 0.3, magnesium_mg: 5 }) },
    kale_cup: { name: "kale", unit: "cup", kcal: 33, p: 2.9, c: 6, f: 0.6, m: M({ fiber_g: 2.4, vitA_mcg: 500, vitC_mg: 80, calcium_mg: 150, potassium_mg: 300, iron_mg: 1, magnesium_mg: 30 }) },
    mixed_greens_cup: { name: "mixed greens", unit: "cup", kcal: 10, p: 0.8, c: 1.8, f: 0.2, m: M({ fiber_g: 1, vitA_mcg: 120, vitC_mg: 10, potassium_mg: 100, calcium_mg: 30, iron_mg: 0.5, magnesium_mg: 10 }) },
    cherry_tomato_cup: { name: "cherry tomatoes", unit: "cup", kcal: 27, p: 1.3, c: 5.8, f: 0.3, m: M({ fiber_g: 1.8, vitC_mg: 20, vitA_mcg: 80, potassium_mg: 350, calcium_mg: 15, magnesium_mg: 15, iron_mg: 0.4 }) },
    cucumber_cup: { name: "cucumber", unit: "cup", kcal: 16, p: 0.7, c: 3.8, f: 0.1, m: M({ fiber_g: 0.5, vitC_mg: 3, potassium_mg: 150, calcium_mg: 16, magnesium_mg: 12 }) },
    onion_cup: { name: "onion", unit: "cup", kcal: 64, p: 1.8, c: 15, f: 0.2, m: M({ fiber_g: 2.7, vitC_mg: 8, potassium_mg: 230, calcium_mg: 30, magnesium_mg: 15 }) },
    corn_cup: { name: "corn", unit: "cup", kcal: 130, p: 4.5, c: 30, f: 1.5, m: M({ fiber_g: 3.5, potassium_mg: 300, magnesium_mg: 40, iron_mg: 0.6, zinc_mg: 0.7, vitC_mg: 8 }) },
    black_beans_cup: { name: "black beans (cooked)", unit: "cup", kcal: 227, p: 15, c: 41, f: 0.9, m: M({ fiber_g: 15, iron_mg: 3.6, magnesium_mg: 120, potassium_mg: 610, calcium_mg: 46, zinc_mg: 1.9, sodium_mg: 2 }) },
    feta_oz: { name: "feta cheese", unit: "oz", kcal: 75, p: 4, c: 1.2, f: 6, m: M({ calcium_mg: 140, sodium_mg: 316, vitA_mcg: 35, vitB12_mcg: 0.5, zinc_mg: 0.8 }) },
    parmesan_oz: { name: "parmesan", unit: "oz", kcal: 110, p: 10, c: 1, f: 7, m: M({ calcium_mg: 330, sodium_mg: 430, vitA_mcg: 40, vitB12_mcg: 0.4, zinc_mg: 0.8 }) },
    rice_cup: { name: "cooked white rice", unit: "cup", kcal: 205, p: 4.3, c: 45, f: 0.4, m: M({ magnesium_mg: 19, zinc_mg: 0.8, iron_mg: 0.4, potassium_mg: 55, sodium_mg: 2, calcium_mg: 16, fiber_g: 0.6 }) },
    brown_rice_cup: { name: "cooked brown rice", unit: "cup", kcal: 215, p: 5, c: 45, f: 1.6, m: M({ fiber_g: 3.5, magnesium_mg: 84, zinc_mg: 1.2, iron_mg: 0.8, potassium_mg: 154, calcium_mg: 20 }) },
    potato_oz: { name: "potato", unit: "oz", kcal: 25, p: 0.6, c: 5.7, f: 0, m: M({ fiber_g: 0.6, potassium_mg: 120, vitC_mg: 5.5, magnesium_mg: 6, iron_mg: 0.1, calcium_mg: 3 }) },
    sweet_potato_oz: { name: "sweet potato", unit: "oz", kcal: 24, p: 0.4, c: 5.6, f: 0, m: M({ fiber_g: 0.8, vitA_mcg: 250, vitC_mg: 3.5, potassium_mg: 95, magnesium_mg: 5, calcium_mg: 8, iron_mg: 0.15 }) },
    broccoli_cup: { name: "broccoli", unit: "cup", kcal: 55, p: 3.7, c: 11, f: 0.6, m: M({ fiber_g: 5.1, vitC_mg: 81, vitA_mcg: 57, calcium_mg: 62, potassium_mg: 457, iron_mg: 1, magnesium_mg: 30, zinc_mg: 0.6 }) },
    peppers_cup: { name: "bell peppers", unit: "cup", kcal: 30, p: 1, c: 7, f: 0.2, m: M({ fiber_g: 2.5, vitC_mg: 152, vitA_mcg: 117, potassium_mg: 251, calcium_mg: 10, magnesium_mg: 14, iron_mg: 0.5 }) },
    cauliflower_cup: { name: "cauliflower", unit: "cup", kcal: 27, p: 2, c: 5, f: 0.3, m: M({ fiber_g: 2.1, vitC_mg: 51, potassium_mg: 320, calcium_mg: 24, magnesium_mg: 16, iron_mg: 0.4, zinc_mg: 0.3 }) },
    carrots_cup: { name: "carrots", unit: "cup", kcal: 50, p: 1.1, c: 12, f: 0.3, m: M({ fiber_g: 3.6, vitA_mcg: 1069, vitC_mg: 7.6, potassium_mg: 410, calcium_mg: 42, magnesium_mg: 15, iron_mg: 0.4 }) },
    mixed_veg_cup: { name: "mixed vegetables", unit: "cup", kcal: 60, p: 2.5, c: 12, f: 0.5, m: M({ fiber_g: 4, vitA_mcg: 400, vitC_mg: 15, potassium_mg: 280, calcium_mg: 35, iron_mg: 0.8, magnesium_mg: 25 }) },
    asparagus_cup: { name: "asparagus", unit: "cup", kcal: 40, p: 4.3, c: 7.4, f: 0.4, m: M({ fiber_g: 3.6, vitA_mcg: 90, vitC_mg: 10, folate: 0, potassium_mg: 270, calcium_mg: 32, iron_mg: 2, magnesium_mg: 18, zinc_mg: 0.7 }) },
    evoo_tsp: { name: "extra virgin olive oil", unit: "tsp", kcal: 40, p: 0, c: 0, f: 4.5, m: M({ vitA_mcg: 0 }) },
    almonds_oz: { name: "almonds", unit: "oz", kcal: 164, p: 6, c: 6.1, f: 14.2, m: M({ fiber_g: 3.5, magnesium_mg: 76, calcium_mg: 76, iron_mg: 1.1, zinc_mg: 0.9, potassium_mg: 208, vitE: 7.3 }) },
    peanuts_oz: { name: "peanuts", unit: "oz", kcal: 161, p: 7.3, c: 4.6, f: 14, m: M({ fiber_g: 2.4, magnesium_mg: 50, zinc_mg: 0.9, iron_mg: 0.6, potassium_mg: 200, calcium_mg: 26 }) },
    cashews_oz: { name: "cashews", unit: "oz", kcal: 157, p: 5.2, c: 8.6, f: 12.4, m: M({ fiber_g: 0.9, magnesium_mg: 83, zinc_mg: 1.6, iron_mg: 1.9, potassium_mg: 187, calcium_mg: 13 }) },
    pistachios_oz: { name: "pistachios", unit: "oz", kcal: 159, p: 5.7, c: 7.7, f: 12.9, m: M({ fiber_g: 3, magnesium_mg: 34, zinc_mg: 0.7, iron_mg: 1.1, potassium_mg: 291, calcium_mg: 30 }) },
    greek_nonfat_cup: { name: "0% Greek yogurt", unit: "cup", kcal: 130, p: 23, c: 9, f: 0.7, m: M({ calcium_mg: 250, potassium_mg: 240, sodium_mg: 65, vitB12_mcg: 0.8, magnesium_mg: 22, zinc_mg: 1.2, vitA_mcg: 5 }) },
    greek_2pct_cup: { name: "2% Greek yogurt", unit: "cup", kcal: 150, p: 20, c: 8, f: 4, m: M({ calcium_mg: 230, potassium_mg: 220, sodium_mg: 70, vitB12_mcg: 0.7, magnesium_mg: 20, zinc_mg: 1, vitA_mcg: 20 }) },
    cottage_lf_cup: { name: "low-fat cottage cheese", unit: "cup", kcal: 163, p: 28, c: 6.1, f: 2.3, m: M({ calcium_mg: 138, sodium_mg: 700, potassium_mg: 190, vitB12_mcg: 0.8, magnesium_mg: 12, zinc_mg: 0.7, vitA_mcg: 40 }) },
    pineapple_cup: { name: "pineapple", unit: "cup", kcal: 82, p: 0.9, c: 21.6, f: 0.2, m: M({ fiber_g: 2.3, vitC_mg: 79, manganese: 1.5, potassium_mg: 180, calcium_mg: 21, magnesium_mg: 20, iron_mg: 0.5 }) },
    peach_cup: { name: "sliced peach", unit: "cup", kcal: 60, p: 1.4, c: 14.7, f: 0.4, m: M({ fiber_g: 2.3, vitC_mg: 10, vitA_mcg: 26, potassium_mg: 285, calcium_mg: 9, magnesium_mg: 14, iron_mg: 0.4 }) },
    egg: { name: "large egg", unit: "egg", kcal: 72, p: 6.3, c: 0.4, f: 4.8, m: M({ sodium_mg: 71, vitA_mcg: 80, vitD_mcg: 1, vitB12_mcg: 0.5, iron_mg: 0.9, calcium_mg: 28, potassium_mg: 69, zinc_mg: 0.6, magnesium_mg: 6 }) },
    egg_white: { name: "egg white", unit: "white", kcal: 17, p: 3.6, c: 0.2, f: 0.1, m: M({ sodium_mg: 55, potassium_mg: 54, calcium_mg: 2, magnesium_mg: 4 }) },
    avocado_oz: { name: "avocado", unit: "oz", kcal: 45, p: 0.6, c: 2.4, f: 4.2, m: M({ fiber_g: 1.9, potassium_mg: 140, magnesium_mg: 8, vitC_mg: 2.8, vitA_mcg: 2, calcium_mg: 3, iron_mg: 0.15 }) },
    hard_boiled_egg: { name: "hard boiled egg", unit: "egg", kcal: 78, p: 6.3, c: 0.6, f: 5.3, m: M({ sodium_mg: 62, vitA_mcg: 74, vitD_mcg: 1.1, vitB12_mcg: 0.55, iron_mg: 0.6, calcium_mg: 25, potassium_mg: 63, zinc_mg: 0.5 }) },
  };

  /** Approximate edible grams per FOOD unit (for display). */
  const UNIT_GRAMS = {
    almond_milk_oz: 30, milk_skim_oz: 30, milk_2pct_oz: 30,
    protein_scoop: 30, banana: 118, berries_cup: 140, blueberries_cup: 148,
    strawberries_cup: 152, cherries_cup: 140, mango_cup: 165, spinach_cup: 30,
    oats_cup: 80, chia_tbsp: 10, hemp_tbsp: 10, walnuts_tbsp: 7.5, pb_tbsp: 16,
    chia_tsp: 3.3, hemp_tsp: 3.3, walnuts_tsp: 2.5, pb_tsp: 5.3,
    pumpkin_cup: 245, raisins_cup: 145, maple_tsp: 7, honey_tsp: 7, cacao_tsp: 2.5,
    beef_oz: 28, turkey_oz: 28, chicken_oz: 28, chicken_thigh_oz: 28, salmon_oz: 28, cod_oz: 28, shrimp_oz: 28,
    lettuce_cup: 36, kale_cup: 67, mixed_greens_cup: 40, cherry_tomato_cup: 149, cucumber_cup: 104,
    onion_cup: 160, corn_cup: 164, black_beans_cup: 172, feta_oz: 28, parmesan_oz: 28,
    rice_cup: 158, brown_rice_cup: 195, potato_oz: 28, sweet_potato_oz: 28,
    broccoli_cup: 91, peppers_cup: 149, cauliflower_cup: 100, carrots_cup: 128,
    mixed_veg_cup: 140, asparagus_cup: 134, evoo_tsp: 4.5,
    almonds_oz: 28, peanuts_oz: 28, cashews_oz: 28, pistachios_oz: 28,
    greek_nonfat_cup: 245, greek_2pct_cup: 245, cottage_lf_cup: 226,
    pineapple_cup: 165, peach_cup: 154,
    egg: 50, egg_white: 33, avocado_oz: 28, hard_boiled_egg: 50,
  };

  const DAYS_OF_WEEK = [
    { id: "mon", label: "Monday", short: "Mon" },
    { id: "tue", label: "Tuesday", short: "Tue" },
    { id: "wed", label: "Wednesday", short: "Wed" },
    { id: "thu", label: "Thursday", short: "Thu" },
    { id: "fri", label: "Friday", short: "Fri" },
    { id: "sat", label: "Saturday", short: "Sat" },
    { id: "sun", label: "Sunday", short: "Sun" },
  ];

  function budgetTier(monthlyBudget) {
    const b = Number(monthlyBudget) || 0;
    if (b < 200) return { id: "low", label: "Low", requireOrganic: false, reduceVariety: true, preferCheapProduce: true };
    if (b <= 400) return { id: "mid", label: "Mid", requireOrganic: false, reduceVariety: false, preferCheapProduce: false };
    return { id: "high", label: "High", requireOrganic: false, reduceVariety: false, preferCheapProduce: false };
  }

  /**
   * Walmart-style estimated grocery price catalog (typical US prices).
   * Structure supports swapping lookupPrice() for a live Walmart API later.
   * Prices are per listed package; unitPrice converts to per FOOD unit.
   */
  const PRICE_CATALOG = {
    almond_milk_oz: { product: "Unsweetened almond milk", packageQty: 64, packageUnit: "oz", packagePrice: 2.48 },
    milk_skim_oz: { product: "Skim milk", packageQty: 64, packageUnit: "oz", packagePrice: 3.28 },
    milk_2pct_oz: { product: "2% milk", packageQty: 64, packageUnit: "oz", packagePrice: 3.28 },
    protein_scoop: { product: "Whey protein powder", packageQty: 30, packageUnit: "scoop", packagePrice: 29.98 },
    banana: { product: "Bananas", packageQty: 1, packageUnit: "medium", packagePrice: 0.28 },
    berries_cup: { product: "Mixed berries (frozen)", packageQty: 4, packageUnit: "cup", packagePrice: 7.98 },
    blueberries_cup: { product: "Blueberries (frozen)", packageQty: 4, packageUnit: "cup", packagePrice: 6.98 },
    strawberries_cup: { product: "Strawberries (frozen)", packageQty: 4, packageUnit: "cup", packagePrice: 5.98 },
    cherries_cup: { product: "Frozen cherries", packageQty: 3, packageUnit: "cup", packagePrice: 6.48 },
    mango_cup: { product: "Mango chunks (frozen)", packageQty: 3, packageUnit: "cup", packagePrice: 4.98 },
    spinach_cup: { product: "Fresh spinach", packageQty: 8, packageUnit: "cup", packagePrice: 2.48 },
    oats_cup: { product: "Old-fashioned oats", packageQty: 10, packageUnit: "cup", packagePrice: 3.48 },
    chia_tbsp: { product: "Chia seeds", packageQty: 32, packageUnit: "tbsp", packagePrice: 5.98 },
    hemp_tbsp: { product: "Hemp hearts", packageQty: 24, packageUnit: "tbsp", packagePrice: 7.98 },
    walnuts_tbsp: { product: "Chopped walnuts", packageQty: 24, packageUnit: "tbsp", packagePrice: 5.48 },
    pb_tbsp: { product: "Peanut butter", packageQty: 32, packageUnit: "tbsp", packagePrice: 3.48 },
    chia_tsp: { product: "Chia seeds", packageQty: 96, packageUnit: "tsp", packagePrice: 5.98 },
    hemp_tsp: { product: "Hemp hearts", packageQty: 72, packageUnit: "tsp", packagePrice: 7.98 },
    walnuts_tsp: { product: "Chopped walnuts", packageQty: 72, packageUnit: "tsp", packagePrice: 5.48 },
    pb_tsp: { product: "Peanut butter", packageQty: 96, packageUnit: "tsp", packagePrice: 3.48 },
    pumpkin_cup: { product: "Canned pumpkin puree", packageQty: 1.75, packageUnit: "cup", packagePrice: 1.48 },
    raisins_cup: { product: "Raisins", packageQty: 2.5, packageUnit: "cup", packagePrice: 3.28 },
    maple_tsp: { product: "Maple syrup", packageQty: 48, packageUnit: "tsp", packagePrice: 4.98 },
    honey_tsp: { product: "Honey", packageQty: 48, packageUnit: "tsp", packagePrice: 4.48 },
    cacao_tsp: { product: "Cacao powder", packageQty: 48, packageUnit: "tsp", packagePrice: 5.98 },
    beef_oz: { product: "93% lean ground beef", packageQty: 16, packageUnit: "oz", packagePrice: 6.98 },
    turkey_oz: { product: "Lean ground turkey", packageQty: 16, packageUnit: "oz", packagePrice: 5.48 },
    chicken_oz: { product: "Chicken breast", packageQty: 16, packageUnit: "oz", packagePrice: 4.98 },
    chicken_thigh_oz: { product: "Chicken thighs", packageQty: 16, packageUnit: "oz", packagePrice: 3.98 },
    salmon_oz: { product: "Salmon fillet", packageQty: 12, packageUnit: "oz", packagePrice: 9.98 },
    cod_oz: { product: "Cod fillet", packageQty: 12, packageUnit: "oz", packagePrice: 7.98 },
    rice_cup: { product: "White rice (dry → cooked)", packageQty: 12, packageUnit: "cup", packagePrice: 2.48 },
    brown_rice_cup: { product: "Brown rice", packageQty: 10, packageUnit: "cup", packagePrice: 2.98 },
    potato_oz: { product: "Russet potatoes", packageQty: 80, packageUnit: "oz", packagePrice: 3.98 },
    sweet_potato_oz: { product: "Sweet potatoes", packageQty: 48, packageUnit: "oz", packagePrice: 2.98 },
    broccoli_cup: { product: "Broccoli florets (frozen)", packageQty: 6, packageUnit: "cup", packagePrice: 1.98 },
    peppers_cup: { product: "Bell peppers", packageQty: 4, packageUnit: "cup", packagePrice: 2.98 },
    cauliflower_cup: { product: "Cauliflower (frozen)", packageQty: 6, packageUnit: "cup", packagePrice: 1.98 },
    carrots_cup: { product: "Baby carrots", packageQty: 6, packageUnit: "cup", packagePrice: 1.48 },
    mixed_veg_cup: { product: "Mixed vegetables (frozen)", packageQty: 6, packageUnit: "cup", packagePrice: 1.68 },
    asparagus_cup: { product: "Asparagus", packageQty: 3, packageUnit: "cup", packagePrice: 3.48 },
    evoo_tsp: { product: "Extra virgin olive oil", packageQty: 100, packageUnit: "tsp", packagePrice: 6.98 },
    almonds_oz: { product: "Raw almonds", packageQty: 16, packageUnit: "oz", packagePrice: 5.98 },
    peanuts_oz: { product: "Roasted peanuts", packageQty: 16, packageUnit: "oz", packagePrice: 3.48 },
    cashews_oz: { product: "Cashews", packageQty: 16, packageUnit: "oz", packagePrice: 6.98 },
    pistachios_oz: { product: "Pistachios", packageQty: 16, packageUnit: "oz", packagePrice: 6.48 },
    greek_nonfat_cup: { product: "0% Greek yogurt", packageQty: 4, packageUnit: "cup", packagePrice: 5.48 },
    greek_2pct_cup: { product: "2% Greek yogurt", packageQty: 4, packageUnit: "cup", packagePrice: 5.48 },
    cottage_lf_cup: { product: "Low-fat cottage cheese", packageQty: 2, packageUnit: "cup", packagePrice: 2.98 },
    pineapple_cup: { product: "Pineapple chunks", packageQty: 2.5, packageUnit: "cup", packagePrice: 2.48 },
    peach_cup: { product: "Sliced peaches", packageQty: 2.5, packageUnit: "cup", packagePrice: 2.28 },
    egg: { product: "Large eggs", packageQty: 12, packageUnit: "egg", packagePrice: 2.98 },
    egg_white: { product: "Egg whites (carton)", packageQty: 10, packageUnit: "white", packagePrice: 3.98 },
    avocado_oz: { product: "Avocados", packageQty: 6, packageUnit: "oz", packagePrice: 1.48 },
    hard_boiled_egg: { product: "Large eggs", packageQty: 12, packageUnit: "egg", packagePrice: 2.98 },
    shrimp_oz: { product: "Frozen shrimp", packageQty: 16, packageUnit: "oz", packagePrice: 8.98 },
    lettuce_cup: { product: "Romaine lettuce", packageQty: 10, packageUnit: "cup", packagePrice: 2.48 },
    kale_cup: { product: "Kale", packageQty: 6, packageUnit: "cup", packagePrice: 2.98 },
    mixed_greens_cup: { product: "Mixed greens", packageQty: 8, packageUnit: "cup", packagePrice: 3.48 },
    cherry_tomato_cup: { product: "Cherry tomatoes", packageQty: 3, packageUnit: "cup", packagePrice: 2.48 },
    cucumber_cup: { product: "Cucumber", packageQty: 4, packageUnit: "cup", packagePrice: 0.98 },
    onion_cup: { product: "Yellow onion", packageQty: 4, packageUnit: "cup", packagePrice: 1.28 },
    corn_cup: { product: "Frozen corn", packageQty: 5, packageUnit: "cup", packagePrice: 1.48 },
    black_beans_cup: { product: "Canned black beans", packageQty: 3.5, packageUnit: "cup", packagePrice: 0.92 },
    feta_oz: { product: "Feta cheese", packageQty: 6, packageUnit: "oz", packagePrice: 3.48 },
    parmesan_oz: { product: "Parmesan", packageQty: 5, packageUnit: "oz", packagePrice: 3.98 },
  };

  /** Unit price for one FOOD catalog unit. Swappable for a live Walmart API. */
  function lookupPrice(ingredientKey) {
    const entry = PRICE_CATALOG[ingredientKey];
    if (!entry) {
      return {
        product: FOOD[ingredientKey] ? FOOD[ingredientKey].name : ingredientKey,
        unitPrice: 0.25,
        packageQty: 1,
        packagePrice: 0.25,
        packageUnit: FOOD[ingredientKey] ? FOOD[ingredientKey].unit : "unit",
        estimated: true,
      };
    }
    return {
      product: entry.product,
      unitPrice: entry.packagePrice / entry.packageQty,
      packageQty: entry.packageQty,
      packagePrice: entry.packagePrice,
      packageUnit: entry.packageUnit,
      estimated: true,
    };
  }

  function round50(n) {
    return Math.round(n / 50) * 50;
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function estimateCalories(weightLbs, weightGoal, activity) {
    let base = weightLbs * ACTIVITY_FACTOR[activity];
    if (weightGoal === "lose") base -= 500;
    else if (weightGoal === "gain") base += 300;
    return Math.max(800, round50(base));
  }

  function gramsFromPct(calories, pct) {
    return {
      p: Math.round((calories * pct.p) / 100 / 4),
      c: Math.round((calories * pct.c) / 100 / 4),
      f: Math.round((calories * pct.f) / 100 / 9),
    };
  }

  function gramsExact(calories, pct) {
    return {
      p: (calories * pct.p) / 100 / 4,
      c: (calories * pct.c) / 100 / 4,
      f: (calories * pct.f) / 100 / 9,
    };
  }

  const CUP_FRACTIONS = [0, 1 / 8, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1];
  const CUP_GLYPH = { 0: "0", 0.125: "⅛", 0.25: "¼", 0.333: "⅓", 0.5: "½", 0.667: "⅔", 0.75: "¾", 1: "1" };

  function snapCupFraction(n) {
    if (!isFinite(n) || n <= 0) return 0.125;
    const whole = Math.floor(n);
    const frac = n - whole;
    let best = CUP_FRACTIONS[0];
    let bestDiff = Infinity;
    for (const f of CUP_FRACTIONS) {
      const d = Math.abs(frac - f);
      if (d < bestDiff) {
        bestDiff = d;
        best = f;
      }
    }
    // Prefer nearest; also compare rounding up whole+0
    if (best === 1) return whole + 1;
    return whole + best;
  }

  function formatCupQty(n) {
    const snapped = snapCupFraction(n);
    const whole = Math.floor(snapped + 1e-9);
    const frac = Math.round((snapped - whole) * 1000) / 1000;
    let fracStr = "";
    if (Math.abs(frac - 0.125) < 0.02) fracStr = "⅛";
    else if (Math.abs(frac - 0.25) < 0.02) fracStr = "¼";
    else if (Math.abs(frac - 0.333) < 0.02 || Math.abs(frac - 1 / 3) < 0.02) fracStr = "⅓";
    else if (Math.abs(frac - 0.5) < 0.02) fracStr = "½";
    else if (Math.abs(frac - 0.667) < 0.02 || Math.abs(frac - 2 / 3) < 0.02) fracStr = "⅔";
    else if (Math.abs(frac - 0.75) < 0.02) fracStr = "¾";
    else if (frac > 0.02) fracStr = String(Math.round(frac * 100) / 100);
    if (whole === 0) return fracStr || "⅛";
    if (!fracStr) return String(whole);
    return String(whole) + fracStr;
  }

  function formatQty(n) {
    if (Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n));
    const tenths = Math.round(n * 10) / 10;
    if (Math.abs(tenths - 0.5) < 0.05) return "½";
    if (Math.abs(tenths - 1.5) < 0.05) return "1½";
    if (Math.abs(tenths - 0.25) < 0.05) return "¼";
    if (Math.abs(tenths - 0.75) < 0.05) return "¾";
    if (Math.abs(tenths - 0.33) < 0.05 || Math.abs(tenths - 1 / 3) < 0.05) return "⅓";
    if (Math.abs(tenths - 0.67) < 0.05 || Math.abs(tenths - 2 / 3) < 0.05) return "⅔";
    if (Math.abs(tenths - 0.125) < 0.02) return "⅛";
    return String(tenths);
  }

  /** Condense tsp → tbsp when divisible by 3 (e.g. 6 tsp → 2 tbsp). */
  function condenseTsp(foodKey, qty) {
    const tbspMap = { chia_tsp: "chia_tbsp", hemp_tsp: "hemp_tbsp", walnuts_tsp: "walnuts_tbsp", pb_tsp: "pb_tbsp", evoo_tsp: null };
    if (!(foodKey in tbspMap) && foodKey !== "evoo_tsp" && foodKey !== "maple_tsp" && foodKey !== "honey_tsp" && foodKey !== "cacao_tsp") {
      return { key: foodKey, qty };
    }
    if (qty >= 3 && Math.abs(qty % 3) < 0.05) {
      const tbspQty = qty / 3;
      if (foodKey === "chia_tsp") return { key: "chia_tbsp", qty: tbspQty };
      if (foodKey === "hemp_tsp") return { key: "hemp_tbsp", qty: tbspQty };
      if (foodKey === "walnuts_tsp") return { key: "walnuts_tbsp", qty: tbspQty };
      if (foodKey === "pb_tsp") return { key: "pb_tbsp", qty: tbspQty };
      // evoo/maple/honey/cacao stay as tsp unless we invent tbsp entries — display as tbsp text
      if (foodKey === "evoo_tsp" || foodKey === "maple_tsp" || foodKey === "honey_tsp") {
        return { key: foodKey, qty, displayUnit: "tbsp", displayQty: tbspQty };
      }
    }
    return { key: foodKey, qty };
  }

  function gramsFor(foodKey, qty) {
    const g = UNIT_GRAMS[foodKey];
    if (!g) return null;
    return Math.round(g * qty);
  }

  function qtyLine(foodKey, qty, labelOverride) {
    let key = foodKey;
    let q = qty;
    let displayUnit = null;
    let displayQty = null;
    const condensed = condenseTsp(foodKey, qty);
    key = condensed.key;
    q = condensed.qty;
    if (condensed.displayUnit) {
      displayUnit = condensed.displayUnit;
      displayQty = condensed.displayQty;
      key = foodKey; // keep macros from original tsp key using original qty
      q = qty;
    }
    // Snap cup quantities to standard fractions and adjust macros via snapped qty
    const f0 = FOOD[key] || FOOD[foodKey];
    if (f0 && f0.unit === "cup") {
      q = snapCupFraction(q);
      key = foodKey;
    } else if (f0 && f0.unit === "scoop") {
      q = Math.max(0.5, Math.round(q * 2) / 2);
      key = foodKey;
    }
    // Prefer condensed food key for macros when tsp→tbsp mapped
    let macroKey = key;
    let macroQty = q;
    if (displayUnit) {
      // keep original tsp macros
      macroKey = foodKey;
      macroQty = qty;
    } else if (key !== foodKey) {
      macroKey = key;
      macroQty = q;
    }
    const f = FOOD[macroKey];
    const kcal = Math.round(f.kcal * macroQty);
    const p = round1(f.p * macroQty);
    const c = round1(f.c * macroQty);
    const fat = round1(f.f * macroQty);
    const grams = gramsFor(macroKey, macroQty);
    let label;
    if (displayUnit) {
      label = formatQty(displayQty) + " " + displayUnit + " " + FOOD[foodKey].name;
    } else if (f.unit === "cup") {
      label = formatCupQty(macroQty) + " cup " + f.name;
    } else if (f.unit === "scoop") {
      label = formatQty(macroQty) + " scoop" + (macroQty === 1 ? "" : "s") + " " + f.name;
    } else {
      label = formatQty(macroQty) + " " + f.unit + " " + f.name;
    }
    // Ignore labelOverride for unit wording so condensation/grams stay consistent;
    // keep flavor-specific prefixes only when override doesn't encode a different unit.
    if (labelOverride && !/\b(tsp|tbsp|cup|oz|scoop)/i.test(labelOverride)) {
      label = labelOverride;
    }
    if (grams != null && !/\(\d+g\)/.test(label)) {
      label = label + " (" + grams + "g)";
    }
    return { label, kcal, p, c, f: fat, _key: macroKey, _qty: macroQty, _grams: grams };
  }

  function noteLine(text) {
    return { label: text, kcal: 0, p: 0, c: 0, f: 0, _note: true };
  }

  function sumIngredients(ings) {
    return ings.reduce(
      (a, i) => ({
        kcal: a.kcal + (i.kcal || 0),
        p: a.p + (i.p || 0),
        c: a.c + (i.c || 0),
        f: a.f + (i.f || 0),
      }),
      { kcal: 0, p: 0, c: 0, f: 0 }
    );
  }

  function roundMacros(m) {
    return {
      kcal: Math.round(m.kcal),
      p: Math.round(m.p),
      c: Math.round(m.c),
      f: Math.round(m.f),
    };
  }

  /** Ideal: mealCal ≈ day/(meals + snacks/2), snackCal ≈ mealCal/2. Prefer even. */
  function buildSchedule(dailyCalories, meals, snacks) {
    let mealCal, snackCal;
    if (snacks > 0) {
      mealCal = Math.round(dailyCalories / (meals + snacks / 2));
      snackCal = Math.round(mealCal / 2);
      mealCal = Math.round((dailyCalories - snackCal * snacks) / meals);
    } else {
      mealCal = Math.round(dailyCalories / meals);
      snackCal = 0;
    }

    const slots = [];
    let mi = 0,
      si = 0;
    while (mi < meals || si < snacks) {
      if (mi < meals) {
        mi += 1;
        slots.push({ name: "Meal " + mi, kind: "meal", index: mi, calories: mealCal });
      }
      if (si < snacks) {
        si += 1;
        slots.push({ name: "Snack " + si, kind: "snack", index: si, calories: snackCal });
      }
    }
    const sum = slots.reduce((a, s) => a + s.calories, 0);
    if (slots.length && sum !== dailyCalories) {
      const diff = dailyCalories - sum;
      const mealSlots = slots.filter((s) => s.kind === "meal");
      if (mealSlots.length) {
        mealSlots[0].calories += diff;
      } else {
        slots[0].calories += diff;
      }
    }
    return slots;
  }

  /** Protein qty aiming 3–8g below targetP from the primary source alone. */
  function proteinQtyForTarget(perUnitP, targetP, minQ, maxQ, step) {
    // Land primary protein in [targetP-8, targetP-3]; prefer lower (other foods add P)
    const lo = (targetP - 8) / perUnitP;
    const hi = (targetP - 3) / perUnitP;
    let q = Math.round(lo / step) * step;
    if (q * perUnitP < targetP - 8) q += step;
    // If still above hi band, step down
    while (q > minQ && q * perUnitP > targetP - 3) q -= step;
    return clamp(Math.round(q / step) * step, minQ, maxQ);
  }

  function scoopLabel(scoops) {
    return formatQty(scoops) + " scoop" + (scoops === 1 ? "" : "s") + " protein powder";
  }


  /** Produce family tags — prefer unused families across the day (micronutrient diversity). */
  const PRODUCE_FAMILY = {
    broccoli_cup: "brassica_green",
    cauliflower_cup: "brassica_white",
    peppers_cup: "nightshade",
    carrots_cup: "orange_root",
    mixed_veg_cup: "mixed_veg",
    asparagus_cup: "asparagus",
    spinach_cup: "leafy",
    berries_cup: "berry",
    blueberries_cup: "berry",
    strawberries_cup: "berry",
    cherries_cup: "cherry",
    mango_cup: "orange_stone",
    peach_cup: "orange_stone",
    pineapple_cup: "tropical_tart",
    banana: "banana",
    raisins_cup: "dried_grape",
    pumpkin_cup: "squash",
  };

  const BOWL_VEG_KEYS = [
    "broccoli_cup",
    "carrots_cup",
    "cauliflower_cup",
    "peppers_cup",
    "asparagus_cup",
    "mixed_veg_cup",
  ];

  const SNACK_FRUIT_TO_KEY = {
    pineapple: "pineapple_cup",
    peach: "peach_cup",
    mango: "mango_cup",
    berries: "berries_cup",
  };

  const FLAVOR_PRODUCE = {
    berry_banana: ["berries_cup", "banana"],
    chocolate_cherry: ["cherries_cup", "banana"],
    pb_banana: ["banana"],
    pumpkin_spice: ["pumpkin_cup", "banana"],
    banana_bread: ["banana", "raisins_cup"],
  };

  function produceFamily(key) {
    return PRODUCE_FAMILY[key] || null;
  }

  function markProduce(usedSet, key) {
    const fam = produceFamily(key);
    if (fam) usedSet.add(fam);
  }

  function markProduceFromIngredients(usedSet, ings) {
    if (!ings) return;
    for (const ing of ings) {
      if (ing && ing._key) markProduce(usedSet, ing._key);
    }
  }

  /** Prefer keys whose produce families are not yet used today. */
  function pickDiverseKey(keys, usedSet, salt) {
    const list = keys.slice();
    const unused = list.filter((k) => {
      const f = produceFamily(k);
      return !f || !usedSet.has(f);
    });
    const pool = unused.length ? unused : list;
    return pool[((salt % pool.length) + pool.length) % pool.length];
  }

  function pickDiverseFruitName(fruitNames, usedSet, salt) {
    const keys = fruitNames.map((n) => SNACK_FRUIT_TO_KEY[n]).filter(Boolean);
    const key = pickDiverseKey(keys, usedSet, salt);
    return fruitNames.find((n) => SNACK_FRUIT_TO_KEY[n] === key) || fruitNames[0];
  }

  function flavorDiversityScore(flavor, usedSet) {
    const keys = FLAVOR_PRODUCE[flavor] || [];
    let score = 0;
    for (const k of keys) {
      const f = produceFamily(k);
      if (!f || f === "banana") continue;
      if (!usedSet.has(f)) score += 1;
      else score -= 1;
    }
    return score;
  }

  function pickDiverseFlavor(flavors, usedSet, salt) {
    const ranked = flavors.slice().sort((a, b) => flavorDiversityScore(b, usedSet) - flavorDiversityScore(a, usedSet));
    const best = flavorDiversityScore(ranked[0], usedSet);
    const top = ranked.filter((f) => flavorDiversityScore(f, usedSet) === best);
    return top[((salt % top.length) + top.length) % top.length];
  }


  /* ── Slot builders following Meal Templates procedure (procedure-based; no global scaling) ── */

  function buildSmoothieSlot(flavor, targetCal, targetGrams, milkKey) {
    const notes = [];
    const ings = [];
    const mk = milkKey || "almond_milk_oz";

    // 1. Protein: 0.5–2 scoops, ~3–8g below meal protein target
    const scoops = proteinQtyForTarget(FOOD.protein_scoop.p, targetGrams.p, 0.5, 2, 0.25);
    ings.push(qtyLine("protein_scoop", scoops, scoopLabel(scoops)));

    // 2. Carbs — fruit (always ½–1 banana); NO raisins in smoothies
    if (flavor === "berry_banana") {
      ings.push(qtyLine("banana", 1, "1 medium banana"));
      ings.push(qtyLine("berries_cup", 0.75, "¾ cup mixed berries"));
      notes.push("Optional flavor: cinnamon");
    } else if (flavor === "pb_banana") {
      ings.push(qtyLine("banana", 1, "1 medium banana"));
      notes.push("Optional flavor: cacao");
    } else if (flavor === "chocolate_cherry") {
      ings.push(qtyLine("banana", 0.5, "½ banana"));
      ings.push(qtyLine("cherries_cup", 1, "1 cup frozen cherries"));
      notes.push("Optional flavor: cacao + cinnamon");
    } else if (flavor === "pumpkin_spice") {
      ings.push(qtyLine("banana", 0.5, "½ banana"));
      ings.push(qtyLine("pumpkin_cup", 1 / 3, "⅓ cup pumpkin puree"));
      notes.push("Flavor: pumpkin spice");
    } else {
      // banana_bread
      ings.push(qtyLine("banana", 1, "1 medium banana"));
      notes.push("Flavor: cinnamon");
    }

    // Oats if fruit carbs short of meal carb target
    let used = sumIngredients(ings);
    if (used.c < targetGrams.c * 0.85) {
      const need = targetGrams.c - used.c;
      let oatCups = clamp(Math.round((need / FOOD.oats_cup.c) * 4) / 4, 0, 0.75);
      if (oatCups >= 0.25) {
        ings.push(qtyLine("oats_cup", oatCups, formatQty(oatCups) + " cup dry oats"));
      }
    }

    // 3. Milk 8oz
    ings.push(qtyLine(mk, 8, "8 oz " + FOOD[mk].name));

    // Fats: 1–6 tsp chia/hemp/walnuts/nut butter if permitted
    used = sumIngredients(ings);
    const fatLeft = targetGrams.f - used.f;
    if (flavor === "pb_banana" && fatLeft >= 1.5) {
      const tsp = clamp(Math.round(Math.min(fatLeft, FOOD.pb_tsp.f * 6) / FOOD.pb_tsp.f), 1, 6);
      ings.push(qtyLine("pb_tsp", tsp, formatQty(tsp) + " tsp peanut butter"));
    } else if (fatLeft >= 1) {
      const fatFood =
        flavor === "chocolate_cherry" || flavor === "pumpkin_spice" || flavor === "banana_bread"
          ? "walnuts_tsp"
          : "chia_tsp";
      const tsp = clamp(Math.round(Math.min(fatLeft, FOOD[fatFood].f * 6) / FOOD[fatFood].f), 1, 6);
      ings.push(qtyLine(fatFood, tsp, formatQty(tsp) + " tsp " + FOOD[fatFood].name));
    }

    // If still short on carbs after fats, nudge berries/oats
    used = sumIngredients(ings);
    if (used.c < targetGrams.c - 8) {
      const need = targetGrams.c - used.c;
      const extraBerries = clamp(Math.round((need / FOOD.berries_cup.c) * 4) / 4, 0.25, 1);
      if (flavor === "berry_banana" || flavor === "banana_bread") {
        ings.push(qtyLine("berries_cup", extraBerries, formatQty(extraBerries) + " cup mixed berries (extra)"));
      } else {
        const oatCups = clamp(Math.round((need / FOOD.oats_cup.c) * 4) / 4, 0.25, 0.5);
        ings.push(qtyLine("oats_cup", oatCups, formatQty(oatCups) + " cup dry oats"));
      }
    }

    const titles = {
      berry_banana: "Banana berry smoothie",
      pb_banana: "Peanut butter banana smoothie",
      chocolate_cherry: "Chocolate cherry smoothie",
      pumpkin_spice: "Pumpkin spice smoothie",
      banana_bread: "Banana bread smoothie",
    };
    const totals = roundMacros(sumIngredients(ings));
    return {
      title: titles[flavor] || "Smoothie",
      type: "smoothie",
      flavor,
      ingredients: ings.filter((i) => !i._note),
      totals,
      notes,
      targetGrams,
      targetCal,
    };
  }

  function buildOatmealSlot(flavor, targetCal, targetGrams, includeMilk) {
    const notes = [];
    const ings = [];

    // Protein 0.5–2 scoops ~3–8g below
    const scoops = proteinQtyForTarget(FOOD.protein_scoop.p, targetGrams.p, 0.5, 2, 0.25);
    ings.push(qtyLine("protein_scoop", scoops, scoopLabel(scoops)));

    // Oats cover ≥⅔ of meal carb target; 1–2 servings
    let oatCups = (targetGrams.c * (2 / 3)) / FOOD.oats_cup.c;
    oatCups = clamp(Math.round(oatCups * 4) / 4, 0.5, 2);
    ings.push(qtyLine("oats_cup", oatCups, formatQty(oatCups) + " cup dry oats"));

    // Sweetness / flavor fruit (raisins OK in oats)
    if (flavor === "pumpkin_spice") {
      ings.push(qtyLine("banana", 0.5, "½ banana"));
      ings.push(qtyLine("pumpkin_cup", 1 / 3, "⅓ cup pumpkin puree"));
      ings.push(qtyLine("maple_tsp", 1, "1 tsp maple syrup"));
      notes.push("Flavor: pumpkin spice");
      notes.push("Optional: cinnamon, cacao, or a pinch of salt");
    } else if (flavor === "banana_bread") {
      ings.push(qtyLine("banana", 0.5, "½ banana"));
      ings.push(qtyLine("raisins_cup", 0.125, "⅛ cup raisins"));
      ings.push(qtyLine("maple_tsp", 1, "1 tsp maple syrup"));
      notes.push("Optional flavor: cinnamon, cacao, or a pinch of salt");
    } else if (flavor === "berry_banana") {
      ings.push(qtyLine("banana", 0.5, "½ banana"));
      ings.push(qtyLine("berries_cup", 0.5, "½ cup mixed berries"));
      notes.push("Optional flavor: cinnamon, cacao, or a pinch of salt");
    } else if (flavor === "pb_banana") {
      ings.push(qtyLine("banana", 1, "1 medium banana"));
      notes.push("Optional flavor: cacao, cinnamon, or a pinch of salt");
    } else {
      ings.push(qtyLine("cherries_cup", 0.75, "¾ cup cherries"));
      ings.push(qtyLine("cacao_tsp", 2, "2 tsp cacao powder"));
      notes.push("Optional flavor: cinnamon, cacao, or a pinch of salt");
    }

    // Milk: 4oz per 1 serving oats — omit if caller says so (day budget)
    if (includeMilk !== false) {
      const milkOz = Math.round(oatCups * 4);
      if (milkOz > 0) {
        ings.push(qtyLine("almond_milk_oz", milkOz, milkOz + " oz unsweetened almond milk"));
      }
    }

    // Fats: 1–6 tsp chia/hemp/walnuts/nut butter if permitted
    let used = sumIngredients(ings);
    const fatLeft = targetGrams.f - used.f;
    if (flavor === "pb_banana" && fatLeft >= 1.5) {
      const tsp = clamp(Math.round(Math.min(fatLeft, FOOD.pb_tsp.f * 6) / FOOD.pb_tsp.f), 1, 6);
      ings.push(qtyLine("pb_tsp", tsp, formatQty(tsp) + " tsp peanut butter"));
    } else if (fatLeft >= 1) {
      const fatFood = flavor === "berry_banana" ? "chia_tsp" : "walnuts_tsp";
      const tsp = clamp(Math.round(Math.min(fatLeft, FOOD[fatFood].f * 6) / FOOD[fatFood].f), 1, 6);
      ings.push(qtyLine(fatFood, tsp, formatQty(tsp) + " tsp " + FOOD[fatFood].name));
    }

    // Top up carbs with honey if still short
    used = sumIngredients(ings);
    if (used.c < targetGrams.c - 10) {
      const tsp = clamp(Math.round((targetGrams.c - used.c) / FOOD.honey_tsp.c), 1, 2);
      ings.push(qtyLine("honey_tsp", tsp, formatQty(tsp) + " tsp honey"));
    }

    const titles = {
      pumpkin_spice: "Pumpkin spice oatmeal",
      banana_bread: "Banana bread oatmeal",
      berry_banana: "Berry banana oatmeal",
      pb_banana: "Peanut butter banana oatmeal",
      chocolate_cherry: "Chocolate cherry oatmeal",
    };
    const totals = roundMacros(sumIngredients(ings));
    return {
      title: titles[flavor] || "Oatmeal",
      type: "oatmeal",
      flavor,
      ingredients: ings,
      totals,
      notes,
      targetGrams,
      targetCal,
      _oatCups: oatCups,
    };
  }

  function buildBowlSlot(protein, targetCal, targetGrams, options) {
    options = options || {};
    const tier = options.tier || budgetTier(options.budget || 300);
    const proteinKey = {
      beef: "beef_oz",
      turkey: "turkey_oz",
      chicken: "chicken_oz",
      chicken_thigh: "chicken_thigh_oz",
      salmon: "salmon_oz",
      cod: "cod_oz",
      eggs: "egg",
      egg_whites: "egg_white",
      shrimp: "shrimp_oz",
    }[protein];
    const titles = {
      beef: "Ground beef bowl",
      turkey: "Turkey bowl",
      chicken: "Chicken breast bowl",
      chicken_thigh: "Chicken thigh bowl",
      salmon: "Salmon bowl",
      cod: "Cod bowl",
      eggs: "Egg bowl",
      egg_whites: "Egg white bowl",
      shrimp: "Shrimp bowl",
    };
    const vegKey = options.vegKey || "broccoli_cup";
    const fatStyle = options.fatStyle || "evoo"; // evoo | avocado | hbe

    const ings = [];
    // Protein almost entirely (3–8g below meal protein target)
    if (protein === "eggs" || protein === "egg_whites") {
      const per = FOOD[proteinKey].p;
      let count = clamp(Math.round(proteinQtyForTarget(per, targetGrams.p, 3, 8, 1)), 2, 8);
      ings.push(qtyLine(proteinKey, count));
    } else {
      const oz = proteinQtyForTarget(FOOD[proteinKey].p, targetGrams.p, 3, 10, 0.5);
      ings.push(qtyLine(proteinKey, oz));
    }

    // Carb to hit meal carb target + always a veg
    let used = sumIngredients(ings);
    const carbNeed = Math.max(0, targetGrams.c - used.c - 12); // leave room for veg carbs
    const carbKey = tier.id === "low" ? "rice_cup" : (options.carbKey || "rice_cup");
    let riceCups = clamp(snapCupFraction(carbNeed / FOOD[carbKey].c), 0.5, 2);
    ings.push(qtyLine(carbKey, riceCups));
    // Low budget: smaller veg portion to cut price/variety
    const vegQty = tier.reduceVariety ? 1 : 1.5;
    ings.push(qtyLine(vegKey, vegQty));

    // Fat: 1–3 tsp EVOO, portion of avocado, or hard boiled egg
    used = sumIngredients(ings);
    const fatNeed = targetGrams.f - used.f;
    if (fatNeed >= 2) {
      if (fatStyle === "avocado") {
        const oz = clamp(Math.round((fatNeed / FOOD.avocado_oz.f) * 2) / 2, 1, 4);
        ings.push(qtyLine("avocado_oz", oz));
      } else if (fatStyle === "hbe") {
        const n = clamp(Math.round(fatNeed / FOOD.hard_boiled_egg.f), 1, 2);
        ings.push(qtyLine("hard_boiled_egg", n));
      } else {
        const tsp = clamp(Math.round(fatNeed / FOOD.evoo_tsp.f), 1, 3);
        ings.push(qtyLine("evoo_tsp", tsp));
      }
    }

    const totals = roundMacros(sumIngredients(ings));
    return {
      title: titles[protein],
      type: "bowl",
      protein,
      ingredients: ings,
      totals,
      notes: ["Season lightly to taste"],
      targetGrams,
      targetCal,
    };
  }

  function buildSaladJarSlot(protein, targetCal, targetGrams, options) {
    options = options || {};
    const tier = options.tier || budgetTier(options.budget || 300);
    const proteinKey = {
      beef: "beef_oz", turkey: "turkey_oz", chicken: "chicken_oz", chicken_thigh: "chicken_thigh_oz",
      salmon: "salmon_oz", cod: "cod_oz", eggs: "egg", egg_whites: "egg_white", shrimp: "shrimp_oz",
    }[protein];
    const titles = {
      beef: "Ground beef salad jar", turkey: "Turkey salad jar", chicken: "Chicken salad jar",
      chicken_thigh: "Chicken thigh salad jar", salmon: "Salmon salad jar", cod: "Cod salad jar",
      eggs: "Egg salad jar", egg_whites: "Egg white salad jar", shrimp: "Shrimp salad jar",
    };
    const greensKey = options.greensKey || "lettuce_cup";
    const vegKeys = options.vegKeys || ["carrots_cup", "cucumber_cup", "cherry_tomato_cup"];
    const fatStyle = options.fatStyle || "evoo";
    const ings = [];

    if (protein === "eggs" || protein === "egg_whites") {
      const per = FOOD[proteinKey].p;
      let count = clamp(Math.round(proteinQtyForTarget(per, targetGrams.p, 3, 8, 1)), 2, 8);
      ings.push(qtyLine(proteinKey, count));
    } else {
      const oz = proteinQtyForTarget(FOOD[proteinKey].p, targetGrams.p, 3, 10, 0.5);
      ings.push(qtyLine(proteinKey, oz));
    }

    // Optional beans 1/4–1/2 cup
    if (options.addBeans) {
      ings.push(qtyLine("black_beans_cup", snapCupFraction(0.25 + (options.variant || 0) % 2 * 0.25)));
    }

    // Greens 2–4 cups
    let used = sumIngredients(ings);
    const greensCups = clamp(snapCupFraction(tier.reduceVariety ? 2 : 2.5 + ((options.variant || 0) % 3) * 0.5), 2, 4);
    ings.push(qtyLine(greensKey, greensCups));

    // 1–3 veg portions
    const nVeg = tier.reduceVariety ? 1 : Math.min(3, vegKeys.length);
    for (let i = 0; i < nVeg; i++) {
      const vk = vegKeys[i % vegKeys.length];
      const qty = snapCupFraction(0.25 + (i % 3) * 0.25);
      ings.push(qtyLine(vk, clamp(qty, 0.25, 1)));
    }

    // Optional rice for carbs
    used = sumIngredients(ings);
    const carbNeed = targetGrams.c - used.c;
    if (carbNeed > 12) {
      const riceCups = clamp(snapCupFraction(carbNeed / FOOD.rice_cup.c), 0.125, 1);
      if (riceCups >= 0.125) ings.push(qtyLine("rice_cup", riceCups));
    }

    used = sumIngredients(ings);
    const fatNeed = targetGrams.f - used.f;
    if (fatNeed >= 2) {
      if (fatStyle === "avocado") {
        ings.push(qtyLine("avocado_oz", clamp(Math.round((fatNeed / FOOD.avocado_oz.f) * 2) / 2, 1, 3)));
      } else if (fatStyle === "hbe") {
        ings.push(qtyLine("hard_boiled_egg", clamp(Math.round(fatNeed / FOOD.hard_boiled_egg.f), 1, 2)));
      } else if (fatStyle === "feta") {
        ings.push(qtyLine("feta_oz", clamp(Math.round((fatNeed / FOOD.feta_oz.f) * 2) / 2, 0.5, 2)));
      } else if (fatStyle === "parmesan") {
        ings.push(qtyLine("parmesan_oz", clamp(Math.round((fatNeed / FOOD.parmesan_oz.f) * 2) / 2, 0.5, 1.5)));
      } else {
        ings.push(qtyLine("evoo_tsp", clamp(Math.round(fatNeed / FOOD.evoo_tsp.f), 1, 3)));
      }
    }

    return {
      title: titles[protein] || "Salad jar",
      type: "salad_jar",
      protein,
      ingredients: ings,
      totals: roundMacros(sumIngredients(ings)),
      notes: ["Season lightly to taste"],
      targetGrams,
      targetCal,
    };
  }

  function buildHbEggSnack(targetCal, targetGrams, fruitName) {
    const fruit = fruitName || "berries";
    const eggs = clamp(Math.round(targetGrams.p / FOOD.hard_boiled_egg.p), 1, 3);
    const ings = [qtyLine("hard_boiled_egg", eggs)];
    const used = sumIngredients(ings);
    addFruitCarbs(ings, fruit, targetGrams.c - used.c, targetCal - used.kcal);
    const fruitLabel = fruit === "berries" ? "berries" : fruit;
    return {
      title: "Hard boiled eggs & " + fruitLabel,
      type: "hb_egg_snack",
      ingredients: ings,
      totals: roundMacros(sumIngredients(ings)),
      notes: [],
      targetGrams,
      targetCal,
    };
  }

  function buildNutOnlySnack(nutKey, targetCal, targetGrams) {
    // Size nuts toward snack calorie / fat target (Option 1 — Nut only)
    const f = FOOD[nutKey];
    let oz = targetCal / f.kcal;
    // Also consider fat target
    if (targetGrams.f > 0) {
      const byFat = targetGrams.f / f.f;
      oz = (oz + byFat) / 2;
    }
    oz = clamp(Math.round(oz * 4) / 4, 0.5, 3);
    const ings = [qtyLine(nutKey, oz, formatQty(oz) + " oz " + f.name)];
    const totals = roundMacros(sumIngredients(ings));
    const names = {
      almonds_oz: "Almonds",
      peanuts_oz: "Peanuts",
      cashews_oz: "Cashews",
      pistachios_oz: "Pistachios",
    };
    return {
      title: names[nutKey] || "Nuts",
      type: "nut",
      ingredients: ings,
      totals,
      notes: [],
      targetGrams,
      targetCal,
      _role: "fatty",
    };
  }

  function buildLeanSnackProtein(kind, fruit, targetP, targetF) {
    // kind: cottage | greek
    const ings = [];
    let title;
    if (kind === "cottage") {
      const cups = clamp(Math.round((targetP / FOOD.cottage_lf_cup.p) * 4) / 4, 0.5, 2);
      ings.push(
        qtyLine("cottage_lf_cup", cups, formatQty(cups) + " cup low-fat cottage cheese")
      );
      title =
        fruit === "pineapple"
          ? "Cottage cheese & pineapple"
          : fruit === "peach"
            ? "Cottage cheese & peach"
            : fruit === "mango"
              ? "Cottage cheese & mango"
              : "Cottage cheese & berries";
    } else {
      const cups = clamp(Math.round((targetP / FOOD.greek_nonfat_cup.p) * 4) / 4, 0.5, 2);
      ings.push(
        qtyLine("greek_nonfat_cup", cups, formatQty(cups) + " cup 0% Greek yogurt")
      );
      title = fruit === "berries" ? "Greek yogurt & berries" : "Greek yogurt & fruit";
    }
    return { ings, title, kind, fruit, _role: "lean" };
  }

  function addFruitCarbs(ings, fruit, carbNeed, calNeed) {
    const fruitKey =
      fruit === "pineapple"
        ? "pineapple_cup"
        : fruit === "peach"
          ? "peach_cup"
          : fruit === "mango"
            ? "mango_cup"
            : "berries_cup";
    let cups = 0.5;
    if (carbNeed > 0) {
      cups = clamp(Math.round((carbNeed / FOOD[fruitKey].c) * 4) / 4, 0.5, 2);
    }
    // Prefer hitting calorie need for two-snack combo
    if (calNeed > 0) {
      const byCal = calNeed / FOOD[fruitKey].kcal;
      cups = clamp(Math.round(Math.max(cups, byCal) * 4) / 4, 0.5, 2);
      // Prefer not overshooting carb need by >15g
      const maxByCarb = carbNeed > 0 ? (sumIngredients(ings).c + carbNeed + 15) / FOOD[fruitKey].c : 2;
      // sumIngredients(ings) before fruit — approximate with cups alone
      const estC = FOOD[fruitKey].c * cups;
      if (carbNeed > 0 && estC > carbNeed + 20) {
        cups = clamp(Math.round(((carbNeed + 10) / FOOD[fruitKey].c) * 4) / 4, 0.5, 2);
      }
    }
    const fruitNames = {
      pineapple_cup: "pineapple",
      peach_cup: "sliced peach",
      mango_cup: "mango",
      berries_cup: "mixed berries",
    };
    ings.push(qtyLine(fruitKey, cups, formatQty(cups) + " cup " + fruitNames[fruitKey]));

    let used = sumIngredients(ings);
    // Optional honey/maple if carbs still short
    if (used.c < carbNeed - 5 || (calNeed > 0 && used.kcal < calNeed - 40)) {
      const tsp = clamp(
        Math.round(Math.max((carbNeed - used.c) / FOOD.honey_tsp.c, (calNeed - used.kcal) / FOOD.honey_tsp.kcal)),
        1,
        2
      );
      if (tsp >= 1) ings.push(qtyLine("honey_tsp", tsp, formatQty(tsp) + " tsp honey"));
    }
    return ings;
  }

  /**
   * Build full day following Meal & Snack Planning Procedure.
   * Prefer even calorie split; allow ±150 meal / ±75 snack if needed later.
   */
  function assignSuggestions(slots, macroPct, dailyCalories, variant, planOptions) {
    variant = Math.max(0, Number(variant) || 0);
    planOptions = planOptions || {};
    const tier = budgetTier(planOptions.budget || 300);
    const fatStyles = ["evoo", "avocado", "hbe"];
    const mealSlots = slots.filter((s) => s.kind === "meal");
    const snackSlots = slots.filter((s) => s.kind === "snack");
    const is3m2s = mealSlots.length === 3 && snackSlots.length === 2;

    const bowlProteins = ["beef", "chicken", "turkey", "salmon", "chicken_thigh", "cod", "eggs", "egg_whites", "shrimp"];
    const breakfastFlavors = tier.preferCheapProduce
      ? ["banana_bread", "pumpkin_spice", "pb_banana", "berry_banana", "chocolate_cherry"]
      : [
          "berry_banana",
          "pumpkin_spice",
          "pb_banana",
          "banana_bread",
          "chocolate_cherry",
        ];
    const smoothieSafeFlavors = breakfastFlavors.filter((f) => f !== "pumpkin_spice" && f !== "banana_bread");
    const nutKeys = ["almonds_oz", "peanuts_oz", "cashews_oz", "pistachios_oz"];
    const leanKinds = ["cottage", "greek"];
    const fruits = ["pineapple", "peach", "mango", "berries"];

    const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
    const usedProduce = new Set(); // produce families used across the day
    const nutKey = pick(nutKeys, variant);
    const leanKind = pick(leanKinds, variant);
    let leanFruit = null; // chosen later with diversity against day produce
    const bowlProtein = pick(bowlProteins, variant);
    const meal1Smoothie = variant % 2 === 0;
    // Initial flavor seeds; may be re-picked with diversity as the day builds
    let flavorA = pick(breakfastFlavors, variant);
    let flavorB = pick(breakfastFlavors, variant + 2);

    // Dual-snack protein plan (step 2): fattier nuts + leaner dairy; balance calories ~even
    let fattyPlan = null;
    let leanPlan = null;
    if (snackSlots.length === 2) {
      const combinedCal = snackSlots[0].calories + snackSlots[1].calories;
      const combined = gramsExact(combinedCal, macroPct);
      const eachCal = combinedCal / 2;
      const nutFood = FOOD[nutKey];
      let nutOz = eachCal / nutFood.kcal;
      const byFat = (combined.f * 0.85) / nutFood.f;
      nutOz = clamp(Math.round(((nutOz + byFat) / 2) * 4) / 4, 1, 2.5);
      const nutKcal = nutFood.kcal * nutOz;
      if (nutKcal < eachCal - 75) {
        nutOz = clamp(Math.round((eachCal / nutFood.kcal) * 4) / 4, 1, 2.5);
      }
      fattyPlan = {
        nutKey,
        oz: nutOz,
        kcal: nutFood.kcal * nutOz,
        p: nutFood.p * nutOz,
        f: nutFood.f * nutOz,
        c: nutFood.c * nutOz,
      };
      leanPlan = {
        kind: leanKind,
        fruit: null,
        targetP: Math.max(12, combined.p - fattyPlan.p),
        targetF: Math.max(0, combined.f - fattyPlan.f),
        combinedCal,
        combined,
        remainCal: combinedCal - fattyPlan.kcal,
      };
    }

    const results = [];
    let mealCount = 0;
    let snackCount = 0;
    let breakfastI = variant;
    let bowlI = variant;
    const pendingLean = [];

    for (const slot of slots) {
      const targetGrams = gramsExact(slot.calories, macroPct);
      const tg = { p: targetGrams.p, c: targetGrams.c, f: targetGrams.f };

      if (slot.kind === "meal") {
        mealCount += 1;
        let suggestion;
        if (is3m2s) {
          if (mealCount === 1) {
            if (meal1Smoothie) {
              const fl = pickDiverseFlavor(smoothieSafeFlavors, usedProduce, variant);
              suggestion = buildSmoothieSlot(fl, slot.calories, tg, "almond_milk_oz");
            } else {
              flavorA = pickDiverseFlavor(breakfastFlavors, usedProduce, variant);
              suggestion = buildOatmealSlot(flavorA, slot.calories, tg, true);
            }
          } else if (mealCount === 2) {
            const vegKey = pickDiverseKey(BOWL_VEG_KEYS, usedProduce, variant + bowlI);
            const saladFat = ["evoo", "avocado", "feta", "parmesan", "hbe"];
            if (variant % 2 === 1) {
              const greens = pickDiverseKey(["lettuce_cup", "mixed_greens_cup", "kale_cup", "spinach_cup"], usedProduce, variant);
              const vegKeys = [
                pickDiverseKey(["carrots_cup", "peppers_cup", "cherry_tomato_cup", "cucumber_cup", "onion_cup", "corn_cup"], usedProduce, variant),
                pickDiverseKey(["cucumber_cup", "carrots_cup", "cherry_tomato_cup", "peppers_cup"], usedProduce, variant + 1),
                pickDiverseKey(["cherry_tomato_cup", "onion_cup", "corn_cup", "cucumber_cup"], usedProduce, variant + 2),
              ];
              suggestion = buildSaladJarSlot(bowlProtein, slot.calories, tg, {
                greensKey: greens,
                vegKeys,
                budget: planOptions.budget,
                tier,
                fatStyle: saladFat[variant % saladFat.length],
                addBeans: variant % 3 === 0,
                variant,
              });
            } else {
              suggestion = buildBowlSlot(bowlProtein, slot.calories, tg, { vegKey, budget: planOptions.budget, tier, fatStyle: fatStyles[variant % fatStyles.length] });
            }
            bowlI += 1;
          } else {
            if (meal1Smoothie) {
              flavorB = pickDiverseFlavor(breakfastFlavors, usedProduce, variant + 2);
              suggestion = buildOatmealSlot(flavorB, slot.calories, tg, true);
            } else {
              const fl = pickDiverseFlavor(smoothieSafeFlavors, usedProduce, variant + 1);
              suggestion = buildSmoothieSlot(fl, slot.calories, tg, "almond_milk_oz");
            }
          }
        } else if (mealCount === 1) {
          const useSmoothie = breakfastI % 2 === 0;
          const pool = useSmoothie ? smoothieSafeFlavors : breakfastFlavors;
          const fl = pickDiverseFlavor(pool, usedProduce, breakfastI + variant);
          suggestion = useSmoothie
            ? buildSmoothieSlot(fl, slot.calories, tg, "almond_milk_oz")
            : buildOatmealSlot(fl, slot.calories, tg, true);
          breakfastI += 1;
        } else {
          const vegKey = pickDiverseKey(BOWL_VEG_KEYS, usedProduce, variant + bowlI);
          const prot = bowlProteins[bowlI % bowlProteins.length];
          const saladFat = ["evoo", "avocado", "feta", "parmesan", "hbe"];
          if ((variant + bowlI) % 2 === 1) {
            const greens = pickDiverseKey(["lettuce_cup", "mixed_greens_cup", "kale_cup", "spinach_cup"], usedProduce, variant + bowlI);
            const vegKeys = [
              pickDiverseKey(["carrots_cup", "peppers_cup", "cherry_tomato_cup", "cucumber_cup", "onion_cup", "corn_cup"], usedProduce, variant + bowlI),
              pickDiverseKey(["cucumber_cup", "carrots_cup", "cherry_tomato_cup"], usedProduce, variant + bowlI + 1),
            ];
            suggestion = buildSaladJarSlot(prot, slot.calories, tg, {
              greensKey: greens,
              vegKeys,
              budget: planOptions.budget,
              tier,
              fatStyle: saladFat[(variant + bowlI) % saladFat.length],
              addBeans: (variant + bowlI) % 3 === 0,
              variant: variant + bowlI,
            });
          } else {
            suggestion = buildBowlSlot(prot, slot.calories, tg, { vegKey, budget: planOptions.budget, tier, fatStyle: fatStyles[(variant + bowlI) % fatStyles.length] });
          }
          bowlI += 1;
        }
        markProduceFromIngredients(usedProduce, suggestion.ingredients);
        results.push(Object.assign({}, slot, { targetMacros: gramsFromPct(slot.calories, macroPct), suggestion }));
      } else {
        snackCount += 1;
        if (snackSlots.length === 2) {
          if (snackCount === 1) {
            const suggestion = buildNutOnlySnack(fattyPlan.nutKey, slot.calories, tg);
            // Keep planned oz from dual-snack balance when present
            if (fattyPlan.oz) {
              const ings = [
                qtyLine(
                  fattyPlan.nutKey,
                  fattyPlan.oz,
                  formatQty(fattyPlan.oz) + " oz " + FOOD[fattyPlan.nutKey].name
                ),
              ];
              suggestion.ingredients = ings;
              suggestion.totals = roundMacros(sumIngredients(ings));
            }
            results.push(Object.assign({}, slot, { targetMacros: gramsFromPct(slot.calories, macroPct), suggestion }));
          } else {
            // Defer lean snack fruit until meals are known (diversity)
            pendingLean.push({ slot, tg, index: results.length });
            results.push(null);
          }
        } else if (snackSlots.length === 1 && variant % 3 === 1) {
          const suggestion = buildNutOnlySnack(pick(nutKeys, variant), slot.calories, tg);
          results.push(Object.assign({}, slot, { targetMacros: gramsFromPct(slot.calories, macroPct), suggestion }));
        } else if (snackSlots.length === 1 && variant % 3 === 2) {
          const sf = pickDiverseFruitName(fruits, usedProduce, variant + snackCount);
          const suggestion = buildHbEggSnack(slot.calories, tg, sf);
          markProduceFromIngredients(usedProduce, suggestion.ingredients);
          results.push(Object.assign({}, slot, { targetMacros: gramsFromPct(slot.calories, macroPct), suggestion }));
        } else {
          const sk = pick(leanKinds, variant);
          const sf = pickDiverseFruitName(fruits, usedProduce, variant + snackCount);
          const base = buildLeanSnackProtein(sk, sf, tg.p, tg.f);
          addFruitCarbs(
            base.ings,
            sf,
            tg.c - sumIngredients(base.ings).c,
            slot.calories - sumIngredients(base.ings).kcal
          );
          markProduceFromIngredients(usedProduce, base.ings);
          const suggestion = {
            title: base.title,
            type: sk === "cottage" ? "cottage_cheese" : "greek_yogurt",
            ingredients: base.ings,
            totals: roundMacros(sumIngredients(base.ings)),
            notes: [],
            targetGrams: tg,
            targetCal: slot.calories,
          };
          results.push(Object.assign({}, slot, { targetMacros: gramsFromPct(slot.calories, macroPct), suggestion }));
        }
      }
    }

    for (const item of pendingLean) {
      leanFruit = pickDiverseFruitName(fruits, usedProduce, variant + 1);
      leanPlan.fruit = leanFruit;
      const base = buildLeanSnackProtein(leanPlan.kind, leanFruit, leanPlan.targetP, leanPlan.targetF);
      const fatty = results.find((r) => r && r.suggestion && r.suggestion._role === "fatty");
      const fattyKcal = fatty ? fatty.suggestion.totals.kcal : leanPlan.kcal;
      const fattyC = fatty ? fatty.suggestion.totals.c : fattyPlan.c;
      const baseKcal = sumIngredients(base.ings).kcal;
      const baseC = sumIngredients(base.ings).c;
      const calNeed = leanPlan.combinedCal - fattyKcal - baseKcal;
      const carbNeed = leanPlan.combined.c - fattyC - baseC;
      addFruitCarbs(base.ings, leanFruit, carbNeed, calNeed);
      markProduceFromIngredients(usedProduce, base.ings);
      const suggestion = {
        title: base.title,
        type: leanPlan.kind === "cottage" ? "cottage_cheese" : "greek_yogurt",
        ingredients: base.ings,
        totals: roundMacros(sumIngredients(base.ings)),
        notes: [],
        targetGrams: item.tg,
        targetCal: item.slot.calories,
        _role: "lean",
      };
      results[item.index] = Object.assign({}, item.slot, {
        targetMacros: gramsFromPct(item.slot.calories, macroPct),
        suggestion,
      });
    }

    // Smoothie milk: prefer dairy skim/2% when day is under on cal or protein;
    // use almond milk if day's protein or calories already too high.
    let dayKcal = results.reduce((a, r) => a + r.suggestion.totals.kcal, 0);
    let dayP = results.reduce((a, r) => a + r.suggestion.totals.p, 0);
    const dayTargetP = (dailyCalories * macroPct.p) / 100 / 4;
    const calTooHigh = dayKcal > dailyCalories;
    const proteinTooHigh = dayP > dayTargetP + 8;
    if (!calTooHigh && !proteinTooHigh && (dayKcal < dailyCalories - 80 || dayP < dayTargetP - 8)) {
      for (const r of results) {
        if (r.suggestion.type === "smoothie") {
          const prefer2pct = dayKcal < dailyCalories - 200 && dayP >= dayTargetP - 5;
          const milkKey = prefer2pct ? "milk_2pct_oz" : "milk_skim_oz";
          const delta = 8 * (FOOD[milkKey].kcal - FOOD.almond_milk_oz.kcal);
          const pDelta = 8 * (FOOD[milkKey].p - FOOD.almond_milk_oz.p);
          if (dayKcal + delta <= dailyCalories + 100 && dayP + pDelta <= dayTargetP + 12) {
            const rebuilt = buildSmoothieSlot(
              r.suggestion.flavor,
              r.calories,
              r.suggestion.targetGrams,
              milkKey
            );
            dayKcal = dayKcal - r.suggestion.totals.kcal + rebuilt.totals.kcal;
            dayP = dayP - r.suggestion.totals.p + rebuilt.totals.p;
            r.suggestion = rebuilt;
          }
          break;
        }
      }
    }

    // Omit oatmeal milk if day would surpass goal by more than 100
    dayKcal = results.reduce((a, r) => a + r.suggestion.totals.kcal, 0);
    if (dayKcal > dailyCalories + 100) {
      for (const r of results) {
        if (r.suggestion.type === "oatmeal") {
          const rebuilt = buildOatmealSlot(r.suggestion.flavor, r.calories, r.suggestion.targetGrams, false);
          const newDay = dayKcal - r.suggestion.totals.kcal + rebuilt.totals.kcal;
          if (newDay <= dailyCalories + 100 || newDay < dayKcal) {
            dayKcal = newDay;
            r.suggestion = rebuilt;
            r.suggestion.notes = (r.suggestion.notes || []).concat([
              "Milk omitted to stay within daily calorie tolerance",
            ]);
          }
        }
      }
    }

    // Macro / calorie fine-tune: raise fat toward target without blowing ±100 cal
    function dayTotals() {
      return results.reduce(
        (a, r) => ({
          kcal: a.kcal + r.suggestion.totals.kcal,
          p: a.p + r.suggestion.totals.p,
          c: a.c + r.suggestion.totals.c,
          f: a.f + r.suggestion.totals.f,
        }),
        { kcal: 0, p: 0, c: 0, f: 0 }
      );
    }

    const dayTargetF = (dailyCalories * macroPct.f) / 100 / 9;
    let tot = dayTotals();

    // Add fat via EVOO on bowls, walnuts/chia on oats/smoothie, extra almonds
    for (let pass = 0; pass < 6; pass++) {
      tot = dayTotals();
      const fatShort = dayTargetF - tot.f;
      const calRoom = dailyCalories + 100 - tot.kcal;
      if (fatShort <= 2 || calRoom < 35) break;

      let adjusted = false;
      for (const r of results) {
        tot = dayTotals();
        const fs = dayTargetF - tot.f;
        const room = dailyCalories + 100 - tot.kcal;
        if (fs <= 2 || room < 35) break;

        if (r.suggestion.type === "bowl") {
          const tsp = Math.min(1, Math.floor(Math.min(fs / FOOD.evoo_tsp.f, room / FOOD.evoo_tsp.kcal)));
          if (tsp >= 1) {
            // Cap total EVOO at 3 tsp
            const existing = r.suggestion.ingredients
              .filter((i) => i._key === "evoo_tsp")
              .reduce((a, i) => a + (i._qty || 0), 0);
            if (existing < 3) {
              const add = Math.min(tsp, 3 - existing);
              r.suggestion.ingredients.push(
                qtyLine("evoo_tsp", add, formatQty(add) + " tsp extra virgin olive oil")
              );
              // merge duplicate evoo lines
              const evooQty = r.suggestion.ingredients
                .filter((i) => i._key === "evoo_tsp")
                .reduce((a, i) => a + i._qty, 0);
              r.suggestion.ingredients = r.suggestion.ingredients.filter((i) => i._key !== "evoo_tsp");
              r.suggestion.ingredients.push(
                qtyLine("evoo_tsp", evooQty, formatQty(evooQty) + " tsp extra virgin olive oil")
              );
              r.suggestion.totals = roundMacros(sumIngredients(r.suggestion.ingredients));
              adjusted = true;
            }
          }
        } else if (r.suggestion.type === "smoothie" || r.suggestion.type === "oatmeal") {
          const fatFood = "walnuts_tsp";
          const existing = r.suggestion.ingredients
            .filter((i) => i._key === fatFood || i._key === "chia_tsp" || i._key === "pb_tsp" || i._key === "hemp_tsp")
            .reduce((a, i) => a + (i._qty || 0), 0);
          if (existing < 6) {
            const tsp = Math.min(2, Math.max(1, Math.round(Math.min(fs / FOOD[fatFood].f, room / FOOD[fatFood].kcal))));
            const add = Math.min(tsp, 6 - existing);
            if (add >= 1) {
              r.suggestion.ingredients.push(
                qtyLine(fatFood, add, formatQty(add) + " tsp " + FOOD[fatFood].name)
              );
              r.suggestion.totals = roundMacros(sumIngredients(r.suggestion.ingredients));
              adjusted = true;
            }
          }
        } else if (r.suggestion.type === "nut" && fs > 3) {
          const ing = r.suggestion.ingredients[0];
          const addOz = 0.25;
          const newQty = clamp((ing._qty || 1) + addOz, 0.5, 3);
          if (newQty > (ing._qty || 1) && FOOD.almonds_oz.kcal * 0.25 <= room) {
            r.suggestion.ingredients[0] = qtyLine("almonds_oz", newQty, formatQty(newQty) + " oz almonds");
            r.suggestion.totals = roundMacros(sumIngredients(r.suggestion.ingredients));
            adjusted = true;
          }
        }
      }
      if (!adjusted) break;
    }

    // Merge duplicate fat lines (walnuts/chia/evoo) created during fine-tune
    for (const r of results) {
      const keys = ["evoo_tsp", "walnuts_tbsp", "chia_tbsp", "walnuts_tsp", "chia_tsp", "pb_tsp", "hemp_tsp", "rice_cup", "honey_tsp"];
      for (const key of keys) {
        const lines = r.suggestion.ingredients.filter((i) => i._key === key);
        if (lines.length > 1) {
          const qty = lines.reduce((a, i) => a + (i._qty || 0), 0);
          r.suggestion.ingredients = r.suggestion.ingredients.filter((i) => i._key !== key);
          const label =
            key === "evoo_tsp"
              ? formatQty(qty) + " tsp extra virgin olive oil"
              : key === "rice_cup"
                ? formatQty(qty) + " cup cooked white rice"
                : key === "honey_tsp"
                  ? formatQty(qty) + " tsp honey"
                  : key.endsWith("_tsp")
                    ? formatQty(qty) + " tsp " + FOOD[key].name
                    : formatQty(qty) + " tbsp " + FOOD[key].name;
          // insert fat near end, rice after protein
          if (key === "rice_cup") {
            r.suggestion.ingredients.splice(1, 0, qtyLine(key, qty, label));
          } else {
            r.suggestion.ingredients.push(qtyLine(key, qty, label));
          }
        }
      }
      r.suggestion.totals = roundMacros(sumIngredients(r.suggestion.ingredients));
    }

    // Refine macros toward ±2% split while keeping ±100 cal
    function pctOf(tot) {
      const k = Math.max(tot.kcal, 1);
      return {
        p: (tot.p * 4 * 100) / k,
        c: (tot.c * 4 * 100) / k,
        f: (tot.f * 9 * 100) / k,
      };
    }

    function setQty(r, key, newQty, labelFn) {
      const idx = r.suggestion.ingredients.findIndex((i) => i._key === key);
      if (idx < 0) return false;
      if (newQty <= 0.01) {
        r.suggestion.ingredients.splice(idx, 1);
      } else {
        r.suggestion.ingredients[idx] = qtyLine(key, newQty, labelFn(newQty));
      }
      r.suggestion.totals = roundMacros(sumIngredients(r.suggestion.ingredients));
      return true;
    }

    for (let pass = 0; pass < 10; pass++) {
      tot = dayTotals();
      const pct = pctOf(tot);
      const pHi = pct.p > macroPct.p + 2;
      const cHi = pct.c > macroPct.c + 2;
      const fLo = pct.f < macroPct.f - 2;
      const calHi = tot.kcal > dailyCalories + 100;
      const calLo = tot.kcal < dailyCalories - 100;
      if (!pHi && !cHi && !fLo && !calHi && !calLo) break;

      let changed = false;

      // Trim protein: cottage / scoops / beef
      if (pHi) {
        for (const r of results) {
          const cot = r.suggestion.ingredients.find((i) => i._key === "cottage_lf_cup");
          if (cot && cot._qty > 0.75) {
            setQty(r, "cottage_lf_cup", round1(cot._qty - 0.25), (q) => formatQty(q) + " cup low-fat cottage cheese");
            changed = true;
            break;
          }
          const scoop = r.suggestion.ingredients.find((i) => i._key === "protein_scoop");
          if (scoop && scoop._qty > 0.75) {
            setQty(r, "protein_scoop", round1(scoop._qty - 0.25), (q) => scoopLabel(q));
            changed = true;
            break;
          }
          const beef = r.suggestion.ingredients.find((i) => i._key === "beef_oz");
          if (beef && beef._qty > 4) {
            setQty(r, "beef_oz", beef._qty - 0.5, (q) => formatQty(q) + " oz " + FOOD.beef_oz.name);
            changed = true;
            break;
          }
        }
      }

      // Trim carbs: pineapple / rice / oats / berries
      tot = dayTotals();
      if (pctOf(tot).c > macroPct.c + 2 || tot.kcal > dailyCalories + 80) {
        for (const r of results) {
          const pine = r.suggestion.ingredients.find((i) => i._key === "pineapple_cup");
          if (pine && pine._qty > 0.75) {
            setQty(r, "pineapple_cup", round1(pine._qty - 0.25), (q) => formatQty(q) + " cup pineapple");
            changed = true;
            break;
          }
          const rice = r.suggestion.ingredients.find((i) => i._key === "rice_cup");
          if (rice && rice._qty > 0.75) {
            setQty(r, "rice_cup", round1(rice._qty - 0.25), (q) => formatQty(q) + " cup cooked white rice");
            changed = true;
            break;
          }
          const oats = r.suggestion.ingredients.find((i) => i._key === "oats_cup");
          if (oats && oats._qty > 0.5 && r.suggestion.type === "smoothie") {
            setQty(r, "oats_cup", round1(oats._qty - 0.25), (q) => formatQty(q) + " cup dry oats");
            changed = true;
            break;
          }
        }
      }

      // Raise fat if low and calorie room
      tot = dayTotals();
      if (pctOf(tot).f < macroPct.f - 2 && tot.kcal <= dailyCalories + 60) {
        for (const r of results) {
          if (r.suggestion.type === "bowl") {
            const evoo = r.suggestion.ingredients.find((i) => i._key === "evoo_tsp");
            const cur = evoo ? evoo._qty : 0;
            if (cur < 3) {
              if (evoo) setQty(r, "evoo_tsp", cur + 1, (q) => formatQty(q) + " tsp extra virgin olive oil");
              else {
                r.suggestion.ingredients.push(qtyLine("evoo_tsp", 1, "1 tsp extra virgin olive oil"));
                r.suggestion.totals = roundMacros(sumIngredients(r.suggestion.ingredients));
              }
              changed = true;
              break;
            }
          }
          if (r.suggestion.type === "nut") {
            const al = r.suggestion.ingredients.find((i) => i._key === "almonds_oz");
            if (al && al._qty < 2.5) {
              setQty(r, "almonds_oz", round1(al._qty + 0.25), (q) => formatQty(q) + " oz almonds");
              changed = true;
              break;
            }
          }
        }
      }

      // Fill calories if still short
      tot = dayTotals();
      if (tot.kcal < dailyCalories - 100) {
        for (const r of results) {
          if (r.suggestion.type === "bowl") {
            const evoo = r.suggestion.ingredients.find((i) => i._key === "evoo_tsp");
            const cur = evoo ? evoo._qty : 0;
            if (cur < 3) {
              if (evoo) setQty(r, "evoo_tsp", cur + 1, (q) => formatQty(q) + " tsp extra virgin olive oil");
              else {
                r.suggestion.ingredients.push(qtyLine("evoo_tsp", 1, "1 tsp extra virgin olive oil"));
                r.suggestion.totals = roundMacros(sumIngredients(r.suggestion.ingredients));
              }
              changed = true;
              break;
            }
          }
        }
      }

      if (!changed) break;
    }

    return results;
  }

  function macroPercents(totals) {
    const k = Math.max(totals.kcal, 1);
    return {
      p: Math.round(((totals.p * 4) / k) * 1000) / 10,
      c: Math.round(((totals.c * 4) / k) * 1000) / 10,
      f: Math.round(((totals.f * 9) / k) * 1000) / 10,
    };
  }

  function emptyMicros() {
    const o = {};
    MICRO_KEYS.forEach((k) => {
      o[k] = 0;
    });
    return o;
  }

  function aggregateDayMicros(schedule) {
    const totals = emptyMicros();
    for (const slot of schedule) {
      for (const ing of slot.suggestion.ingredients) {
        if (ing._note || !ing._key || !FOOD[ing._key]) continue;
        const m = FOOD[ing._key].m || emptyMicros();
        const q = ing._qty || 0;
        MICRO_KEYS.forEach((k) => {
          totals[k] += (m[k] || 0) * q;
        });
      }
    }
    const breakdown = {};
    MICRO_KEYS.forEach((k) => {
      const meta = MICRO_TARGETS[k];
      const amount = Math.round(totals[k] * 10) / 10;
      const pct = meta.target > 0 ? Math.round((amount / meta.target) * 1000) / 10 : 0;
      breakdown[k] = {
        key: k,
        label: meta.label,
        amount,
        unit: meta.unit,
        target: meta.target,
        pct,
        status: pct >= 90 && pct <= 150 ? "ok" : pct >= 50 ? "mid" : "low",
      };
      // Sodium: lower is better past target
      if (k === "sodium_mg") {
        breakdown[k].status = pct <= 100 ? "ok" : pct <= 130 ? "mid" : "high";
      }
    });
    return { totals, breakdown };
  }

  function shoppingPlanDays(cadence, daysPerWeek) {
    const d = Number(daysPerWeek) || 7;
    if (cadence === "every_other_week") return d * 2;
    if (cadence === "monthly") return d * 4;
    return d; // weekly
  }

  function roundBuyQty(key, qty) {
    const unit = FOOD[key] ? FOOD[key].unit : "unit";
    if (unit === "oz") return Math.ceil(qty);
    if (unit === "cup") {
      // round up to quarter cups, min 0.25
      return Math.max(0.25, Math.ceil(qty * 4) / 4);
    }
    if (unit === "tsp") return Math.ceil(qty);
    if (unit === "tbsp") return Math.ceil(qty * 2) / 2;
    if (unit === "scoop") return Math.ceil(qty * 2) / 2;
    if (unit === "medium" || unit === "egg" || unit === "white") return Math.ceil(qty);
    return Math.ceil(qty * 4) / 4;
  }

  function formatBuyQty(key, qty) {
    const unit = FOOD[key] ? FOOD[key].unit : "unit";
    return formatQty(qty) + " " + unit;
  }

  /**
   * Grocery list for shopping window = cadence × days/week.
   * Uses lookupPrice() (Walmart-style estimates; API-ready).
   */
  function buildGroceryList(schedule, answers) {
    const daysPerWeek =
      (Array.isArray(answers.selectedDays) && answers.selectedDays.length) ||
      Number(answers.daysPerWeek) ||
      7;
    const planDays = shoppingPlanDays(answers.cadence, daysPerWeek);
    const tier = budgetTier(answers.budget);
    const agg = {};
    for (const slot of schedule) {
      for (const ing of slot.suggestion.ingredients) {
        if (ing._note || !ing._key || !FOOD[ing._key]) continue;
        if (!agg[ing._key]) agg[ing._key] = 0;
        agg[ing._key] += (ing._qty || 0) * planDays;
      }
    }

    const items = [];
    let grandTotal = 0;
    Object.keys(agg)
      .sort()
      .forEach((key) => {
        const rawQty = agg[key];
        const buyQty = roundBuyQty(key, rawQty);
        const price = lookupPrice(key);
        // Package-friendly: buy enough packages to cover buyQty
        const packagesNeeded = Math.max(1, Math.ceil(buyQty / price.packageQty));
        const lineTotal = Math.round(packagesNeeded * price.packagePrice * 100) / 100;
        const unitPrice = Math.round(price.unitPrice * 1000) / 1000;
        grandTotal += lineTotal;
        items.push({
          key,
          name: price.product || FOOD[key].name,
          foodName: FOOD[key].name,
          qty: buyQty,
          qtyLabel: formatBuyQty(key, buyQty),
          unit: FOOD[key].unit,
          unitPrice,
          packagePrice: price.packagePrice,
          packageQty: price.packageQty,
          packages: packagesNeeded,
          lineTotal,
          estimated: true,
        });
      });

    grandTotal = Math.round(grandTotal * 100) / 100;
    const budget = Number(answers.budget) || 0;
    let monthlyEstimate = grandTotal;
    let monthlyFactor = 1;
    if (answers.cadence === "weekly") {
      monthlyFactor = 4.3;
      monthlyEstimate = Math.round(grandTotal * 4.3 * 100) / 100;
    } else if (answers.cadence === "every_other_week") {
      monthlyFactor = 2.15;
      monthlyEstimate = Math.round(grandTotal * 2.15 * 100) / 100;
    }
    const overBudget = budget > 0 && monthlyEstimate > budget;
    const cadenceLabel =
      answers.cadence === "every_other_week"
        ? "every other week"
        : answers.cadence || "weekly";

    return {
      planDays,
      cadence: answers.cadence,
      cadenceLabel,
      daysPerWeek,
      items,
      grandTotal,
      monthlyEstimate,
      monthlyFactor,
      budget,
      overBudget,
      priceNote: "Estimated Walmart prices (API not connected yet)" +
        (tier.id === "low"
          ? " · budget: non-organic & cheaper staples"
          : tier.id === "high"
            ? " · budget: full produce variety"
            : " · budget: mid tier"),
    };
  }

    function evaluateCompliance(plan) {
    const actual = plan.actual;
    const target = plan.daily;
    const calOk = Math.abs(actual.kcal - target.calories) <= 100;
    const pct = macroPercents(actual);
    const pOk = Math.abs(pct.p - target.macros.p) <= 2;
    const cOk = Math.abs(pct.c - target.macros.c) <= 2;
    const fOk = Math.abs(pct.f - target.macros.f) <= 2;
    const mealCals = plan.schedule.filter((s) => s.kind === "meal").map((s) => s.suggestion.totals.kcal);
    const snackCals = plan.schedule.filter((s) => s.kind === "snack").map((s) => s.suggestion.totals.kcal);
    let mealsEven = true;
    if (mealCals.length >= 2) {
      const avg = mealCals.reduce((a, b) => a + b, 0) / mealCals.length;
      mealsEven = mealCals.every((c) => Math.abs(c - avg) <= 150);
    }
    let snacksEven = true;
    if (snackCals.length >= 2) {
      const avg = snackCals.reduce((a, b) => a + b, 0) / snackCals.length;
      snacksEven = snackCals.every((c) => Math.abs(c - avg) <= 75);
    }
    let snacksHalf = true;
    if (mealCals.length && snackCals.length) {
      const mealAvg = mealCals.reduce((a, b) => a + b, 0) / mealCals.length;
      snacksHalf = snackCals.every((c) => Math.abs(c - mealAvg / 2) <= 100);
    }
    return {
      calOk,
      pOk,
      cOk,
      fOk,
      macrosOk: pOk && cOk && fOk,
      mealsEven,
      snacksEven,
      snacksHalf,
      actualPct: pct,
      withinTolerances: calOk && pOk && cOk && fOk,
    };
  }

  function buildPlan(answers, options) {
    options = options || {};
    const variant = Math.max(0, Number(options.variant) || 0);
    let calories = answers.calories;
    if (answers.calorieMode === "help") {
      calories = estimateCalories(answers.weightLbs, answers.weightGoal, answers.activity);
    }
    let macro;
    if (answers.macros === "custom" && answers.customMacros) {
      macro = answers.customMacros;
    } else if (typeof answers.macros === "string") {
      macro = MACRO_PRESETS[answers.macros] || MACRO_PRESETS.maintenance;
    } else {
      macro = answers.macros || MACRO_PRESETS.maintenance;
    }

    let meals = answers.meals;
    let snacks = answers.snacks;
    if (answers.mealOption && MEAL_OPTIONS[answers.mealOption]) {
      meals = MEAL_OPTIONS[answers.mealOption].meals;
      snacks = MEAL_OPTIONS[answers.mealOption].snacks;
    }

    const macroPct = { p: macro.p, c: macro.c, f: macro.f };
    const dailyGrams = gramsFromPct(calories, macroPct);
    const schedule = assignSuggestions(
      buildSchedule(calories, meals, snacks),
      macroPct,
      calories,
      variant,
      { budget: answers.budget }
    );

    const actualRaw = schedule.reduce(
      (a, s) => ({
        kcal: a.kcal + s.suggestion.totals.kcal,
        p: a.p + s.suggestion.totals.p,
        c: a.c + s.suggestion.totals.c,
        f: a.f + s.suggestion.totals.f,
      }),
      { kcal: 0, p: 0, c: 0, f: 0 }
    );
    const actual = roundMacros(actualRaw);

    const selectedDays = Array.isArray(answers.selectedDays) ? answers.selectedDays.slice() : [];
    const daysPerWeek = selectedDays.length || Number(answers.daysPerWeek) || 0;
    const tier = budgetTier(answers.budget);
    const plan = {
      variant,
      budget: answers.budget,
      budgetTier: tier,
      cadence: answers.cadence,
      selectedDays,
      daysPerWeek,
      daily: {
        calories,
        macros: macroPct,
        protein_g: dailyGrams.p,
        carbs_g: dailyGrams.c,
        fat_g: dailyGrams.f,
      },
      schedule,
      actual,
    };
    plan.compliance = evaluateCompliance(plan);
    plan.micros = aggregateDayMicros(schedule);
    plan.grocery = buildGroceryList(schedule, answers);
    return plan;
  }


  function recomputePlanFromSchedule(answers, schedule, variant) {
    const calories =
      answers.calorieMode === "help"
        ? estimateCalories(answers.weightLbs, answers.weightGoal, answers.activity)
        : answers.calories;
    const macro =
      answers.macros === "custom" && answers.customMacros ? answers.customMacros : (typeof answers.macros === "string" ? (MACRO_PRESETS[answers.macros] || MACRO_PRESETS.maintenance) : (answers.macros || MACRO_PRESETS.maintenance));
    const macroPct = { p: macro.p, c: macro.c, f: macro.f };
    const dailyGrams = gramsFromPct(calories, macroPct);
    const actualRaw = schedule.reduce(
      (a, s) => ({
        kcal: a.kcal + s.suggestion.totals.kcal,
        p: a.p + s.suggestion.totals.p,
        c: a.c + s.suggestion.totals.c,
        f: a.f + s.suggestion.totals.f,
      }),
      { kcal: 0, p: 0, c: 0, f: 0 }
    );
    const actual = roundMacros(actualRaw);
    const selectedDays = Array.isArray(answers.selectedDays) ? answers.selectedDays.slice() : [];
    const daysPerWeek = selectedDays.length || Number(answers.daysPerWeek) || 0;
    const tier = budgetTier(answers.budget);
    const plan = {
      variant: variant || 0,
      budget: answers.budget,
      budgetTier: tier,
      cadence: answers.cadence,
      selectedDays,
      daysPerWeek,
      daily: {
        calories,
        macros: macroPct,
        protein_g: dailyGrams.p,
        carbs_g: dailyGrams.c,
        fat_g: dailyGrams.f,
      },
      schedule,
      actual,
      _slotVariants: answers._slotVariants ? answers._slotVariants.slice() : [],
    };
    plan.compliance = evaluateCompliance(plan);
    plan.micros = aggregateDayMicros(schedule);
    plan.grocery = buildGroceryList(schedule, answers);
    return plan;
  }

  /** Reroll a single meal/snack slot; keep others. Best-effort day tolerances. */
  function rerollSlot(currentPlan, answers, slotIndex, fromVariant) {
    const base = Math.max(0, Number(fromVariant) || 0);
    const prevTitle =
      currentPlan.schedule[slotIndex] &&
      currentPlan.schedule[slotIndex].suggestion &&
      currentPlan.schedule[slotIndex].suggestion.title;
    let best = null;
    let bestDifferent = null;
    const slotVariants = (answers._slotVariants || currentPlan._slotVariants || []).slice();
    for (let i = 1; i <= 24; i++) {
      const trialVariant = base + i + slotIndex * 3;
      const trial = buildPlan(answers, { variant: trialVariant });
      if (!trial.schedule[slotIndex]) continue;
      const newTitle = trial.schedule[slotIndex].suggestion.title;
      const schedule = currentPlan.schedule.map((s, j) =>
        j === slotIndex ? trial.schedule[slotIndex] : s
      );
      const nextVariants = slotVariants.slice();
      nextVariants[slotIndex] = trialVariant;
      const rebuilt = recomputePlanFromSchedule(answers, schedule, trialVariant);
      rebuilt._slotVariants = nextVariants;
      const calDelta = Math.abs(rebuilt.actual.kcal - rebuilt.daily.calories);
      const score = (rebuilt.compliance.withinTolerances ? 0 : 1000) + calDelta;
      if (!best || score < best._score) {
        best = rebuilt;
        best._score = score;
      }
      if (newTitle !== prevTitle) {
        if (!bestDifferent || score < bestDifferent._score) {
          bestDifferent = rebuilt;
          bestDifferent._score = score;
        }
        // Prefer a different title that stays within (or close to) tolerances
        if (rebuilt.compliance.withinTolerances || calDelta <= 150) {
          answers._slotVariants = nextVariants;
          return rebuilt;
        }
      } else if (rebuilt.compliance.withinTolerances && !bestDifferent) {
        // keep searching for a title change
      }
    }
    const chosen = bestDifferent || best || currentPlan;
    if (chosen._slotVariants) answers._slotVariants = chosen._slotVariants.slice();
    return chosen;
  }


  function nutritionOverview(plan) {
    const bd = (plan.micros && plan.micros.breakdown) || {};
    const keys = MICRO_KEYS.filter((k) => k !== "sodium_mg");
    const scores = keys.map((k) => {
      const pct = bd[k] ? bd[k].pct : 0;
      // Ideal ~100%; score decays away from 100, capped
      const diff = Math.abs(pct - 100);
      if (diff <= 20) return 1;
      if (diff <= 40) return 0.75;
      if (diff <= 60) return 0.5;
      if (pct >= 40) return 0.35;
      return 0.15;
    });
    const sodium = bd.sodium_mg ? bd.sodium_mg.pct : 100;
    // Sodium: at or under target is good
    let sodiumScore = 1;
    if (sodium > 130) sodiumScore = 0.3;
    else if (sodium > 100) sodiumScore = 0.6;
    const avg = (scores.reduce((a, b) => a + b, 0) + sodiumScore) / (scores.length + 1);
    const stars = Math.max(1, Math.min(5, Math.round(avg * 5 * 10) / 10));
    const starInt = Math.round(stars);

    const highlights = [];
    const fiber = bd.fiber_g;
    if (fiber && fiber.pct >= 80) {
      highlights.push("Solid fiber from oats, produce, and beans supports digestion and steady energy.");
    }
    const pot = bd.potassium_mg;
    if (pot && pot.pct >= 70) {
      highlights.push("Potassium-rich fruit and vegetables help round out the day’s electrolyte picture.");
    }
    const vitC = bd.vitC_mg;
    if (vitC && vitC.pct >= 80) {
      highlights.push("Vitamin C from fruit and veg is in a strong range for daily immune support.");
    }
    const iron = bd.iron_mg;
    if (iron && iron.pct >= 70) {
      highlights.push("Iron from lean proteins and greens helps cover a key micronutrient for energy.");
    }
    const cal = bd.calcium_mg;
    if (cal && cal.pct >= 70) {
      highlights.push("Dairy or fortified options in the plan contribute meaningful calcium.");
    }
    if (!highlights.length) {
      highlights.push("This plan balances macros while covering a spread of produce and proteins for micronutrient variety.");
    }
    // Prefer 2 short sentences
    const blurb = highlights.slice(0, 2).join(" ");
    return { stars: starInt, starsExact: stars, blurb };
  }

  /* ── UI ── */

  function createOnboarding(root) {
    const answers = {
      budget: null,
      cadence: null,
      calorieMode: null,
      calories: null,
      weightLbs: null,
      weightGoal: null,
      activity: null,
      macros: "maintenance",
      customMacros: null,
      mealOption: null,
      meals: 3,
      snacks: 0,
      daysPerWeek: null,
      selectedDays: [],
    };
    let step = 0;
    let planVariant = 0;

    function steps() {
      const list = ["budget", "cadence", "calorieMode"];
      if (answers.calorieMode === "known") list.push("calories");
      if (answers.calorieMode === "help") list.push("calorieHelp");
      list.push("macros");
      if (answers.macros === "custom") list.push("macrosCustom");
      list.push("meals");
      list.push("daysPerWeek");
      return list;
    }

    function el(html) {
      const d = document.createElement("div");
      d.innerHTML = html.trim();
      return d.firstElementChild;
    }

    function clear() {
      root.innerHTML = "";
    }

    function progressBar(current, total) {
      const pct = Math.round(((current + 1) / Math.max(total, 1)) * 100);
      return el(`<div class="mp-progress"><span style="width:${pct}%"></span></div>`);
    }

    function selectedRadio(name) {
      const n = root.querySelector(`input[name="${name}"]:checked`);
      return n ? n.value : null;
    }

    function radioGroup(name, options, selected) {
      const box = el(`<div class="mp-options"></div>`);
      options.forEach(({ value, label }) => {
        const row = el(
          `<label class="mp-option${selected === value ? " selected" : ""}">
            <input type="radio" name="${name}" value="${value}" ${selected === value ? "checked" : ""} />
            <span>${label}</span>
          </label>`
        );
        row.addEventListener("click", () => {
          box.querySelectorAll(".mp-option").forEach((n) =>
            n.classList.toggle("selected", n.querySelector("input").value === value)
          );
        });
        box.appendChild(row);
      });
      return box;
    }

    function focusFirst() {
      const input = root.querySelector("input:not([type=radio]), select, input[type=radio]");
      if (input) {
        try {
          input.focus();
        } catch (_) {}
      }
    }

    function ask(title, body, onNext, nextLabel) {
      clear();
      const path = steps();
      root.appendChild(progressBar(step, path.length));
      const wrap = el(`<section class="mp-step"></section>`);
      wrap.appendChild(el(`<div class="step-label">Question ${step + 1} of ${path.length}</div>`));
      wrap.appendChild(el(`<h2 class="mp-q">${title}</h2>`));
      wrap.appendChild(body);
      const err = el(`<p class="mp-error" hidden></p>`);
      wrap.appendChild(err);
      const nav = el(`<div class="mp-nav"></div>`);
      const back = el(`<button type="button" class="mp-back">Back</button>`);
      back.disabled = step === 0;
      back.onclick = () => {
        if (step > 0) {
          step -= 1;
          render();
        }
      };
      const next = el(`<button type="button" class="mp-next">${nextLabel || "Next"}</button>`);
      function goNext() {
        const msg = onNext();
        if (msg) {
          err.hidden = false;
          err.textContent = msg;
          return;
        }
        const id = steps()[step];
        const refreshed = steps();
        const idx = refreshed.indexOf(id);
        if (idx + 1 >= refreshed.length) {
          showResult();
          return;
        }
        step = idx + 1;
        render();
      }
      next.onclick = goNext;
      const dash = el(`<button type="button" class="mp-back" id="dashLink">Dashboard</button>`);
      dash.onclick = () => {
        root.dispatchEvent(
          new CustomEvent("pureprep-goto", { detail: { screen: "home", save: false }, bubbles: true })
        );
      };
      nav.appendChild(back);
      nav.appendChild(dash);
      nav.appendChild(next);
      wrap.appendChild(nav);
      root.appendChild(wrap);

      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault();
          goNext();
        }
      });
      setTimeout(focusFirst, 0);
    }

    function render() {
      const id = steps()[step];

      if (id === "budget") {
        ask(
          "What is your monthly grocery budget?",
          el(
            `<div>
              <input class="mp-input" id="budget" type="number" min="1" step="1"
                placeholder="e.g. 400" value="${answers.budget ?? ""}" />
              <p class="mp-hint">USD per month</p>
            </div>`
          ),
          () => {
            const v = Number(root.querySelector("#budget").value);
            if (!v || v <= 0) return "Enter a monthly budget in USD.";
            answers.budget = v;
          }
        );
      }

      if (id === "cadence") {
        ask(
          "How often do you prefer to order groceries?",
          radioGroup(
            "cadence",
            [
              { value: "weekly", label: "Weekly" },
              { value: "every_other_week", label: "Every other week" },
              { value: "monthly", label: "Monthly" },
            ],
            answers.cadence
          ),
          () => {
            const v = selectedRadio("cadence");
            if (!v) return "Pick one option.";
            answers.cadence = v;
          }
        );
      }

      if (id === "calorieMode") {
        ask(
          "What is your daily caloric goal?",
          radioGroup(
            "calorieMode",
            [
              { value: "known", label: "I know my daily caloric goal" },
              { value: "help", label: "Help me find out" },
            ],
            answers.calorieMode
          ),
          () => {
            const v = selectedRadio("calorieMode");
            if (!v) return "Pick one option.";
            answers.calorieMode = v;
          }
        );
      }

      if (id === "calories") {
        ask(
          "Enter your daily caloric goal",
          el(
            `<div>
              <input class="mp-input" id="calories" type="number" min="800" max="10000" step="10"
                placeholder="e.g. 2400" value="${answers.calories ?? ""}" />
              <p class="mp-hint">Calories per day</p>
            </div>`
          ),
          () => {
            const v = Number(root.querySelector("#calories").value);
            if (!v || v < 800) return "Enter at least 800 calories.";
            answers.calories = v;
          }
        );
      }

      if (id === "calorieHelp") {
        const body = el(
          `<div>
            <label class="mp-label">Weight (lbs)</label>
            <input class="mp-input" id="weightLbs" type="number" min="50" max="800" step="0.1"
              value="${answers.weightLbs ?? ""}" />
            <label class="mp-label">Weight goal</label>
            <select class="mp-input" id="weightGoal">
              <option value="">Select…</option>
              <option value="lose">Lose</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Gain</option>
            </select>
            <label class="mp-label">Activity level</label>
            <select class="mp-input" id="activity">
              <option value="">Select…</option>
              <option value="sedentary">Sedentary (~12 kcal/lb)</option>
              <option value="light">Lightly active (~13.5)</option>
              <option value="moderate">Moderately active (~15)</option>
              <option value="active">Active (~17)</option>
              <option value="very_active">Very active (~19)</option>
            </select>
            <p class="mp-hint">Estimate: weight × activity factor; lose −500, gain +300, maintain 0. Rounded to nearest 50.</p>
          </div>`
        );
        if (answers.weightGoal) body.querySelector("#weightGoal").value = answers.weightGoal;
        if (answers.activity) body.querySelector("#activity").value = answers.activity;
        ask("Help me find out", body, () => {
          const weightLbs = Number(root.querySelector("#weightLbs").value);
          const weightGoal = root.querySelector("#weightGoal").value;
          const activity = root.querySelector("#activity").value;
          if (!weightLbs || !weightGoal || !activity) {
            return "Fill in weight, weight goal, and activity.";
          }
          answers.weightLbs = weightLbs;
          answers.weightGoal = weightGoal;
          answers.activity = activity;
          answers.calories = estimateCalories(weightLbs, weightGoal, activity);
        });
      }

      if (id === "macros") {
        const macroOpts = Object.entries(MACRO_PRESETS).map(([value, m]) => ({ value, label: m.label }));
        macroOpts.push({ value: "custom", label: "Custom" });
        ask(
          "What are your macronutrient targets?",
          radioGroup("macros", macroOpts, answers.macros || "maintenance"),
          () => {
            const v = selectedRadio("macros");
            if (!v) return "Pick a macro option.";
            answers.macros = v;
          }
        );
      }

      if (id === "macrosCustom") {
        const cm = answers.customMacros || { p: 30, c: 40, f: 30 };
        ask(
          "Custom macronutrient targets",
          el(
            `<div class="mp-row">
              <div>
                <label class="mp-label">Protein %</label>
                <input class="mp-input" id="customP" type="number" min="10" max="60" value="${cm.p}" />
              </div>
              <div>
                <label class="mp-label">Carbs %</label>
                <input class="mp-input" id="customC" type="number" min="10" max="70" value="${cm.c}" />
              </div>
              <div>
                <label class="mp-label">Fat %</label>
                <input class="mp-input" id="customF" type="number" min="10" max="60" value="${cm.f}" />
              </div>
            </div>
            <p class="mp-hint">Percentages should add up to 100.</p>`
          ),
          () => {
            const p = Number(root.querySelector("#customP").value);
            const c = Number(root.querySelector("#customC").value);
            const f = Number(root.querySelector("#customF").value);
            if (![p, c, f].every((n) => n > 0)) return "Enter protein, carbs, and fat percentages.";
            if (Math.abs(p + c + f - 100) > 1) return "Macros must add up to about 100%.";
            answers.customMacros = { p, c, f, label: p + " p | " + c + " c | " + f + " f (custom)" };
          }
        );
      }

      if (id === "meals") {
        ask(
          "How many meals do you like per day?",
          radioGroup(
            "meals",
            Object.entries(MEAL_OPTIONS).map(([value, m]) => ({ value, label: m.label })),
            answers.mealOption
          ),
          () => {
            const v = selectedRadio("meals");
            if (!v) return "Pick a meal structure.";
            answers.mealOption = v;
            answers.meals = MEAL_OPTIONS[v].meals;
            answers.snacks = MEAL_OPTIONS[v].snacks;
          }
        );
      }

      if (id === "daysPerWeek") {
        const selected = new Set(answers.selectedDays || []);
        const box = el(`<div class="mp-options mp-days"></div>`);
        DAYS_OF_WEEK.forEach((d) => {
          const on = selected.has(d.id);
          const row = el(
            `<label class="mp-option${on ? " selected" : ""}">
              <input type="checkbox" name="planDay" value="${d.id}" ${on ? "checked" : ""} />
              <span>${d.label}</span>
            </label>`
          );
          row.addEventListener("click", (e) => {
            // let checkbox toggle; sync selected class
            setTimeout(() => {
              const inp = row.querySelector("input");
              row.classList.toggle("selected", inp.checked);
            }, 0);
          });
          box.appendChild(row);
        });
        ask(
          "Which days of the week will you follow your plan?",
          box,
          () => {
            const checked = Array.from(root.querySelectorAll('input[name="planDay"]:checked')).map(
              (n) => n.value
            );
            if (!checked.length) return "Select at least one day.";
            answers.selectedDays = checked;
            answers.daysPerWeek = checked.length;
          },
          "See my plan"
        );
      }
    }

    function badge(ok, label) {
      return `<span class="mp-badge ${ok ? "ok" : "warn"}">${ok ? "✓" : "~"} ${label}</span>`;
    }

    function showResult() {
      const plan = answers.__lockedPlan || buildPlan(answers, { variant: planVariant });
      answers.__lockedPlan = null;
      clear();
      root.appendChild(progressBar(steps().length - 1, steps().length));

      const cadence = {
        weekly: "weekly",
        every_other_week: "every other week",
        monthly: "monthly",
      }[plan.cadence];

      const c = plan.compliance;
      const g = plan.grocery;
      const overview = nutritionOverview(plan);
      const starStr = "★".repeat(overview.stars) + "☆".repeat(5 - overview.stars);
      const microPies = MICRO_KEYS.map((k) => {
        const m = plan.micros.breakdown[k];
        const pct = Math.min(100, Math.max(0, m.pct));
        const pie = "conic-gradient(var(--moss) 0 " + pct + "%, var(--linen) " + pct + "% 100%)";
        const sodiumNote = k === "sodium_mg"
          ? `<p class="mp-micro-note">Does not include added salt/seasoning</p>`
          : "";
        return `<div class="mp-micro-pie-card" data-micro="${k}">
          <div class="mp-micro-pie" style="background:${pie}"><span>${m.pct}%</span></div>
          <div class="mp-micro-pie-label">${m.label}</div>
          ${sodiumNote}
        </div>`;
      }).join("");
      const microBars = MICRO_KEYS.map((k) => {
        const m = plan.micros.breakdown[k];
        const pctW = Math.min(100, Math.max(0, m.pct));
        const barCls = m.status === "ok" ? "ok" : m.status === "mid" ? "mid" : m.status === "high" ? "high" : "low";
        const sodiumNote = k === "sodium_mg"
          ? `<p class="mp-micro-note">Does not include added salt/seasoning</p>`
          : "";
        return `<div class="mp-micro-row">
          <div class="mp-micro-meta">
            <span class="mp-micro-label">${m.label}</span>
            <span class="mp-micro-amt">${m.amount}${m.unit} · ${m.pct}% of ${m.target}${m.unit}</span>
            ${sodiumNote}
          </div>
          <div class="mp-micro-bar"><span class="${barCls}" style="width:${pctW}%"></span></div>
          <span class="mp-badge ${m.status === "ok" ? "ok" : "warn"}">${m.pct}%</span>
        </div>`;
      }).join("");

      const groceryRows = g.items
        .map(
          (it) =>
            `<li>
              <span class="ing-name">${it.name}<small class="mp-buy-qty"> · buy ${it.qtyLabel} (${it.packages} pkg)</small></span>
              <span class="ing-macros">$${it.unitPrice.toFixed(2)}/${it.unit} · <strong>$${it.lineTotal.toFixed(2)}</strong></span>
            </li>`
        )
        .join("");

      const budgetBadge = g.overBudget
        ? `<span class="mp-badge warn">Over monthly budget (est. $${g.monthlyEstimate.toFixed(2)} vs $${g.budget})</span>`
        : `<span class="mp-badge ok">Within monthly budget (est. $${g.monthlyEstimate.toFixed(2)} vs $${g.budget})</span>`;

      const section = el(`<section class="mp-result"></section>`);
      section.innerHTML = `
        <h2>Daily targets</h2>
        <div class="mp-goal">
          <div class="mp-cals">${plan.daily.calories} cals</div>
          <div class="mp-macros">
            ${plan.daily.protein_g}g protein · ${plan.daily.carbs_g}g carbs · ${plan.daily.fat_g}g fat
            <br/>
            (${plan.daily.macros.p}% p / ${plan.daily.macros.c}% c / ${plan.daily.macros.f}% f)
          </div>
        </div>
        <div class="mp-goal mp-actual">
          <div class="mp-cals-sm">Day actual: ${plan.actual.kcal} kcal · ${plan.actual.p}p / ${plan.actual.c}c / ${plan.actual.f}f</div>
          <div class="mp-macros">
            Split ${c.actualPct.p}% p / ${c.actualPct.c}% c / ${c.actualPct.f}% f
            (target ${plan.daily.macros.p}/${plan.daily.macros.c}/${plan.daily.macros.f})
          </div>
          <div class="mp-badges">
            ${badge(c.calOk, "±100 cal")}
            ${badge(c.pOk, "P ±2%")}
            ${badge(c.cOk, "C ±2%")}
            ${badge(c.fOk, "F ±2%")}
          </div>
        </div>
        <p class="mp-hint">$${plan.budget}/mo · shop ${cadence} · ${plan.daysPerWeek} days/week${plan.selectedDays && plan.selectedDays.length ? " (" + plan.selectedDays.map(function(d){ var x = DAYS_OF_WEEK.find(function(z){return z.id===d}); return x?x.short:d; }).join(", ") + ")" : ""}. Budget tier: ${plan.budgetTier ? plan.budgetTier.label : "—"}. Snacks ≈ half a meal (±75); meals within ±150.</p>
        <h2>Meals &amp; snacks</h2>
        <div class="mp-slots"></div>
        <h2>Nutrition overview</h2>
        <div class="mp-goal mp-nutrition-overview">
          <div class="mp-stars" aria-label="${overview.stars} out of 5 stars">${starStr}</div>
          <p class="mp-overview-blurb">${overview.blurb}</p>
        </div>
        <h2>Micronutrients</h2>
        <p class="mp-hint">Each chart shows % of suggested daily intake. Expand for the full breakdown.</p>
        <div class="mp-micro-pies">${microPies}</div>
        <details class="mp-micro-expand">
          <summary>Full micronutrient breakdown</summary>
          <div class="mp-micros">${microBars}</div>
        </details>
        <h2>Grocery list</h2>
        <p class="mp-hint">${g.priceNote} · shopping window: <strong>${g.planDays} plan-days</strong> (${g.cadenceLabel} × ${g.daysPerWeek} days/week)</p>
        <div class="mp-card mp-grocery">
          <ul class="mp-ingredients mp-grocery-list">
            ${groceryRows}
            <li class="totals">
              <span class="ing-name">Grand total</span>
              <span class="ing-macros">$${g.grandTotal.toFixed(2)}</span>
            </li>
          </ul>
          <div class="mp-badges" style="margin-top:10px">
            ${budgetBadge}
            <span class="mp-badge ${g.overBudget ? "warn" : "ok"}">Monthly est. ×${g.monthlyFactor}</span>
          </div>
        </div>
        <div class="mp-nav">
          <button type="button" class="mp-reroll" id="reroll">Reroll meals</button>
          <button type="button" class="mp-next" id="restart">Restart</button>
        </div>`;

      let currentPlan = plan;
      const slotsEl = section.querySelector(".mp-slots");
      plan.schedule.forEach((slot, slotIndex) => {
        const s = slot.suggestion;
        const t = s.totals;
        const lis = s.ingredients
          .map((ing) => {
            const p = Math.round(ing.p);
            const c = Math.round(ing.c);
            const f = Math.round(ing.f);
            return `<li><span class="ing-name">${ing.label}</span><span class="ing-macros">${ing.kcal} kcal · ${p}p / ${c}c / ${f}f</span></li>`;
          })
          .join("");
        const noteHtml = (s.notes || [])
          .map((n) => `<p class="mp-note">${n}</p>`)
          .join("");
        const card = el(
          `<article class="mp-card" data-slot-index="${slotIndex}">
            <header class="mp-card-head">
              <div>
                <strong>${slot.name}: ${t.kcal} cal</strong>
                <span class="mp-suggest"> — ${s.title}</span>
              </div>
              <button type="button" class="mp-reroll mp-reroll-slot" data-slot="${slotIndex}">Reroll</button>
            </header>
            <ul class="mp-ingredients">
              ${lis}
              <li class="totals">
                <span class="ing-name">Meal total</span>
                <span class="ing-macros">${t.kcal} kcal · ${t.p}p / ${t.c}c / ${t.f}f</span>
              </li>
            </ul>
            ${noteHtml}
          </article>`
        );
        slotsEl.appendChild(card);
      });

      const nav = section.querySelector(".mp-nav");
      nav.innerHTML = `
          <button type="button" class="mp-back" id="toDash">← Dashboard</button>
          <button type="button" class="mp-reroll" id="reroll">Reroll all meals</button>
          <button type="button" class="mp-next" id="saveClose">Save &amp; close</button>`;

      root.appendChild(section);

      function finishToDashboard() {
        const detail = {
          plan: currentPlan,
          answers: Object.assign({}, answers),
          save: true,
        };
        root.dispatchEvent(new CustomEvent("onboarding-complete", { detail, bubbles: true }));
        root.dispatchEvent(
          new CustomEvent("pureprep-goto", {
            detail: { screen: "home", save: true, plan: currentPlan, answers: Object.assign({}, answers) },
            bubbles: true,
          })
        );
      }

      section.querySelectorAll(".mp-reroll-slot").forEach((btn) => {
        btn.onclick = () => {
          const idx = Number(btn.getAttribute("data-slot"));
          const from =
            (currentPlan._slotVariants && currentPlan._slotVariants[idx]) || planVariant;
          currentPlan = rerollSlot(currentPlan, answers, idx, from);
          planVariant = currentPlan.variant || planVariant;
          // Re-render by temporarily swapping buildPlan path: stash and redraw
          answers.__lockedPlan = currentPlan;
          showResult();
        };
      });

      section.querySelector("#reroll").onclick = () => {
        answers.__lockedPlan = null;
        const start = planVariant + 1;
        let chosen = start;
        for (let i = 0; i < 12; i++) {
          const trial = buildPlan(answers, { variant: start + i });
          chosen = start + i;
          if (trial.compliance.withinTolerances) break;
        }
        planVariant = chosen;
        showResult();
      };
      section.querySelector("#saveClose").onclick = finishToDashboard;
      section.querySelector("#toDash").onclick = finishToDashboard;
    }

    render();
    return {
      getAnswers: () => Object.assign({}, answers),
      buildPlan: (opts) => buildPlan(answers, opts),
      reroll: () => {
        planVariant += 1;
        showResult();
      },
    };
  }

  global.MealPlanOnboarding = {
    MACRO_PRESETS,
    MEAL_OPTIONS,
    ACTIVITY_FACTOR,
    FOOD,
    MICRO_TARGETS,
    MICRO_KEYS,
    PRICE_CATALOG,
    UNIT_GRAMS,
    DAYS_OF_WEEK,
    estimateCalories,
    buildSchedule,
    buildPlan,
    gramsFromPct,
    createOnboarding,
    evaluateCompliance,
    lookupPrice,
    aggregateDayMicros,
    nutritionOverview,
    buildGroceryList,
    shoppingPlanDays,
    budgetTier,
    rerollSlot,
    recomputePlanFromSchedule,
    buildSaladJarSlot,
    buildHbEggSnack,
    formatCupQty,
    snapCupFraction,
  };
})(typeof window !== "undefined" ? window : globalThis);
