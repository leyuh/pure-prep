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
    loss: { p: 33, c: 42, f: 25, label: "33 p | 42 c | 25 f (weight loss)" },
    maintenance: { p: 28, c: 42, f: 30, label: "28 p | 42 c | 30 f (weight maintenance)" },
    gain: { p: 25, c: 45, f: 30, label: "25 p | 45 c | 30 f (weight gain)" },
  };

  /** Map questionnaire weightGoal → macro preset (default maintain). */
  function macrosFromWeightGoal(weightGoal) {
    const map = { lose: "loss", maintain: "maintenance", gain: "gain" };
    const key = map[weightGoal] || "maintenance";
    return MACRO_PRESETS[key] || MACRO_PRESETS.maintenance;
  }

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
    "magnesium_mg",
    "zinc_mg",
    "phosphorus_mg",
    "selenium_mcg",
    "copper_mg",
    "manganese_mg",
    "vitA_mcg",
    "vitC_mg",
    "vitD_mcg",
    "vitE_mg",
    "vitK_mcg",
    "thiamin_mg",
    "riboflavin_mg",
    "niacin_mg",
    "vitB6_mg",
    "folate_mcg",
    "vitB12_mcg",
    "choline_mg",
  ];

  /** Adult RDA/DRI / Daily Value style targets (mixed adult) */
  const MICRO_TARGETS = {
    fiber_g: { label: "Fiber", target: 28, unit: "g" },
    sodium_mg: { label: "Sodium", target: 2300, unit: "mg" },
    potassium_mg: { label: "Potassium", target: 3400, unit: "mg" },
    calcium_mg: { label: "Calcium", target: 1000, unit: "mg" },
    iron_mg: { label: "Iron", target: 18, unit: "mg" },
    magnesium_mg: { label: "Magnesium", target: 400, unit: "mg" },
    zinc_mg: { label: "Zinc", target: 11, unit: "mg" },
    phosphorus_mg: { label: "Phosphorus", target: 700, unit: "mg" },
    selenium_mcg: { label: "Selenium", target: 55, unit: "mcg" },
    copper_mg: { label: "Copper", target: 0.9, unit: "mg" },
    manganese_mg: { label: "Manganese", target: 2.3, unit: "mg" },
    vitA_mcg: { label: "Vitamin A", target: 900, unit: "mcg" },
    vitC_mg: { label: "Vitamin C", target: 90, unit: "mg" },
    vitD_mcg: { label: "Vitamin D", target: 20, unit: "mcg" },
    vitE_mg: { label: "Vitamin E", target: 15, unit: "mg" },
    vitK_mcg: { label: "Vitamin K", target: 120, unit: "mcg" },
    thiamin_mg: { label: "Thiamin (B1)", target: 1.2, unit: "mg" },
    riboflavin_mg: { label: "Riboflavin (B2)", target: 1.3, unit: "mg" },
    niacin_mg: { label: "Niacin (B3)", target: 16, unit: "mg" },
    vitB6_mg: { label: "Vitamin B6", target: 1.3, unit: "mg" },
    folate_mcg: { label: "Folate", target: 400, unit: "mcg" },
    vitB12_mcg: { label: "Vitamin B12", target: 2.4, unit: "mcg" },
    choline_mg: { label: "Choline", target: 550, unit: "mg" },
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
    milk_skim_oz: { name: "skim milk", unit: "oz", kcal: 10.6, p: 1.05, c: 1.5, f: 0.05, m: M({ calcium_mg: 38, potassium_mg: 49, sodium_mg: 13, vitA_mcg: 19, vitD_mcg: 0.4, vitB12_mcg: 0.16, magnesium_mg: 3.5, zinc_mg: 0.13, iron_mg: 0.01, phosphorus_mg: 30, riboflavin_mg: 0.05, vitB12_mcg: 0.16}) },
    milk_2pct_oz: { name: "2% milk", unit: "oz", kcal: 15, p: 1, c: 1.5, f: 0.625, m: M({ calcium_mg: 37, potassium_mg: 44, sodium_mg: 14, vitA_mcg: 17, vitD_mcg: 0.4, vitB12_mcg: 0.14, magnesium_mg: 3.4, zinc_mg: 0.12 }) },
    protein_scoop: { name: "protein powder", unit: "scoop", kcal: 120, p: 24, c: 3, f: 1, m: M({ calcium_mg: 120, sodium_mg: 150, potassium_mg: 160, iron_mg: 0.5, magnesium_mg: 20, zinc_mg: 1.5, vitB12_mcg: 0.5, phosphorus_mg: 100, selenium_mcg: 8, choline_mg: 50}) },
    banana: { name: "banana", unit: "medium", kcal: 105, p: 1.3, c: 27, f: 0.4, m: M({ fiber_g: 3.1, potassium_mg: 422, magnesium_mg: 32, vitC_mg: 10.3, vitA_mcg: 3, calcium_mg: 6, iron_mg: 0.3, zinc_mg: 0.2, vitB6_mg: 0.4, folate_mcg: 24, manganese_mg: 0.3, copper_mg: 0.1, choline_mg: 12, thiamin_mg: 0.04, riboflavin_mg: 0.09, niacin_mg: 0.8, phosphorus_mg: 26}) },
    berries_cup: { name: "mixed berries", unit: "cup", kcal: 70, p: 1, c: 17, f: 0.5, m: M({ fiber_g: 6, vitC_mg: 30, vitA_mcg: 8, potassium_mg: 180, calcium_mg: 25, iron_mg: 0.6, magnesium_mg: 15, vitE_mg: 0.8, vitK_mcg: 20, manganese_mg: 0.7, folate_mcg: 25}) },
    blueberries_cup: { name: "blueberries", unit: "cup", kcal: 84, p: 1.1, c: 21, f: 0.5, m: M({ fiber_g: 3.6, vitC_mg: 14, potassium_mg: 114, vitaminK: 0, calcium_mg: 9, iron_mg: 0.4, magnesium_mg: 9 }) },
    strawberries_cup: { name: "strawberries", unit: "cup", kcal: 50, p: 1, c: 12, f: 0.5, m: M({ fiber_g: 3, vitC_mg: 89, potassium_mg: 220, calcium_mg: 24, iron_mg: 0.6, magnesium_mg: 18, vitA_mcg: 1 }) },
    cherries_cup: { name: "frozen cherries", unit: "cup", kcal: 90, p: 1.5, c: 22, f: 0.3, m: M({ fiber_g: 2.5, vitC_mg: 10, potassium_mg: 268, calcium_mg: 18, iron_mg: 0.5, magnesium_mg: 14, vitA_mcg: 19 }) },
    mango_cup: { name: "mango", unit: "cup", kcal: 100, p: 1.4, c: 25, f: 0.6, m: M({ fiber_g: 2.6, vitC_mg: 60, vitA_mcg: 89, potassium_mg: 277, calcium_mg: 18, magnesium_mg: 17, iron_mg: 0.3 }) },
    spinach_cup: { name: "spinach", unit: "cup", kcal: 7, p: 0.9, c: 1.1, f: 0.1, m: M({ fiber_g: 0.7, vitA_mcg: 281, vitC_mg: 8, calcium_mg: 30, iron_mg: 0.8, magnesium_mg: 24, potassium_mg: 167, zinc_mg: 0.2, vitK_mcg: 145, folate_mcg: 58, vitE_mg: 0.6, manganese_mg: 0.3, copper_mg: 0.05, choline_mg: 6, thiamin_mg: 0.03, riboflavin_mg: 0.06, niacin_mg: 0.2, vitB6_mg: 0.06, phosphorus_mg: 15}) },
    oats_cup: { name: "dry oats", unit: "cup", kcal: 300, p: 10, c: 54, f: 6, m: M({ fiber_g: 8, iron_mg: 3.6, magnesium_mg: 110, zinc_mg: 2.9, potassium_mg: 293, calcium_mg: 42, sodium_mg: 2, thiamin_mg: 0.6, phosphorus_mg: 340, manganese_mg: 3.6, selenium_mcg: 24, copper_mg: 0.3, vitE_mg: 0.6, vitB6_mg: 0.1, folate_mcg: 40, choline_mg: 30, riboflavin_mg: 0.1, niacin_mg: 1}) },
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
    beef_oz: { name: "93% lean ground beef (cooked)", unit: "oz", kcal: 48, p: 7, c: 0, f: 2.2, m: M({ iron_mg: 0.7, zinc_mg: 1.5, vitB12_mcg: 0.7, potassium_mg: 90, sodium_mg: 20, magnesium_mg: 6, calcium_mg: 4, vitA_mcg: 1, niacin_mg: 1.5, selenium_mcg: 6, phosphorus_mg: 55, vitB6_mg: 0.1, choline_mg: 20, riboflavin_mg: 0.05}) },
    turkey_oz: { name: "lean ground turkey (cooked)", unit: "oz", kcal: 45, p: 7.2, c: 0, f: 1.8, m: M({ zinc_mg: 0.9, iron_mg: 0.4, vitB12_mcg: 0.4, potassium_mg: 80, sodium_mg: 25, magnesium_mg: 7, calcium_mg: 5 }) },
    chicken_oz: { name: "chicken breast (cooked)", unit: "oz", kcal: 46, p: 8.8, c: 0, f: 1, m: M({ zinc_mg: 0.3, iron_mg: 0.15, vitB12_mcg: 0.1, potassium_mg: 73, sodium_mg: 20, magnesium_mg: 8, calcium_mg: 4, niacin_mg: 3.5, selenium_mcg: 7, phosphorus_mg: 60, vitB6_mg: 0.25, choline_mg: 20, thiamin_mg: 0.02, riboflavin_mg: 0.04, folate_mcg: 1}) },
    chicken_thigh_oz: { name: "chicken thigh (cooked)", unit: "oz", kcal: 55, p: 7.2, c: 0, f: 2.9, m: M({ zinc_mg: 0.5, iron_mg: 0.25, vitB12_mcg: 0.15, potassium_mg: 70, sodium_mg: 25, magnesium_mg: 7, calcium_mg: 4 }) },
    salmon_oz: { name: "salmon fillet (cooked)", unit: "oz", kcal: 59, p: 6.5, c: 0, f: 3.6, m: M({ vitD_mcg: 3.2, vitB12_mcg: 0.9, potassium_mg: 110, sodium_mg: 15, magnesium_mg: 8, zinc_mg: 0.2, iron_mg: 0.15, calcium_mg: 4, vitA_mcg: 10, selenium_mcg: 12, phosphorus_mg: 70, niacin_mg: 2.2, vitB6_mg: 0.2, choline_mg: 25, vitE_mg: 0.3, thiamin_mg: 0.05, riboflavin_mg: 0.05, folate_mcg: 5}) },
    cod_oz: { name: "cod fillet (cooked)", unit: "oz", kcal: 30, p: 6.5, c: 0, f: 0.2, m: M({ vitB12_mcg: 0.3, vitD_mcg: 0.15, potassium_mg: 90, sodium_mg: 25, magnesium_mg: 8, zinc_mg: 0.15, calcium_mg: 5, iron_mg: 0.1 }) },
    shrimp_oz: { name: "shrimp (cooked)", unit: "oz", kcal: 28, p: 6.8, c: 0.2, f: 0.3, m: M({ sodium_mg: 110, potassium_mg: 50, magnesium_mg: 10, zinc_mg: 0.4, iron_mg: 0.2, vitB12_mcg: 0.4, calcium_mg: 15, selenium_mcg: 14, phosphorus_mg: 50, choline_mg: 25, copper_mg: 0.05, vitB12_mcg: 0.4}) },
    lettuce_cup: { name: "lettuce", unit: "cup", kcal: 8, p: 0.6, c: 1.5, f: 0.1, m: M({ fiber_g: 0.7, vitA_mcg: 100, vitC_mg: 3, potassium_mg: 80, calcium_mg: 15, iron_mg: 0.3, magnesium_mg: 5, vitK_mcg: 48, folate_mcg: 38}) },
    kale_cup: { name: "kale", unit: "cup", kcal: 33, p: 2.9, c: 6, f: 0.6, m: M({ fiber_g: 2.4, vitA_mcg: 500, vitC_mg: 80, calcium_mg: 150, potassium_mg: 300, iron_mg: 1, magnesium_mg: 30, vitK_mcg: 547, folate_mcg: 20, vitE_mg: 1, manganese_mg: 0.5, copper_mg: 0.1}) },
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
    quinoa_cup: { name: "cooked quinoa", unit: "cup", kcal: 222, p: 8.1, c: 39.4, f: 3.6, m: M({ fiber_g: 5.2, magnesium_mg: 118, iron_mg: 2.8, zinc_mg: 2, potassium_mg: 318, calcium_mg: 31, phosphorus_mg: 281, folate_mcg: 78, manganese_mg: 1.2 }) },
    broccoli_cup: { name: "broccoli", unit: "cup", kcal: 55, p: 3.7, c: 11, f: 0.6, m: M({ fiber_g: 5.1, vitC_mg: 81, vitA_mcg: 57, calcium_mg: 62, potassium_mg: 457, iron_mg: 1, magnesium_mg: 30, zinc_mg: 0.6, vitK_mcg: 90, folate_mcg: 60, vitE_mg: 0.8, manganese_mg: 0.2, phosphorus_mg: 60, choline_mg: 19, thiamin_mg: 0.07, riboflavin_mg: 0.1, niacin_mg: 0.6, vitB6_mg: 0.2, selenium_mcg: 2.5}) },
    peppers_cup: { name: "bell peppers", unit: "cup", kcal: 30, p: 1, c: 7, f: 0.2, m: M({ fiber_g: 2.5, vitC_mg: 152, vitA_mcg: 117, potassium_mg: 251, calcium_mg: 10, magnesium_mg: 14, iron_mg: 0.5 }) },
    cauliflower_cup: { name: "cauliflower", unit: "cup", kcal: 27, p: 2, c: 5, f: 0.3, m: M({ fiber_g: 2.1, vitC_mg: 51, potassium_mg: 320, calcium_mg: 24, magnesium_mg: 16, iron_mg: 0.4, zinc_mg: 0.3 }) },
    carrots_cup: { name: "carrots", unit: "cup", kcal: 50, p: 1.1, c: 12, f: 0.3, m: M({ fiber_g: 3.6, vitA_mcg: 1069, vitC_mg: 7.6, potassium_mg: 410, calcium_mg: 42, magnesium_mg: 15, iron_mg: 0.4 }) },
    mixed_veg_cup: { name: "mixed vegetables", unit: "cup", kcal: 60, p: 2.5, c: 12, f: 0.5, m: M({ fiber_g: 4, vitA_mcg: 400, vitC_mg: 15, potassium_mg: 280, calcium_mg: 35, iron_mg: 0.8, magnesium_mg: 25 }) },
    asparagus_cup: { name: "asparagus", unit: "cup", kcal: 40, p: 4.3, c: 7.4, f: 0.4, m: M({ fiber_g: 3.6, vitA_mcg: 90, vitC_mg: 10, folate: 0, potassium_mg: 270, calcium_mg: 32, iron_mg: 2, magnesium_mg: 18, zinc_mg: 0.7 }) },
    zucchini_cup: { name: "zucchini", unit: "cup", kcal: 21, p: 1.5, c: 3.9, f: 0.4, m: M({ fiber_g: 1.2, vitC_mg: 22, vitA_mcg: 12, potassium_mg: 325, calcium_mg: 20, magnesium_mg: 22, iron_mg: 0.5, folate_mcg: 30, vitK_mcg: 5 }) },
    evoo_tsp: { name: "extra virgin olive oil", unit: "tsp", kcal: 40, p: 0, c: 0, f: 4.5, m: M({ vitA_mcg: 0 }) },
    almonds_oz: { name: "almonds", unit: "oz", kcal: 164, p: 6, c: 6.1, f: 14.2, m: M({ fiber_g: 3.5, magnesium_mg: 76, calcium_mg: 76, iron_mg: 1.1, zinc_mg: 0.9, potassium_mg: 208, vitE: 7.3, vitE_mg: 7.3, manganese_mg: 0.6, copper_mg: 0.3, phosphorus_mg: 136, riboflavin_mg: 0.3, choline_mg: 15, thiamin_mg: 0.05, niacin_mg: 1, vitB6_mg: 0.04, folate_mcg: 12, selenium_mcg: 1}) },
    peanuts_oz: { name: "peanuts", unit: "oz", kcal: 161, p: 7.3, c: 4.6, f: 14, m: M({ fiber_g: 2.4, magnesium_mg: 50, zinc_mg: 0.9, iron_mg: 0.6, potassium_mg: 200, calcium_mg: 26 }) },
    cashews_oz: { name: "cashews", unit: "oz", kcal: 157, p: 5.2, c: 8.6, f: 12.4, m: M({ fiber_g: 0.9, magnesium_mg: 83, zinc_mg: 1.6, iron_mg: 1.9, potassium_mg: 187, calcium_mg: 13 }) },
    pistachios_oz: { name: "pistachios", unit: "oz", kcal: 159, p: 5.7, c: 7.7, f: 12.9, m: M({ fiber_g: 3, magnesium_mg: 34, zinc_mg: 0.7, iron_mg: 1.1, potassium_mg: 291, calcium_mg: 30 }) },
    greek_nonfat_cup: { name: "0% Greek yogurt", unit: "cup", kcal: 130, p: 23, c: 9, f: 0.7, m: M({ calcium_mg: 250, potassium_mg: 240, sodium_mg: 65, vitB12_mcg: 0.8, magnesium_mg: 22, zinc_mg: 1.2, vitA_mcg: 5, phosphorus_mg: 230, riboflavin_mg: 0.5, vitB6_mg: 0.1, folate_mcg: 20, choline_mg: 30, selenium_mcg: 10}) },
    greek_2pct_cup: { name: "2% Greek yogurt", unit: "cup", kcal: 150, p: 20, c: 8, f: 4, m: M({ calcium_mg: 230, potassium_mg: 220, sodium_mg: 70, vitB12_mcg: 0.7, magnesium_mg: 20, zinc_mg: 1, vitA_mcg: 20 }) },
    cottage_lf_cup: { name: "low-fat cottage cheese", unit: "cup", kcal: 163, p: 28, c: 6.1, f: 2.3, m: M({ calcium_mg: 138, sodium_mg: 700, potassium_mg: 190, vitB12_mcg: 0.8, magnesium_mg: 12, zinc_mg: 0.7, vitA_mcg: 40, phosphorus_mg: 300, riboflavin_mg: 0.4, selenium_mcg: 20, choline_mg: 40, folate_mcg: 25}) },
    pineapple_cup: { name: "pineapple", unit: "cup", kcal: 82, p: 0.9, c: 21.6, f: 0.2, m: M({ fiber_g: 2.3, vitC_mg: 79, manganese: 1.5, potassium_mg: 180, calcium_mg: 21, magnesium_mg: 20, iron_mg: 0.5 }) },
    peach_cup: { name: "sliced peach", unit: "cup", kcal: 60, p: 1.4, c: 14.7, f: 0.4, m: M({ fiber_g: 2.3, vitC_mg: 10, vitA_mcg: 26, potassium_mg: 285, calcium_mg: 9, magnesium_mg: 14, iron_mg: 0.4 }) },
    egg: { name: "large egg", unit: "egg", kcal: 72, p: 6.3, c: 0.4, f: 4.8, m: M({ sodium_mg: 71, vitA_mcg: 80, vitD_mcg: 1, vitB12_mcg: 0.5, iron_mg: 0.9, calcium_mg: 28, potassium_mg: 69, zinc_mg: 0.6, magnesium_mg: 6, choline_mg: 147, selenium_mcg: 15, phosphorus_mg: 86, riboflavin_mg: 0.2, folate_mcg: 24, vitE_mg: 0.5, vitK_mcg: 0.3, thiamin_mg: 0.04, niacin_mg: 0.05, vitB6_mg: 0.06}) },
    egg_white: { name: "egg white", unit: "white", kcal: 17, p: 3.6, c: 0.2, f: 0.1, m: M({ sodium_mg: 55, potassium_mg: 54, calcium_mg: 2, magnesium_mg: 4 }) },
    avocado_oz: { name: "avocado", unit: "oz", kcal: 45, p: 0.6, c: 2.4, f: 4.2, m: M({ fiber_g: 1.9, potassium_mg: 140, magnesium_mg: 8, vitC_mg: 2.8, vitA_mcg: 2, calcium_mg: 3, iron_mg: 0.15, vitE_mg: 0.6, vitK_mcg: 6, folate_mcg: 25, copper_mg: 0.05, manganese_mg: 0.04, choline_mg: 4}) },
    hard_boiled_egg: { name: "hard boiled egg", unit: "egg", kcal: 78, p: 6.3, c: 0.6, f: 5.3, m: M({ sodium_mg: 62, vitA_mcg: 74, vitD_mcg: 1.1, vitB12_mcg: 0.55, iron_mg: 0.6, calcium_mg: 25, potassium_mg: 63, zinc_mg: 0.5, choline_mg: 147, selenium_mcg: 15, phosphorus_mg: 86, riboflavin_mg: 0.2, folate_mcg: 22, vitE_mg: 0.5}) },
    // doc32 dietary restrictions: only used when a restriction rules out the usual item.
    plant_protein_scoop: { name: "plant protein powder", unit: "scoop", kcal: 120, p: 22, c: 4, f: 2, m: M({ iron_mg: 5, sodium_mg: 290, potassium_mg: 60, calcium_mg: 50, magnesium_mg: 25, zinc_mg: 1.5, phosphorus_mg: 150 }) },
    soy_milk_oz: { name: "unsweetened soy milk", unit: "oz", kcal: 10, p: 0.875, c: 0.5, f: 0.5, m: M({ calcium_mg: 38, vitD_mcg: 0.36, vitB12_mcg: 0.34, potassium_mg: 37, magnesium_mg: 5, sodium_mg: 11, riboflavin_mg: 0.06, vitA_mcg: 19 }) },
    tofu_oz: { name: "extra-firm tofu", unit: "oz", kcal: 26, p: 2.9, c: 0.6, f: 1.5, m: M({ calcium_mg: 98, iron_mg: 0.5, magnesium_mg: 17, zinc_mg: 0.3, potassium_mg: 50, phosphorus_mg: 40, selenium_mcg: 3, manganese_mg: 0.2, copper_mg: 0.06 }) },
    pumpkin_seeds_oz: { name: "pumpkin seeds", unit: "oz", kcal: 158, p: 8.5, c: 3, f: 13.9, m: M({ fiber_g: 1.7, magnesium_mg: 156, zinc_mg: 2.2, iron_mg: 2.5, potassium_mg: 229, phosphorus_mg: 330, manganese_mg: 1.3, copper_mg: 0.4, calcium_mg: 13 }) },
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
    rice_cup: 158, brown_rice_cup: 195, potato_oz: 28, sweet_potato_oz: 28, quinoa_cup: 185,
    broccoli_cup: 91, peppers_cup: 149, cauliflower_cup: 100, carrots_cup: 128,
    mixed_veg_cup: 140, asparagus_cup: 134, zucchini_cup: 124, evoo_tsp: 4.5,
    almonds_oz: 28, peanuts_oz: 28, cashews_oz: 28, pistachios_oz: 28,
    greek_nonfat_cup: 245, greek_2pct_cup: 245, cottage_lf_cup: 226,
    pineapple_cup: 165, peach_cup: 154,
    egg: 50, egg_white: 33, avocado_oz: 28, hard_boiled_egg: 50,
    plant_protein_scoop: 33, soy_milk_oz: 30, tofu_oz: 28, pumpkin_seeds_oz: 28,
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

  /**
   * Meal Templates budget sacrifice order:
   * 1) never require organic
   * 2) reduce variety / micros when that lowers price
   * 3) prefer cheaper items (produce + protein)
   * Callers may merge `overrides` (used by fitPlanToBudget).
   */
  function budgetTier(monthlyBudget, overrides) {
    const b = Number(monthlyBudget) || 0;
    let tier;
    if (b < 250) {
      tier = {
        id: "low",
        label: "Low",
        requireOrganic: false,
        reduceVariety: true,
        preferCheapProduce: true,
        preferCheapProtein: true,
      };
    } else if (b <= 500) {
      tier = {
        id: "mid",
        label: "Mid",
        requireOrganic: false,
        reduceVariety: false,
        preferCheapProduce: true,
        preferCheapProtein: true,
      };
    } else {
      tier = {
        id: "high",
        label: "High",
        requireOrganic: false,
        reduceVariety: false,
        preferCheapProduce: false,
        preferCheapProtein: false,
      };
    }
    if (overrides && typeof overrides === "object") {
      tier = Object.assign({}, tier, overrides);
    }
    return tier;
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
    quinoa_cup: { product: "Quinoa", packageQty: 8, packageUnit: "cup", packagePrice: 4.98 },
    broccoli_cup: { product: "Broccoli florets (frozen)", packageQty: 6, packageUnit: "cup", packagePrice: 1.98 },
    peppers_cup: { product: "Bell peppers", packageQty: 4, packageUnit: "cup", packagePrice: 2.98 },
    cauliflower_cup: { product: "Cauliflower (frozen)", packageQty: 6, packageUnit: "cup", packagePrice: 1.98 },
    carrots_cup: { product: "Baby carrots", packageQty: 6, packageUnit: "cup", packagePrice: 1.48 },
    mixed_veg_cup: { product: "Mixed vegetables (frozen)", packageQty: 6, packageUnit: "cup", packagePrice: 1.68 },
    asparagus_cup: { product: "Asparagus", packageQty: 3, packageUnit: "cup", packagePrice: 3.48 },
    zucchini_cup: { product: "Zucchini", packageQty: 4, packageUnit: "cup", packagePrice: 1.98 },
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
    plant_protein_scoop: { product: "Plant protein powder (pea)", packageQty: 30, packageUnit: "scoop", packagePrice: 34.98 },
    soy_milk_oz: { product: "Unsweetened soy milk", packageQty: 64, packageUnit: "oz", packagePrice: 2.98 },
    tofu_oz: { product: "Extra-firm tofu", packageQty: 14, packageUnit: "oz", packagePrice: 2.28 },
    pumpkin_seeds_oz: { product: "Pumpkin seeds (pepitas)", packageQty: 10, packageUnit: "oz", packagePrice: 4.98 },
  };

  /* ── Dietary restrictions (doc32) ──────────────────────────────────────
   * Multi-select in the questionnaire + Profile (future plans only). Every
   * food carries the tags that rule it out; generation, rerolls, top-ups and
   * the "Let's pick our meals" options all go through foodAllowed(), and
   * restrictSuggestion() swaps any leftover item for an allowed equivalent
   * (whey → plant protein, almond milk → soy milk, walnuts → chia…).
   * No "Other" free-text option: it can't be matched to foods reliably.
   */
  const RESTRICTION_OPTIONS = [
    { id: "dairy_free", label: "Dairy-free" },
    { id: "gluten_free", label: "Gluten-free" },
    { id: "egg_free", label: "Egg-free" },
    { id: "nut_free", label: "Nut-free (tree nuts + peanuts)" },
    { id: "fish_free", label: "Fish/shellfish-free" },
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "pork_free", label: "Pork-free" },
  ];
  const FOOD_TAGS = {
    milk_skim_oz: ["dairy"], milk_2pct_oz: ["dairy"], protein_scoop: ["dairy"], feta_oz: ["dairy"], parmesan_oz: ["dairy"],
    greek_nonfat_cup: ["dairy"], greek_2pct_cup: ["dairy"], cottage_lf_cup: ["dairy"],
    egg: ["egg"], egg_white: ["egg"], hard_boiled_egg: ["egg"],
    almond_milk_oz: ["nut"], walnuts_tsp: ["nut"], walnuts_tbsp: ["nut"], pb_tsp: ["nut"], pb_tbsp: ["nut"],
    almonds_oz: ["nut"], peanuts_oz: ["nut"], cashews_oz: ["nut"], pistachios_oz: ["nut"],
    salmon_oz: ["fish"], cod_oz: ["fish"], shrimp_oz: ["fish"],
    beef_oz: ["meat"], turkey_oz: ["meat"], chicken_oz: ["meat"], chicken_thigh_oz: ["meat"],
    honey_tsp: ["honey"],
  };

  function normalizeRestrictions(list) {
    const have = {};
    (Array.isArray(list) ? list : []).forEach((id) => { have[id] = true; });
    return RESTRICTION_OPTIONS.map((o) => o.id).filter((id) => have[id]);
  }

  /** What a restriction list rules out (vegan ⊃ vegetarian + dairy-free + egg-free; vegetarian ⊃ fish-free). */
  function restrictionFlags(list) {
    const ids = normalizeRestrictions(list);
    const has = (id) => ids.indexOf(id) !== -1;
    const vegan = has("vegan");
    const vegetarian = vegan || has("vegetarian");
    return {
      ids,
      any: ids.length > 0,
      vegan,
      vegetarian,
      dairy: vegan || has("dairy_free"),
      egg: vegan || has("egg_free"),
      nut: has("nut_free"),
      fish: vegetarian || has("fish_free"),
      meat: vegetarian,
      honey: vegan,
      gluten: has("gluten_free"),
      pork: vegetarian || has("pork_free"),
    };
  }

  function foodAllowed(key, flags) {
    if (!flags || !flags.any) return true;
    const tags = FOOD_TAGS[key] || [];
    return !tags.some((t) => flags[t]);
  }

  function proteinPowderKey(flags) {
    return flags && flags.dairy ? "plant_protein_scoop" : "protein_scoop";
  }
  /** Default milk for smoothies/oatmeal: almond, or soy when nut-free. */
  function plantMilkKey(flags) {
    return flags && flags.nut ? "soy_milk_oz" : "almond_milk_oz";
  }

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

  /** Condense tsp → tbsp only when divisible by 3 (e.g. 6 tsp → 2 tbsp). Prefer integer tsp (4 tsp over 1.3 tbsp). */
  function condenseTsp(foodKey, qty) {
    const tbspMap = { chia_tsp: "chia_tbsp", hemp_tsp: "hemp_tbsp", walnuts_tsp: "walnuts_tbsp", pb_tsp: "pb_tbsp" };
    const tspOnly = { evoo_tsp: 1, maple_tsp: 1, honey_tsp: 1, cacao_tsp: 1 };
    // If already tbsp with non-integer / non-clean qty, bounce back to integer tsp
    if (foodKey.endsWith("_tbsp") && FOOD[foodKey] && FOOD[foodKey].unit === "tbsp") {
      const asTsp = Math.max(1, Math.round(Number(qty) * 3));
      if (asTsp % 3 === 0) return { key: foodKey, qty: asTsp / 3 };
      const tspKey = foodKey.replace(/_tbsp$/, "_tsp");
      if (FOOD[tspKey]) return { key: tspKey, qty: asTsp };
      return { key: foodKey, qty: Math.max(1, Math.round(Number(qty))) };
    }
    if (!(foodKey in tbspMap) && !(foodKey in tspOnly)) {
      return { key: foodKey, qty };
    }
    const tsp = Math.max(1, Math.round(Number(qty)));
    if (tsp >= 3 && tsp % 3 === 0) {
      const tbspQty = tsp / 3;
      if (foodKey in tbspMap) return { key: tbspMap[foodKey], qty: tbspQty };
      // evoo/maple/honey: display as whole tbsp text, keep tsp macros
      if (foodKey === "evoo_tsp" || foodKey === "maple_tsp" || foodKey === "honey_tsp") {
        return { key: foodKey, qty: tsp, displayUnit: "tbsp", displayQty: tbspQty };
      }
    }
    return { key: foodKey, qty: tsp };
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
    } else if (f0 && (f0.unit === "tsp" || f0.unit === "tbsp")) {
      // Always whole integers for tsp/tbsp display + macros
      q = Math.max(1, Math.round(q));
      if (displayQty != null) displayQty = Math.max(1, Math.round(displayQty));
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


  /** Map tsp/tbsp variants of the same food to one family key. */
  function ingredientFamily(key) {
    if (!key) return key;
    const map = {
      chia_tsp: "chia",
      chia_tbsp: "chia",
      hemp_tsp: "hemp",
      hemp_tbsp: "hemp",
      walnuts_tsp: "walnuts",
      walnuts_tbsp: "walnuts",
      pb_tsp: "pb",
      pb_tbsp: "pb",
      hard_boiled_egg: "egg",
      egg: "egg",
    };
    return map[key] || key;
  }

  function preferredKeyForFamily(family, totalTspEquiv) {
    // Prefer integer tsp; tbsp only when tsp count is divisible by 3 (never 1.3 tbsp)
    const spoon = {
      chia: { tsp: "chia_tsp", tbsp: "chia_tbsp" },
      hemp: { tsp: "hemp_tsp", tbsp: "hemp_tbsp" },
      walnuts: { tsp: "walnuts_tsp", tbsp: "walnuts_tbsp" },
      pb: { tsp: "pb_tsp", tbsp: "pb_tbsp" },
    };
    if (spoon[family]) {
      const tsp = Math.max(1, Math.round(totalTspEquiv));
      if (tsp >= 3 && tsp % 3 === 0) {
        return { key: spoon[family].tbsp, qty: tsp / 3 };
      }
      return { key: spoon[family].tsp, qty: tsp };
    }
    return { key: family, qty: totalTspEquiv };
  }

  function qtyToTspEquiv(key, qty) {
    if (key.endsWith("_tbsp")) return qty * 3;
    return qty;
  }

  /**
   * Meal Templates: do not repeat ingredients in the same meal
   * (e.g. no 2 tbsp walnuts + 2 tsp walnuts). Merge by food family.
   */
  function dedupeIngredients(ings) {
    if (!ings || !ings.length) return ings || [];
    const notes = ings.filter((i) => i && i._note);
    const real = ings.filter((i) => i && !i._note && i._key);
    const other = ings.filter((i) => i && !i._note && !i._key);
    const groups = new Map();
    const order = [];
    for (const ing of real) {
      const fam = ingredientFamily(ing._key);
      if (!groups.has(fam)) {
        groups.set(fam, []);
        order.push(fam);
      }
      groups.get(fam).push(ing);
    }
    const merged = [];
    for (const fam of order) {
      const list = groups.get(fam);
      if (list.length === 1 && ingredientFamily(list[0]._key) === list[0]._key) {
        // Exact same key only once — still merge identical keys by summing qty
      }
      // Sum tsp-equivalent for spoon foods; otherwise sum qty on canonical key
      const spoonFamilies = { chia: 1, hemp: 1, walnuts: 1, pb: 1 };
      if (spoonFamilies[fam]) {
        let tsp = 0;
        for (const ing of list) tsp += qtyToTspEquiv(ing._key, ing._qty || 0);
        tsp = Math.max(0, Math.round(tsp));
        if (tsp <= 0) continue;
        const pref = preferredKeyForFamily(fam, tsp);
        merged.push(qtyLine(pref.key, pref.qty));
      } else if (fam === "egg") {
        // Prefer hard_boiled_egg if any, else egg; sum counts
        let qty = list.reduce((a, i) => a + (i._qty || 0), 0);
        qty = Math.round(qty);
        if (qty <= 0) continue;
        const preferHb = list.some((i) => i._key === "hard_boiled_egg");
        merged.push(qtyLine(preferHb ? "hard_boiled_egg" : "egg", qty));
      } else {
        // Same FOOD key family: sum quantities onto first key seen
        const key = list[0]._key;
        let qty = list.reduce((a, i) => a + (i._qty || 0), 0);
        // Snap cups
        if (FOOD[key] && FOOD[key].unit === "cup") qty = snapCupFraction(qty);
        else if (FOOD[key] && (FOOD[key].unit === "oz" || FOOD[key].unit === "scoop")) {
          qty = Math.round(qty * 4) / 4;
        } else {
          qty = Math.round(qty * 10) / 10;
        }
        if (qty <= 0) continue;
        merged.push(qtyLine(key, qty));
      }
    }
    return merged.concat(other).concat(notes);
  }

  function finalizeSuggestion(suggestion) {
    if (!suggestion || !suggestion.ingredients) return suggestion;
    suggestion.ingredients = dedupeIngredients(suggestion.ingredients);
    suggestion.totals = roundMacros(sumIngredients(suggestion.ingredients));
    return suggestion;
  }


  /**
   * doc32: swap anything a restriction rules out for an allowed equivalent
   * (same role, similar macros). Generated suggestions pass through here, so
   * builders, rerolls and calorie top-ups can never leak a restricted food.
   * No-op without restrictions.
   */
  function restrictSuggestion(s, flags) {
    if (!s || !s.ingredients || !flags || !flags.any) return s;
    const spoonSeed = { walnuts_tsp: "chia_tsp", walnuts_tbsp: "chia_tsp", pb_tsp: "hemp_tsp", pb_tbsp: "hemp_tsp" };
    const out = [];
    s.ingredients.forEach((ing) => {
      if (!ing || ing._note || !ing._key) { out.push(ing); return; }
      const k = ing._key;
      const q = Number(ing._qty) || 0;
      if (foodAllowed(k, flags)) { out.push(ing); return; }
      const fat = (FOOD[k] ? FOOD[k].f : 0) * q;
      if (k === "protein_scoop") out.push(qtyLine(proteinPowderKey(flags), q));
      else if (/milk/.test(k)) out.push(qtyLine(plantMilkKey(flags), q));
      else if (spoonSeed[k]) out.push(qtyLine(spoonSeed[k], clamp(Math.round(fat / FOOD[spoonSeed[k]].f), 1, 6)));
      else if (FOOD_TAGS[k] && FOOD_TAGS[k][0] === "nut") out.push(qtyLine("pumpkin_seeds_oz", q));
      else if (k === "feta_oz" || k === "parmesan_oz" || k === "hard_boiled_egg") {
        out.push(qtyLine("avocado_oz", clamp(Math.round((fat / FOOD.avocado_oz.f) * 2) / 2, 1, 3)));
      } else if (k === "honey_tsp") out.push(qtyLine("maple_tsp", q));
      // Main proteins (meat/fish/eggs/dairy snacks) are never offered under a
      // restriction that rules them out (see mealTypePools), so nothing else to swap.
      else out.push(ing);
    });
    s.ingredients = dedupeIngredients(out);
    if (s.type === "nut" && s.ingredients[0] && s.ingredients[0]._key === "pumpkin_seeds_oz") s.title = "Pumpkin seeds";
    const notes = (s.notes || []).slice();
    const keys = s.ingredients.map((i) => i && i._key);
    const addNote = (t) => { if (notes.indexOf(t) === -1) notes.push(t); };
    if (flags.gluten && keys.indexOf("oats_cup") !== -1) addNote("Gluten-free: use oats labeled certified gluten-free");
    if (flags.gluten && keys.some((k) => /protein_scoop/.test(k || ""))) addNote("Gluten-free: choose a protein powder labeled gluten-free");
    s.notes = notes;
    s.totals = roundMacros(sumIngredients(s.ingredients));
    return s;
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
    zucchini_cup: "summer_squash",
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
    "zucchini_cup",
  ];

  /** Bowl carb options from Meal Templates (prefer cheap rice on low budget). */
  const BOWL_CARB_KEYS = [
    "rice_cup",
    "brown_rice_cup",
    "potato_oz",
    "sweet_potato_oz",
    "quinoa_cup",
  ];

  function pickBowlCarbKey(tier, seed) {
    if (tier && tier.id === "low") return "rice_cup";
    const keys = BOWL_CARB_KEYS;
    const i = ((Number(seed) || 0) % keys.length + keys.length) % keys.length;
    return keys[i];
  }

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
    // Meal Templates: 4oz milk for each ½ cup oats
    if (includeMilk !== false) {
      const milkOz = Math.max(0, Math.round((oatCups / 0.5) * 4));
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
      tofu: "tofu_oz",
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
      tofu: "Tofu bowl",
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
    const carbKey = options.carbKey || pickBowlCarbKey(tier, options.carbSeed || 0);
    const carbFood = FOOD[carbKey];
    if (carbFood.unit === "cup") {
      const cups = clamp(snapCupFraction(carbNeed / carbFood.c), 0.5, 2);
      ings.push(qtyLine(carbKey, cups));
    } else {
      // potato / sweet potato measured in oz
      const oz = clamp(Math.round((carbNeed / Math.max(0.1, carbFood.c)) * 2) / 2, 4, 16);
      ings.push(qtyLine(carbKey, oz));
    }
    // Low budget: smaller veg portion to cut price/variety
    const vegQty = tier.reduceVariety ? 1 : 1.5;
    ings.push(qtyLine(vegKey, vegQty));

    // Fat: 1–3 tsp EVOO, portion of avocado, or hard boiled egg
    used = sumIngredients(ings);
    const fatNeed = targetGrams.f - used.f;
    // doc32 "Let's pick our meals": 1–2 picked fats, each always included (min
    // portion) and sharing the remaining fat need. Generated plans never pass this.
    const pickedFats = Array.isArray(options.fatStyles) && options.fatStyles.length ? options.fatStyles.slice(0, 2) : null;
    if (pickedFats) {
      const share = Math.max(0, fatNeed) / pickedFats.length;
      pickedFats.forEach((fs) => {
        if (fs === "avocado") ings.push(qtyLine("avocado_oz", clamp(Math.round((share / FOOD.avocado_oz.f) * 2) / 2, 1, 4)));
        else if (fs === "hbe") ings.push(qtyLine("hard_boiled_egg", clamp(Math.round(share / FOOD.hard_boiled_egg.f), 1, 2)));
        else ings.push(qtyLine("evoo_tsp", clamp(Math.round(share / FOOD.evoo_tsp.f), 1, 3)));
      });
    } else if (fatNeed >= 2) {
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
      salmon: "salmon_oz", cod: "cod_oz", shrimp: "shrimp_oz", tofu: "tofu_oz",
    }[protein];
    const titles = {
      beef: "Ground beef salad jar", turkey: "Turkey salad jar", chicken: "Chicken salad jar",
      chicken_thigh: "Chicken thigh salad jar", salmon: "Salmon salad jar", cod: "Cod salad jar",
      shrimp: "Shrimp salad jar", tofu: "Tofu salad jar",
    };
    if (!proteinKey) {
      // Eggs are bowl-only; fall back to chicken for salad jars
      return buildSaladJarSlot("chicken", targetCal, targetGrams, options);
    }
    const greensKey = options.greensKey || "lettuce_cup";
    const vegKeys = options.vegKeys || ["carrots_cup", "cucumber_cup", "cherry_tomato_cup"];
    const fatStyle = options.fatStyle || "evoo";
    const ings = [];

    const oz = proteinQtyForTarget(FOOD[proteinKey].p, targetGrams.p, 3, 10, 0.5);
    ings.push(qtyLine(proteinKey, oz));

    // Optional beans 1/4–1/2 cup
    if (options.addBeans) {
      ings.push(qtyLine("black_beans_cup", snapCupFraction(0.25 + (options.variant || 0) % 2 * 0.25)));
    }

    // Greens: 2–3 cups lettuce, plus optional spinach/kale/mixed greens
    let used = sumIngredients(ings);
    const lettuceCups = clamp(snapCupFraction(tier.reduceVariety ? 2 : 2 + ((options.variant || 0) % 2) * 0.5), 2, 3);
    ings.push(qtyLine("lettuce_cup", lettuceCups));
    if (!tier.reduceVariety && greensKey && greensKey !== "lettuce_cup") {
      ings.push(qtyLine(greensKey, snapCupFraction(0.5 + ((options.variant || 0) % 2) * 0.5)));
    }

    // 1–3 distinct veg portions (no repeated vegetable)
    const nVeg = tier.reduceVariety ? 1 : Math.min(3, vegKeys.length);
    const usedVeg = new Set();
    for (let i = 0; i < vegKeys.length && usedVeg.size < nVeg; i++) {
      const vk = vegKeys[i];
      if (usedVeg.has(vk)) continue;
      usedVeg.add(vk);
      const qty = snapCupFraction(0.25 + (usedVeg.size % 3) * 0.25);
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
      pumpkin_seeds_oz: "Pumpkin seeds",
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

  function addFruitCarbs(ings, fruit, carbNeed, calNeed, pickOpts) {
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
    // doc32 picks: honey/maple only when the user picked it (then at least 1 tsp).
    if (pickOpts && "sweetener" in pickOpts) {
      const sk = pickOpts.sweetener;
      if (sk && FOOD[sk]) {
        const tsp = clamp(
          Math.round(Math.max((carbNeed - used.c) / FOOD[sk].c, calNeed > 0 ? (calNeed - used.kcal) / FOOD[sk].kcal : 0)),
          1,
          2
        );
        ings.push(qtyLine(sk, tsp, formatQty(tsp) + " tsp " + FOOD[sk].name));
      }
      return ings;
    }
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

  const MEAL_TYPES_ALL = ["smoothie", "oatmeal", "bowl", "salad_jar"];
  const SNACK_TYPES_ALL = ["nut", "cottage", "greek", "hb_egg"];

  /** Shared protein/flavor pools respecting budgetTier preferences. */
  function mealTypePools(planOptions) {
    planOptions = planOptions || {};
    const tier =
      planOptions.tier || budgetTier(planOptions.budget || 300, planOptions.tierOverrides);
    const cheapProteins = ["beef", "chicken", "turkey", "chicken_thigh", "eggs", "egg_whites"];
    const cheapSaladProteins = ["beef", "chicken", "turkey", "chicken_thigh"];
    const priceyProteins = ["salmon", "shrimp", "cod"];
    const bowlProteins = tier.preferCheapProtein
      ? cheapProteins.slice()
      : cheapProteins.concat(priceyProteins);
    // Salad jars: no eggs/egg whites (bowls may still use them)
    const saladProteins = tier.preferCheapProtein
      ? cheapSaladProteins.slice()
      : cheapSaladProteins.concat(priceyProteins);
    const breakfastFlavors = tier.preferCheapProduce
      ? tier.reduceVariety
        ? ["banana_bread", "pumpkin_spice", "pb_banana"]
        : ["banana_bread", "pumpkin_spice", "pb_banana", "berry_banana", "chocolate_cherry"]
      : [
          "berry_banana",
          "pumpkin_spice",
          "pb_banana",
          "banana_bread",
          "chocolate_cherry",
        ];
    const smoothieSafeFlavors = breakfastFlavors.filter(
      (f) => f !== "pumpkin_spice" && f !== "banana_bread"
    );
    const nutKeys =
      tier.preferCheapProduce || tier.preferCheapProtein
        ? tier.reduceVariety
          ? ["peanuts_oz"]
          : ["peanuts_oz", "almonds_oz"]
        : ["almonds_oz", "peanuts_oz", "cashews_oz", "pistachios_oz"];
    const fruits = tier.preferCheapProduce
      ? tier.reduceVariety
        ? ["pineapple", "peach"]
        : ["pineapple", "peach", "mango", "berries"]
      : ["pineapple", "peach", "mango", "berries"];
    const pools = { tier, bowlProteins, saladProteins, breakfastFlavors, smoothieSafeFlavors, nutKeys, fruits };
    return restrictPools(pools, restrictionFlags(planOptions.restrictions));
  }

  const PROTEIN_FOOD_KEY = {
    beef: "beef_oz", turkey: "turkey_oz", chicken: "chicken_oz", chicken_thigh: "chicken_thigh_oz",
    salmon: "salmon_oz", cod: "cod_oz", shrimp: "shrimp_oz", eggs: "egg", egg_whites: "egg_white", tofu: "tofu_oz",
  };

  /**
   * doc32: apply dietary restrictions to the (budget-aware) pools. Without
   * restrictions the pools are returned unchanged (plus the full type lists).
   * Vegetarian/vegan bowls and jars get tofu; nut-free snacks get pumpkin seeds.
   */
  function restrictPools(pools, flags) {
    const out = Object.assign({}, pools, { flags: flags || restrictionFlags([]) });
    if (flags && flags.any) {
      const ok = (p) => foodAllowed(PROTEIN_FOOD_KEY[p], flags);
      out.bowlProteins = pools.bowlProteins.filter(ok);
      out.saladProteins = pools.saladProteins.filter(ok);
      if (flags.vegetarian) {
        out.bowlProteins.push("tofu");
        out.saladProteins.push("tofu");
      }
      if (flags.nut) {
        out.breakfastFlavors = pools.breakfastFlavors.filter((f) => f !== "pb_banana");
        if (!out.breakfastFlavors.length) out.breakfastFlavors = ["banana_bread"];
        out.smoothieSafeFlavors = out.breakfastFlavors.filter((f) => f !== "pumpkin_spice" && f !== "banana_bread");
        if (!out.smoothieSafeFlavors.length) out.smoothieSafeFlavors = ["berry_banana"];
        out.nutKeys = ["pumpkin_seeds_oz"];
      }
    }
    const f = out.flags;
    // Smoothie/oatmeal always work (whey or plant protein powder); bowls/jars need a protein.
    out.mealTypes = MEAL_TYPES_ALL.filter((t) =>
      t === "bowl" ? out.bowlProteins.length > 0 : t === "salad_jar" ? out.saladProteins.length > 0 : true);
    out.snackTypes = SNACK_TYPES_ALL.filter((t) =>
      t === "nut" ? out.nutKeys.length > 0 : t === "hb_egg" ? !f.egg : !f.dairy);
    return out;
  }

  /**
   * Build one meal suggestion of an explicit type (not locked by slot position).
   * seed cycles flavors / proteins / veg / fat styles.
   */
  function buildMealSuggestionForType(type, calories, targetGrams, seed, planOptions) {
    const pools = mealTypePools(planOptions || {});
    if (pools.mealTypes.indexOf(type) === -1) type = pools.mealTypes[pools.mealTypes.length - 1] || "oatmeal";
    return restrictSuggestion(buildMealSuggestionForTypeRaw(type, calories, targetGrams, seed, planOptions), pools.flags);
  }

  function buildMealSuggestionForTypeRaw(type, calories, targetGrams, seed, planOptions) {
    seed = Math.max(0, Number(seed) || 0);
    planOptions = planOptions || {};
    const pools = mealTypePools(planOptions);
    const { tier, bowlProteins, breakfastFlavors, smoothieSafeFlavors } = pools;
    const fatStyles = ["evoo", "avocado", "hbe"];
    const saladFat = ["evoo", "avocado", "feta", "parmesan", "hbe"];
    const tg = { p: targetGrams.p, c: targetGrams.c, f: targetGrams.f };
    const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

    if (type === "smoothie") {
      const fl = pick(smoothieSafeFlavors, seed);
      return buildSmoothieSlot(fl, calories, tg, "almond_milk_oz");
    }
    if (type === "oatmeal") {
      const fl = pick(breakfastFlavors, seed);
      return buildOatmealSlot(fl, calories, tg, true);
    }
    if (type === "salad_jar") {
      const prot = pick(pools.saladProteins || bowlProteins.filter((p) => p !== "eggs" && p !== "egg_whites"), Math.floor(seed / 2));
      const greenOpts = ["lettuce_cup", "mixed_greens_cup", "kale_cup", "spinach_cup"];
      const vegPool = [
        "carrots_cup",
        "peppers_cup",
        "cherry_tomato_cup",
        "cucumber_cup",
        "onion_cup",
        "corn_cup",
      ];
      const greens = pick(greenOpts, seed);
      const vegKeys = [
        pick(vegPool, seed),
        pick(vegPool, seed + 2),
        pick(vegPool, seed + 4),
      ].filter((k, idx, arr) => arr.indexOf(k) === idx);
      return buildSaladJarSlot(prot, calories, tg, {
        greensKey: greens,
        vegKeys,
        budget: planOptions.budget,
        tier,
        fatStyle: pick(saladFat, seed),
        addBeans: seed % 3 === 0,
        variant: seed,
      });
    }
    // bowl (default)
    const prot = pick(bowlProteins, Math.floor(seed / 2));
    const vegKey = pick(BOWL_VEG_KEYS, seed);
    const carbKey = pickBowlCarbKey(tier, seed);
    return buildBowlSlot(prot, calories, tg, {
      vegKey,
      carbKey,
      carbSeed: seed,
      budget: planOptions.budget,
      tier,
      fatStyle: pick(fatStyles, seed),
    });
  }

  /** Build one snack of an explicit kind: nut | cottage | greek | hb_egg. */
  function buildSnackSuggestionForType(type, calories, targetGrams, seed, planOptions) {
    const pools = mealTypePools(planOptions || {});
    if (pools.snackTypes.indexOf(type) === -1) type = pools.snackTypes[0] || "nut";
    return restrictSuggestion(buildSnackSuggestionForTypeRaw(type, calories, targetGrams, seed, planOptions), pools.flags);
  }

  function buildSnackSuggestionForTypeRaw(type, calories, targetGrams, seed, planOptions) {
    seed = Math.max(0, Number(seed) || 0);
    planOptions = planOptions || {};
    const pools = mealTypePools(planOptions);
    const { nutKeys, fruits } = pools;
    const tg = { p: targetGrams.p, c: targetGrams.c, f: targetGrams.f };
    const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

    if (type === "nut") {
      return buildNutOnlySnack(pick(nutKeys, seed), calories, tg);
    }
    if (type === "hb_egg") {
      return buildHbEggSnack(calories, tg, pick(fruits, seed));
    }
    const kind = type === "cottage" ? "cottage" : "greek";
    const fruit = pick(fruits, seed);
    const base = buildLeanSnackProtein(kind, fruit, tg.p, tg.f);
    addFruitCarbs(
      base.ings,
      fruit,
      tg.c - sumIngredients(base.ings).c,
      calories - sumIngredients(base.ings).kcal
    );
    return {
      title: base.title,
      type: kind === "cottage" ? "cottage_cheese" : "greek_yogurt",
      ingredients: base.ings,
      totals: roundMacros(sumIngredients(base.ings)),
      notes: [],
      targetGrams: tg,
      targetCal: calories,
    };
  }

  function normalizeSnackRerollType(t) {
    if (t === "cottage_cheese") return "cottage";
    if (t === "greek_yogurt") return "greek";
    if (t === "hb_egg_snack") return "hb_egg";
    return t || "";
  }

  /**
   * Build full day following Meal & Snack Planning Procedure.
   * Prefer even calorie split; allow ±150 meal / ±75 snack if needed later.
   */
  function assignSuggestions(slots, macroPct, dailyCalories, variant, planOptions) {
    variant = Math.max(0, Number(variant) || 0);
    planOptions = planOptions || {};
    const tier = budgetTier(planOptions.budget || 300, planOptions.tierOverrides);
    const fatStyles = ["evoo", "avocado", "hbe"];
    const mealSlots = slots.filter((s) => s.kind === "meal");
    const snackSlots = slots.filter((s) => s.kind === "snack");
    const is3m2s = mealSlots.length === 3 && snackSlots.length === 2;

    // Cheap proteins first; exclude seafood when preferCheapProtein (budget-aware
    // pools, then dietary restrictions — doc32; unchanged without restrictions)
    const pools = mealTypePools({ budget: planOptions.budget, tierOverrides: planOptions.tierOverrides, restrictions: planOptions.restrictions });
    const rflags = pools.flags;
    const bowlProteins = pools.bowlProteins;
    // Salad jars: no eggs/egg whites (bowls may still use them)
    const saladProteins = pools.saladProteins;
    const breakfastFlavors = pools.breakfastFlavors;
    const smoothieSafeFlavors = pools.smoothieSafeFlavors;
    // Peanuts first on budget tiers; pricey nuts mainly on high
    const nutKeys = pools.nutKeys;
    const leanKinds = ["cottage", "greek"].filter((k) => pools.snackTypes.indexOf(k) !== -1);
    // Cheap lean fruits: pineapple over peach/mango/berries when budget-tight
    const fruits = pools.fruits;
    const allowBowl = bowlProteins.length > 0;
    const allowSalad = saladProteins.length > 0;
    const allowHbEgg = pools.snackTypes.indexOf("hb_egg") !== -1;

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

    // One-snack days: nut / hard-boiled egg / lean dairy by variant, falling back
    // to an allowed kind when a restriction rules the usual one out.
    function snackMode(nSnacks, v) {
      let mode = nSnacks === 1 && v % 3 === 1 ? "nut" : nSnacks === 1 && v % 3 === 2 ? "hb" : "lean";
      if (mode === "hb" && !allowHbEgg) mode = leanKinds.length ? "lean" : "nut";
      if (mode === "lean" && !leanKinds.length) mode = allowHbEgg ? "hb" : "nut";
      return mode;
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
        if (planOptions.freeMealTypes) {
          // Variant-driven among all 4 meal types (used by day reroll / free mix)
          const type = pools.mealTypes[(variant + mealCount) % pools.mealTypes.length];
          suggestion = buildMealSuggestionForType(type, slot.calories, tg, variant + mealCount * 17, {
            budget: planOptions.budget,
            tier,
            tierOverrides: planOptions.tierOverrides,
            restrictions: planOptions.restrictions,
          });
        } else if (is3m2s) {
          if (mealCount === 1) {
            // Map variant onto type + flavor directly so rerolls cycle many options
            const useSmoothie = variant % 2 === 0;
            const pool = useSmoothie ? smoothieSafeFlavors : breakfastFlavors;
            const fl = pool[Math.floor(variant / 2) % pool.length];
            suggestion = useSmoothie
              ? buildSmoothieSlot(fl, slot.calories, tg, "almond_milk_oz")
              : buildOatmealSlot(fl, slot.calories, tg, true);
          } else if (mealCount === 2) {
            const vegKey = pickDiverseKey(BOWL_VEG_KEYS, usedProduce, variant + bowlI);
            const saladFat = ["evoo", "avocado", "feta", "parmesan", "hbe"];
            const saladPool = saladProteins;
            const protBowl = bowlProteins[Math.floor(variant / 2) % bowlProteins.length];
            if (!allowBowl && !allowSalad) {
              suggestion = buildOatmealSlot(pick(breakfastFlavors, variant + 1), slot.calories, tg, true);
            } else if (allowSalad && (variant % 2 === 1 || !allowBowl)) {
              const prot = saladPool[Math.floor(variant / 2) % saladPool.length];
              const greenOpts = ["lettuce_cup", "mixed_greens_cup", "kale_cup", "spinach_cup"];
              const greens = greenOpts[variant % greenOpts.length];
              const vegPool = ["carrots_cup", "peppers_cup", "cherry_tomato_cup", "cucumber_cup", "onion_cup", "corn_cup"];
              const vegKeys = [
                vegPool[variant % vegPool.length],
                vegPool[(variant + 2) % vegPool.length],
                vegPool[(variant + 4) % vegPool.length],
              ].filter((k, idx, arr) => arr.indexOf(k) === idx);
              suggestion = buildSaladJarSlot(prot, slot.calories, tg, {
                greensKey: greens,
                vegKeys,
                budget: planOptions.budget,
                tier,
                fatStyle: saladFat[variant % saladFat.length],
                addBeans: variant % 3 === 0,
                variant,
              });
            } else {
              suggestion = buildBowlSlot(protBowl, slot.calories, tg, { vegKey, carbKey: pickBowlCarbKey(tier, variant + bowlI), carbSeed: variant + bowlI, budget: planOptions.budget, tier, fatStyle: fatStyles[variant % fatStyles.length] });
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
          const protBowl = bowlProteins[bowlI % bowlProteins.length];
          const saladPool = saladProteins;
          const saladFat = ["evoo", "avocado", "feta", "parmesan", "hbe"];
          if (!allowBowl && !allowSalad) {
            suggestion = buildOatmealSlot(pick(breakfastFlavors, variant + bowlI), slot.calories, tg, true);
          } else if (allowSalad && ((variant + bowlI) % 2 === 1 || !allowBowl)) {
            const prot = saladPool[bowlI % saladPool.length];
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
            suggestion = buildBowlSlot(protBowl, slot.calories, tg, { vegKey, carbKey: pickBowlCarbKey(tier, variant + bowlI), carbSeed: variant + bowlI, budget: planOptions.budget, tier, fatStyle: fatStyles[(variant + bowlI) % fatStyles.length] });
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
        } else if (snackMode(snackSlots.length, variant) === "nut") {
          const suggestion = buildNutOnlySnack(pick(nutKeys, variant), slot.calories, tg);
          results.push(Object.assign({}, slot, { targetMacros: gramsFromPct(slot.calories, macroPct), suggestion }));
        } else if (snackMode(snackSlots.length, variant) === "hb") {
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
      if (!leanKinds.length) {
        // doc32: no dairy allowed → the second snack is hard-boiled eggs & fruit, or another nut/seed.
        const sf = pickDiverseFruitName(fruits, usedProduce, variant + 1);
        const alt = allowHbEgg
          ? buildHbEggSnack(item.slot.calories, item.tg, sf)
          : buildNutOnlySnack(pick(nutKeys, variant + 1), item.slot.calories, item.tg);
        markProduceFromIngredients(usedProduce, alt.ingredients);
        results[item.index] = Object.assign({}, item.slot, { targetMacros: gramsFromPct(item.slot.calories, macroPct), suggestion: alt });
        continue;
      }
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

    // doc32: swap anything a dietary restriction rules out before tuning.
    for (const r of results) r.suggestion = restrictSuggestion(r.suggestion, rflags);

    // Smoothie milk: prefer dairy skim/2% when day is under on cal or protein;
    // use almond milk if day's protein or calories already too high.
    let dayKcal = results.reduce((a, r) => a + r.suggestion.totals.kcal, 0);
    let dayP = results.reduce((a, r) => a + r.suggestion.totals.p, 0);
    const dayTargetP = (dailyCalories * macroPct.p) / 100 / 4;
    const calTooHigh = dayKcal > dailyCalories;
    const proteinTooHigh = dayP > dayTargetP + 8;
    if (!rflags.dairy && !calTooHigh && !proteinTooHigh && (dayKcal < dailyCalories - 80 || dayP < dayTargetP - 8)) {
      for (const r of results) {
        if (r.suggestion.type === "smoothie") {
          const prefer2pct = dayKcal < dailyCalories - 200 && dayP >= dayTargetP - 5;
          const milkKey = prefer2pct ? "milk_2pct_oz" : "milk_skim_oz";
          const delta = 8 * (FOOD[milkKey].kcal - FOOD.almond_milk_oz.kcal);
          const pDelta = 8 * (FOOD[milkKey].p - FOOD.almond_milk_oz.p);
          if (dayKcal + delta <= dailyCalories + 100 && dayP + pDelta <= dayTargetP + 12) {
            const rebuilt = restrictSuggestion(buildSmoothieSlot(
              r.suggestion.flavor,
              r.calories,
              r.suggestion.targetGrams,
              milkKey
            ), rflags);
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
          const rebuilt = restrictSuggestion(buildOatmealSlot(r.suggestion.flavor, r.calories, r.suggestion.targetGrams, false), rflags);
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
          const fatFood = rflags.nut ? "chia_tsp" : "walnuts_tsp";
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
          const nutKey = FOOD[ing._key] && FOOD[ing._key].unit === "oz" ? ing._key : "almonds_oz";
          if (newQty > (ing._qty || 1) && FOOD[nutKey].kcal * 0.25 <= room) {
            // Keep the same nut so the title ("Pistachios") matches the ingredient.
            r.suggestion.ingredients[0] = qtyLine(nutKey, newQty, formatQty(newQty) + " oz " + FOOD[nutKey].name);
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

    for (const r of results) {
      if (r && r.suggestion) finalizeSuggestion(restrictSuggestion(r.suggestion, rflags));
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

  /**
   * One grocery key per store product. Several FOOD keys are the same thing at
   * the store (egg + hard_boiled_egg → "Large eggs"; pb_tsp + pb_tbsp →
   * "Peanut butter"; chia/hemp/walnuts tsp + tbsp). Meals keep their own keys,
   * but the grocery list, inventory, credit and depletion all aggregate on the
   * canonical key. Derived from PRICE_CATALOG product names so a future catalog
   * entry that shares a product can never produce a duplicate list line.
   * factor converts one FOOD unit of the variant into the canonical unit
   * (via package sizes, e.g. 96 tsp = 32 tbsp → 1 tsp = 1/3 tbsp).
   */
  function normalizeProductName(name) {
    return String(name || "").toLowerCase().replace(/\s+/g, " ").trim();
  }
  const GROCERY_CANON = (function () {
    const byProduct = {};
    Object.keys(PRICE_CATALOG).forEach((k) => {
      if (!FOOD[k]) return;
      const name = normalizeProductName(PRICE_CATALOG[k].product);
      (byProduct[name] = byProduct[name] || []).push(k);
    });
    const map = {};
    Object.keys(byProduct).forEach((name) => {
      const keys = byProduct[name];
      // Canonical: largest unit (smallest package count), then the plainest key ("egg").
      const canon = keys.slice().sort((a, b) =>
        PRICE_CATALOG[a].packageQty - PRICE_CATALOG[b].packageQty ||
        a.length - b.length || (a < b ? -1 : a > b ? 1 : 0))[0];
      keys.forEach((k) => {
        map[k] = { key: canon, factor: PRICE_CATALOG[canon].packageQty / PRICE_CATALOG[k].packageQty };
      });
    });
    return map;
  })();

  /** Canonical grocery/inventory key for a FOOD key. */
  function groceryKey(key) {
    return GROCERY_CANON[key] ? GROCERY_CANON[key].key : key;
  }

  /** Convert qty in `key`'s FOOD unit into its canonical grocery key's unit. */
  function groceryQty(key, qty) {
    const c = GROCERY_CANON[key];
    return (Number(qty) || 0) * (c ? c.factor : 1);
  }

  /** Per-plan-day ingredient needs keyed by canonical grocery key. */
  function dailyGroceryNeeds(schedule) {
    const need = {};
    (schedule || []).forEach((slot) => {
      const ings = (slot && slot.suggestion && slot.suggestion.ingredients) || [];
      ings.forEach((ing) => {
        if (!ing || ing._note || !ing._key) return;
        const k = groceryKey(ing._key);
        need[k] = (need[k] || 0) + groceryQty(ing._key, ing._qty || 0);
      });
    });
    return need;
  }

  /** Merge inventory rows onto canonical keys (migrates older saves: hard_boiled_egg → egg, pb_tsp → pb_tbsp…). */
  function canonicalizeInventory(inv) {
    const byKey = {};
    const order = [];
    (inv || []).forEach((it) => {
      if (!it || !it.key) return;
      const k = groceryKey(it.key);
      const qty = groceryQty(it.key, Number(it.qtyRemaining) || 0);
      const init = groceryQty(it.key, Number(it.initialQty) || 0);
      if (!byKey[k]) {
        const price = lookupPrice(k);
        byKey[k] = Object.assign({}, it, {
          key: k,
          name: k === it.key ? it.name : price.product || it.name,
          unit: FOOD[k] ? FOOD[k].unit : it.unit,
          qtyRemaining: 0,
          initialQty: 0,
        });
        order.push(k);
      }
      byKey[k].qtyRemaining = Math.round((byKey[k].qtyRemaining + qty) * 100) / 100;
      byKey[k].initialQty = Math.round((byKey[k].initialQty + init) * 100) / 100;
    });
    return order.map((k) => byKey[k]);
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

  /** Input step for a grocery key's unit (matches roundBuyQty granularity). */
  function groceryUnitStep(key) {
    const unit = FOOD[key] ? FOOD[key].unit : "unit";
    if (unit === "oz" || unit === "tsp" || unit === "medium" || unit === "egg" || unit === "white") return 1;
    if (unit === "tbsp" || unit === "scoop") return 0.5;
    return 0.25;
  }

  /** Display unit for a quantity ("12 eggs", "1 egg"; other units unchanged). */
  function displayUnit(unit, qty) {
    const plural = { egg: "eggs", white: "whites" };
    return plural[unit] && Math.abs(Number(qty) - 1) > 1e-9 ? plural[unit] : unit;
  }

  function formatBuyQty(key, qty) {
    const unit = FOOD[key] ? FOOD[key].unit : "unit";
    return formatQty(qty) + " " + displayUnit(unit, qty);
  }

  /** One priced grocery line for `rawQty` (canonical key units); package-friendly pricing. */
  function groceryLine(key, rawQty) {
    const buyQty = roundBuyQty(key, rawQty);
    const price = lookupPrice(key);
    // Package-friendly: buy enough packages to cover buyQty
    const packagesNeeded = Math.max(1, Math.ceil(buyQty / price.packageQty - 1e-9));
    const lineTotal = Math.round(packagesNeeded * price.packagePrice * 100) / 100;
    const unitPrice = Math.round(price.unitPrice * 1000) / 1000;
    return {
      key,
      name: price.product || (FOOD[key] ? FOOD[key].name : key),
      foodName: FOOD[key] ? FOOD[key].name : key,
      qty: buyQty,
      qtyLabel: formatBuyQty(key, buyQty),
      unit: FOOD[key] ? FOOD[key].unit : "unit",
      unitPrice,
      packagePrice: price.packagePrice,
      packageQty: price.packageQty,
      packages: packagesNeeded,
      lineTotal,
      estimated: true,
    };
  }

  function groceryTotals(grocery, items) {
    const grandTotal = Math.round(items.reduce((a, it) => a + (Number(it.lineTotal) || 0), 0) * 100) / 100;
    const factor = Number(grocery && grocery.monthlyFactor) ||
      (grocery && grocery.cadence === "weekly" ? 4.3 : grocery && grocery.cadence === "every_other_week" ? 2.15 : 1);
    const monthlyEstimate = Math.round(grandTotal * factor * 100) / 100;
    const budget = Number(grocery && grocery.budget) || 0;
    return { grandTotal, monthlyEstimate, overBudget: budget > 0 && monthlyEstimate > budget };
  }

  /**
   * Merge any lines that share a canonical key (older saved plans could list
   * "Large eggs" twice). Returns a new grocery object; input is not mutated.
   */
  function normalizeGroceryList(grocery) {
    if (!grocery || !Array.isArray(grocery.items)) return grocery;
    const qty = {};
    const counts = {};
    const firstItem = {};
    grocery.items.forEach((it) => {
      if (!it || !it.key) return;
      const k = groceryKey(it.key);
      qty[k] = (qty[k] || 0) + groceryQty(it.key, Number(it.qty) || 0);
      counts[k] = (counts[k] || 0) + 1;
      if (!firstItem[k]) firstItem[k] = it;
    });
    const keys = Object.keys(qty).sort();
    const items = keys.map((k) =>
      counts[k] === 1 && firstItem[k].key === k ? firstItem[k] : groceryLine(k, qty[k]));
    return Object.assign({}, grocery, { items }, groceryTotals(grocery, items));
  }

  /**
   * Suggested list after "I already have some of these items".
   * stock: { canonicalKey: qtyOnHand }. Items fully covered are dropped (and
   * listed in coveredByStock); partial stock re-prices the remainder with the
   * same package logic. Returns a new grocery object.
   */
  function applyStockToGrocery(grocery, stock) {
    const base = normalizeGroceryList(grocery);
    if (!base || !Array.isArray(base.items)) return base;
    const have = {};
    Object.keys(stock || {}).forEach((k) => {
      const gk = groceryKey(k);
      have[gk] = (have[gk] || 0) + groceryQty(k, Number(stock[k]) || 0);
    });
    const items = [];
    const coveredByStock = [];
    base.items.forEach((it) => {
      const h = have[it.key] || 0;
      if (h <= 1e-9) { items.push(it); return; }
      const remaining = (Number(it.qty) || 0) - h;
      if (remaining <= 1e-9) {
        coveredByStock.push(Object.assign({}, it, { originalQty: it.qty, stockQty: h }));
        return;
      }
      const line = groceryLine(it.key, remaining);
      line.name = it.name || line.name;
      line.originalQty = it.qty;
      line.originalLineTotal = it.lineTotal;
      line.stockQty = h;
      items.push(line);
    });
    return Object.assign({}, base, { items, coveredByStock }, groceryTotals(base, items));
  }

  /**
   * Grocery list for shopping window = cadence × days/week.
   * Uses lookupPrice() (Walmart-style estimates; API-ready).
   * Aggregates on canonical grocery keys so each product appears once.
   */
  function buildGroceryList(schedule, answers, tierOverride) {
    const daysPerWeek =
      (Array.isArray(answers.selectedDays) && answers.selectedDays.length) ||
      Number(answers.daysPerWeek) ||
      7;
    const planDays = shoppingPlanDays(answers.cadence, daysPerWeek);
    const tier = tierOverride || budgetTier(answers.budget, answers._tierOverrides);
    const agg = {};
    for (const slot of schedule) {
      for (const ing of slot.suggestion.ingredients) {
        if (ing._note || !ing._key || !FOOD[ing._key]) continue;
        const k = groceryKey(ing._key);
        if (!agg[k]) agg[k] = 0;
        agg[k] += groceryQty(ing._key, ing._qty || 0) * planDays;
      }
    }

    // Drive Onboarding: credit leftover inventory (e.g. 4 leftover eggs → order 4 fewer).
    const onHand = {};
    const inv = (answers && answers._inventory) || [];
    inv.forEach((it) => {
      if (!it || !it.key) return;
      const k = groceryKey(it.key);
      onHand[k] = (onHand[k] || 0) + groceryQty(it.key, Number(it.qtyRemaining) || 0);
    });
    let creditedKeys = 0;

    const items = [];
    let grandTotal = 0;
    Object.keys(agg)
      .sort()
      .forEach((key) => {
        const need = agg[key];
        const credit = onHand[key] || 0;
        const rawQty = Math.max(0, need - credit);
        if (credit > 0 && rawQty < need - 1e-9) creditedKeys += 1;
        if (rawQty <= 1e-9) return; // fully covered by leftovers
        const line = groceryLine(key, rawQty);
        grandTotal += line.lineTotal;
        items.push(line);
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
      priceNote: (function () {
        const parts = ["Estimated Walmart prices (API not connected yet)"];
        const sac = [];
        if (!tier.requireOrganic) sac.push("non-organic");
        if (tier.reduceVariety) sac.push("reduced variety");
        if (tier.preferCheapProduce) sac.push("cheaper produce");
        if (tier.preferCheapProtein) sac.push("cheaper protein");
        if (sac.length) parts.push("budget: " + sac.join(", "));
        else parts.push("budget: full produce variety");
        if (creditedKeys) parts.push("inventory leftovers credited");
        return parts.join(" · ");
      })(),
      inventoryCredited: creditedKeys > 0,
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

  /** Single-pass plan build (no budget fit loop). */
  function buildPlanOnce(answers, options) {
    options = options || {};
    const variant = Math.max(0, Number(options.variant) || 0);
    let calories = answers.calories;
    if (answers.calorieMode === "help") {
      calories = estimateCalories(answers.weightLbs, answers.weightGoal, answers.activity);
    }
    const macro = macrosFromWeightGoal(answers.weightGoal);

    let meals = answers.meals;
    let snacks = answers.snacks;
    if (answers.mealOption && MEAL_OPTIONS[answers.mealOption]) {
      meals = MEAL_OPTIONS[answers.mealOption].meals;
      snacks = MEAL_OPTIONS[answers.mealOption].snacks;
    }

    const macroPct = { p: macro.p, c: macro.c, f: macro.f };
    const dailyGrams = gramsFromPct(calories, macroPct);
    const tierOverrides = options.tierOverrides || null;
    const tier = budgetTier(answers.budget, tierOverrides);
    const schedule = assignSuggestions(
      buildSchedule(calories, meals, snacks),
      macroPct,
      calories,
      variant,
      {
        budget: answers.budget,
        tierOverrides: tierOverrides,
        freeMealTypes: !!options.freeMealTypes,
        restrictions: answers.restrictions,
      }
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
    const plan = {
      variant,
      budget: answers.budget,
      budgetTier: tier,
      cadence: answers.cadence,
      restrictions: normalizeRestrictions(answers.restrictions),
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
    plan.grocery = buildGroceryList(schedule, answers, tier);
    return plan;
  }

  /**
   * Progressive Meal Templates sacrifices + variant search until monthly
   * estimate is under budget (or closest feasible). Calls buildPlanOnce only.
   */
  function fitPlanToBudget(answers, options) {
    options = options || {};
    const budget = Number(answers.budget) || 0;
    const baseVariant = Math.max(0, Number(options.variant) || 0);
    const baseOverrides = options.tierOverrides || null;

    const first = buildPlanOnce(answers, options);
    if (!budget || !first.grocery.overBudget) return first;

    // Sacrifice order (doc): organic already off → cheap items → reduce variety
    const sacrificeSteps = [
      Object.assign({}, baseOverrides, {
        requireOrganic: false,
        preferCheapProduce: true,
        preferCheapProtein: true,
      }),
      Object.assign({}, baseOverrides, {
        requireOrganic: false,
        preferCheapProduce: true,
        preferCheapProtein: true,
        reduceVariety: true,
      }),
    ];

    let best = first;
    const variantCount = 40;

    function consider(trial) {
      if (!trial || !trial.grocery) return;
      const est = trial.grocery.monthlyEstimate;
      const over = trial.grocery.overBudget;
      const bestOver = best.grocery.overBudget;
      const bestEst = best.grocery.monthlyEstimate;
      const compliant = trial.compliance && trial.compliance.withinTolerances;
      const bestCompliant = best.compliance && best.compliance.withinTolerances;

      if (!over) {
        if (bestOver) {
          best = trial;
          return;
        }
        // Both under: prefer compliance, then cheaper, then closer to seed variant
        if (compliant && !bestCompliant) {
          best = trial;
          return;
        }
        if (compliant === bestCompliant && est < bestEst) {
          best = trial;
          return;
        }
      } else if (bestOver && est < bestEst) {
        best = trial;
      }
    }

    for (const overrides of sacrificeSteps) {
      for (let i = 0; i < variantCount; i++) {
        const trialVariant = baseVariant + i * 5 + ((i * 7) % 13);
        const trial = buildPlanOnce(answers, {
          variant: trialVariant,
          tierOverrides: overrides,
        });
        consider(trial);
        if (!best.grocery.overBudget && best.compliance && best.compliance.withinTolerances) {
          // Early exit once we have a compliant under-budget plan at this sacrifice level
          if (i >= 8) return best;
        }
      }
      if (!best.grocery.overBudget) return best;
    }

    // Extra cheap-first sweep across a wider variant space (best-effort)
    for (let i = 0; i < 48; i++) {
      const trialVariant = baseVariant + i * 3 + 17;
      const trial = buildPlanOnce(answers, {
        variant: trialVariant,
        tierOverrides: Object.assign({}, baseOverrides, {
          requireOrganic: false,
          preferCheapProduce: true,
          preferCheapProtein: true,
          reduceVariety: true,
        }),
      });
      consider(trial);
      if (!best.grocery.overBudget && best.compliance && best.compliance.withinTolerances) {
        return best;
      }
    }
    return best;
  }

  function buildPlan(answers, options) {
    options = options || {};
    if (options.skipFit) return buildPlanOnce(answers, options);
    return fitPlanToBudget(answers, options);
  }


  function recomputePlanFromSchedule(answers, schedule, variant) {
    const calories =
      answers.calorieMode === "help"
        ? estimateCalories(answers.weightLbs, answers.weightGoal, answers.activity)
        : answers.calories;
    const macro = macrosFromWeightGoal(answers.weightGoal);
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
    const tier = budgetTier(answers.budget, answers._tierOverrides);
    const plan = {
      variant: variant || 0,
      budget: answers.budget,
      budgetTier: tier,
      cadence: answers.cadence,
      restrictions: normalizeRestrictions(answers.restrictions),
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
    plan.grocery = buildGroceryList(schedule, answers, tier);
    return plan;
  }

  /** Reroll a single meal/snack slot; keep others. Best-effort day tolerances. */
  function suggestionFingerprint(s) {
    if (!s) return "";
    return [s.type || "", s.protein || "", s.flavor || "", s.title || ""].join("|");
  }

  /**
   * Onboarding: rerolls should explore as many different options as possible.
   * Prefer a new title/type/protein/flavor, avoid repeats already on the day or
   * recently shown for this slot, while staying near calorie/macro tolerances.
   */
  function rerollSlot(currentPlan, answers, slotIndex, fromVariant) {
    const base = Math.max(0, Number(fromVariant) || 0);
    const slot = currentPlan.schedule[slotIndex];
    if (!slot) return currentPlan;
    const prev = slot.suggestion;
    const prevTitle = prev ? prev.title : "";
    const prevFp = suggestionFingerprint(prev);
    const prevType = prev ? prev.type : "";
    const prevSnackKind = normalizeSnackRerollType(prevType);
    const dayTitles = new Set(
      currentPlan.schedule
        .map((s, j) => (j === slotIndex ? null : s.suggestion && s.suggestion.title))
        .filter(Boolean)
    );
    if (!answers._rerollHistory) answers._rerollHistory = {};
    const history = (answers._rerollHistory[slotIndex] || []).slice();
    if (prevTitle && history[history.length - 1] !== prevTitle) history.push(prevTitle);
    const historySet = new Set(history);

    let best = null;
    const slotVariants = (answers._slotVariants || currentPlan._slotVariants || []).slice();
    const triedTitles = new Set();

    const planOptions = {
      budget: answers.budget,
      tierOverrides: answers._tierOverrides,
      tier: budgetTier(answers.budget, answers._tierOverrides),
      restrictions: answers.restrictions,
    };
    const macroPct = currentPlan.daily.macros;
    const tg = gramsExact(slot.calories, macroPct);
    const isMeal = slot.kind === "meal";

    // Build candidate list: meals explore all 4 template types; snacks explore nut/cottage/greek/hb_egg
    const candidates = [];
    if (isMeal) {
      const orderedTypes = mealTypePools(planOptions).mealTypes.slice().sort((a, b) => {
        if (a === prevType) return 1;
        if (b === prevType) return -1;
        return 0;
      });
      const pools = mealTypePools(planOptions);
      for (const type of orderedTypes) {
        let dim = 1;
        if (type === "smoothie") dim = Math.max(1, pools.smoothieSafeFlavors.length);
        else if (type === "oatmeal") dim = Math.max(1, pools.breakfastFlavors.length);
        else if (type === "bowl") dim = Math.max(1, pools.bowlProteins.length) * 3;
        else dim = Math.max(1, pools.bowlProteins.length) * 5;
        // Extra seeds so proteins × flavors × fats get coverage beyond the minimum dims
        const seedCount = Math.max(12, dim);
        for (let s = 0; s < seedCount; s++) {
          const seed = base + s * 7 + slotIndex * 13 + ((s * 3) % 11) + orderedTypes.indexOf(type) * 19;
          candidates.push({
            suggestion: buildMealSuggestionForType(type, slot.calories, tg, seed, planOptions),
            seed,
            type,
          });
        }
      }
    } else {
      const orderedSnacks = mealTypePools(planOptions).snackTypes.slice().sort((a, b) => {
        if (a === prevSnackKind) return 1;
        if (b === prevSnackKind) return -1;
        return 0;
      });
      for (const type of orderedSnacks) {
        for (let s = 0; s < 10; s++) {
          const seed = base + s * 5 + slotIndex * 11 + ((s * 7) % 9) + orderedSnacks.indexOf(type) * 17;
          candidates.push({
            suggestion: buildSnackSuggestionForType(type, slot.calories, tg, seed, planOptions),
            seed,
            type,
          });
        }
      }
    }

    for (let i = 0; i < candidates.length; i++) {
      const entry = candidates[i];
      const cand = entry.suggestion;
      const trialVariant = entry.seed;
      const newTitle = cand.title;
      triedTitles.add(newTitle);
      const newSlot = Object.assign({}, slot, {
        targetMacros: gramsFromPct(slot.calories, macroPct),
        suggestion: cand,
      });
      const schedule = currentPlan.schedule.map((s, j) => (j === slotIndex ? newSlot : s));
      const nextVariants = slotVariants.slice();
      nextVariants[slotIndex] = trialVariant;
      const rebuilt = recomputePlanFromSchedule(answers, schedule, trialVariant);
      rebuilt._slotVariants = nextVariants;

      const calDelta = Math.abs(rebuilt.actual.kcal - rebuilt.daily.calories);
      let score = calDelta;
      if (!rebuilt.compliance.withinTolerances) score += 400;
      if (calDelta > 150) score += 200;
      if (rebuilt.grocery && rebuilt.grocery.overBudget) score += 600;

      const fp = suggestionFingerprint(cand);
      if (newTitle === prevTitle) score += 500;
      else score -= 80;
      if (fp === prevFp) score += 200;
      // Heavy preference for a different meal/snack template type (bowls/salads/smoothies/etc.)
      const candKind = isMeal ? cand.type : normalizeSnackRerollType(cand.type);
      const prevKind = isMeal ? prevType : prevSnackKind;
      if (candKind && prevKind && candKind === prevKind) score += 160;
      else score -= 140;
      if (cand.protein && prev && cand.protein === prev.protein) score += 40;
      if (cand.flavor && prev && cand.flavor === prev.flavor) score += 40;
      if (dayTitles.has(newTitle)) score += 120;
      if (historySet.has(newTitle)) score += 160;
      score += Math.min(30, triedTitles.size);

      rebuilt._score = score;
      rebuilt._newTitle = newTitle;
      if (!best || score < best._score) best = rebuilt;

      // Early exit: new type + new title + in tolerance
      if (
        newTitle !== prevTitle &&
        candKind &&
        candKind !== prevKind &&
        fp !== prevFp &&
        !historySet.has(newTitle) &&
        !dayTitles.has(newTitle) &&
        rebuilt.compliance.withinTolerances
      ) {
        best = rebuilt;
        break;
      }
    }

    const chosen = best || currentPlan;
    // doc32: a picked plan stays marked as picked when one slot is rerolled.
    if (currentPlan.builtBy && chosen !== currentPlan) chosen.builtBy = currentPlan.builtBy;
    if (chosen._slotVariants) answers._slotVariants = chosen._slotVariants.slice();
    const chosenTitle =
      chosen.schedule &&
      chosen.schedule[slotIndex] &&
      chosen.schedule[slotIndex].suggestion &&
      chosen.schedule[slotIndex].suggestion.title;
    if (chosenTitle) {
      history.push(chosenTitle);
      answers._rerollHistory[slotIndex] = history.slice(-12);
    }
    return chosen;
  }

  /** Reroll the whole day toward a plan with as many new meal/snack titles as possible. */
  function rerollDay(answers, currentPlan, fromVariant) {
    const base = Math.max(0, Number(fromVariant) || 0);
    const prevTitles = (currentPlan.schedule || []).map((s) => s.suggestion && s.suggestion.title);
    let best = null;
    for (let i = 1; i <= 64; i++) {
      const trialVariant = base + i * 5 + ((i * 9) % 17);
      const trial = buildPlan(answers, {
        variant: trialVariant,
        skipFit: true,
        freeMealTypes: true,
      });
      const titles = trial.schedule.map((s) => s.suggestion.title);
      let different = 0;
      for (let j = 0; j < titles.length; j++) {
        if (titles[j] !== prevTitles[j]) different += 1;
      }
      const calDelta = Math.abs(trial.actual.kcal - trial.daily.calories);
      let score = -different * 100 + calDelta;
      if (!trial.compliance.withinTolerances) score += 300;
      if (trial.grocery && trial.grocery.overBudget) score += 600;
      // Prefer not reusing the exact same set of titles
      const sameSet =
        titles.slice().sort().join("|") === prevTitles.slice().sort().join("|");
      if (sameSet) score += 250;
      trial._score = score;
      trial._slotVariants = trial.schedule.map(() => trialVariant);
      if (!best || score < best._score) best = trial;
      if (different === titles.length && trial.compliance.withinTolerances) {
        best = trial;
        break;
      }
    }
    return best || currentPlan;
  }


  /* ── doc32: "Let's pick our meals" ────────────────────────────────────────
   * The user walks each slot in order: pick a template (the Meal Templates
   * doc's options for that slot kind), then its ingredients in template order.
   * Limits follow the doc: bowl = 1 protein, 1 carb, 1 veg ("always a serving
   * of vegetables"), 1–2 fats; smoothie/oatmeal = protein powder is automatic,
   * 1–4 carbs, 1–2 fats (oatmeal always keeps its oat base); salad jar = 1
   * protein, 1–2 greens, 1–3 veg, optional beans/rice, 1–2 fats; nuts = 1 nut;
   * yogurt/cottage cheese = 1 fruit + optional honey/maple; eggs = 1 fruit.
   * Options come from the same budget-aware pools as generated plans (pricier
   * items hidden on tighter budgets) and respect dietary restrictions; portions
   * are sized by the same macro logic as the generator, then the day is tuned
   * by nudging only the picked ingredients.
   */
  const PICK_TEMPLATES = {
    meal: [
      { id: "bowl", label: "Bowl", desc: "A protein, a carb, a veggie and a little healthy fat." },
      { id: "smoothie", label: "Smoothie", desc: "Protein powder blended with fruit, milk and a healthy fat." },
      { id: "oatmeal", label: "Oatmeal", desc: "Protein oats with fruit or a little sweetness and a healthy fat." },
      { id: "salad_jar", label: "Salad jar", desc: "A protein, greens and crunchy veggies layered in a jar." },
    ],
    snack: [
      { id: "nut", label: "Nuts", desc: "A measured handful of one kind of nut." },
      { id: "greek", label: "Greek yogurt & fruit", desc: "0% Greek yogurt with fruit, plus honey or maple if you like." },
      { id: "cottage", label: "Cottage cheese & fruit", desc: "Low-fat cottage cheese with fruit, plus honey or maple if you like." },
      { id: "hb_egg", label: "Hard-boiled eggs & fruit", desc: "1–3 hard-boiled eggs with a side of fruit." },
    ],
  };
  const PICK_LABELS = {
    beef: "Lean ground beef", turkey: "Lean ground turkey", chicken: "Chicken breast", chicken_thigh: "Chicken thighs",
    salmon: "Salmon fillet", cod: "Cod fillet", shrimp: "Shrimp", eggs: "Whole eggs", egg_whites: "Egg whites", tofu: "Extra-firm tofu",
    rice_cup: "White rice", brown_rice_cup: "Brown rice", potato_oz: "Potatoes", sweet_potato_oz: "Sweet potatoes", quinoa_cup: "Quinoa",
    broccoli_cup: "Broccoli", carrots_cup: "Carrots", cauliflower_cup: "Cauliflower", peppers_cup: "Bell peppers",
    asparagus_cup: "Asparagus", mixed_veg_cup: "Mixed vegetables", zucchini_cup: "Zucchini",
    evoo: "Olive oil", avocado: "Avocado", hbe: "Hard-boiled egg", feta: "Feta", parmesan: "Parmesan",
    oats_cup: "Oats", banana: "Banana", berries_cup: "Mixed berries", blueberries_cup: "Blueberries", strawberries_cup: "Strawberries",
    cherries_cup: "Cherries", mango_cup: "Mango", spinach_cup: "Spinach", pumpkin_cup: "Pumpkin puree", raisins_cup: "Raisins",
    honey_tsp: "Honey", maple_tsp: "Maple syrup",
    chia_tsp: "Chia seeds", hemp_tsp: "Hemp hearts", walnuts_tsp: "Walnuts", pb_tsp: "Peanut butter",
    lettuce_cup: "Romaine lettuce", mixed_greens_cup: "Mixed greens", kale_cup: "Kale",
    cherry_tomato_cup: "Cherry tomatoes", cucumber_cup: "Cucumber", onion_cup: "Onion", corn_cup: "Corn",
    black_beans_cup: "Black beans", salad_rice: "A little white rice",
    almonds_oz: "Almonds", peanuts_oz: "Peanuts", cashews_oz: "Cashews", pistachios_oz: "Pistachios", pumpkin_seeds_oz: "Pumpkin seeds",
    pineapple: "Pineapple", peach: "Peaches", mango: "Mango", berries: "Mixed berries",
  };
  // Value → FOOD key (for in-stock tags and restriction checks).
  const PICK_FOOD_KEY = Object.assign({}, PROTEIN_FOOD_KEY, {
    evoo: "evoo_tsp", avocado: "avocado_oz", hbe: "hard_boiled_egg", feta: "feta_oz", parmesan: "parmesan_oz",
    salad_rice: "rice_cup", pineapple: "pineapple_cup", peach: "peach_cup", mango: "mango_cup", berries: "berries_cup",
  });
  function pickFoodKey(v) { return PICK_FOOD_KEY[v] || v; }

  /** Templates offered for a slot kind, minus ones a restriction makes impossible. */
  function pickTemplatesFor(kind, planOptions) {
    const pools = mealTypePools(planOptions || {});
    const allowed = kind === "snack" ? pools.snackTypes : pools.mealTypes;
    return PICK_TEMPLATES[kind === "snack" ? "snack" : "meal"].filter((t) => allowed.indexOf(t.id) !== -1);
  }

  /**
   * Ingredient steps for a template (in template order). Each step:
   * { id, title, min, max, options: [{ value, label, key }], required: [values], hidden (count of
   * options hidden by budget), note }.
   */
  function pickStepsFor(template, sel, planOptions) {
    planOptions = planOptions || {};
    const pools = mealTypePools(planOptions);
    const tier = pools.tier;
    const flags = pools.flags;
    sel = sel || {};
    const opt = (values) => values.filter((v) => foodAllowed(pickFoodKey(v), flags)).map((v) => ({ value: v, label: PICK_LABELS[v] || v, key: pickFoodKey(v) }));
    const step = (id, title, min, max, all, allowedValues, extra) => {
      const options = opt(allowedValues);
      const budgetHidden = all.filter((v) => allowedValues.indexOf(v) === -1 && foodAllowed(pickFoodKey(v), flags)).length;
      return Object.assign({ id, title, min: Math.min(min, options.length), max: Math.min(max, Math.max(options.length, 1)), options, required: [], hidden: budgetHidden }, extra || {});
    };
    const lowTier = !!tier.reduceVariety;
    const seedFats = ["chia_tsp", "hemp_tsp", "walnuts_tsp", "pb_tsp"];
    const powder = flags.dairy ? "plant protein powder" : "protein powder";
    if (template === "bowl") {
      const allProteins = ["beef", "turkey", "chicken", "chicken_thigh", "salmon", "cod", "shrimp", "eggs", "egg_whites"].concat(flags.vegetarian ? ["tofu"] : []);
      const carbs = lowTier ? ["rice_cup"] : BOWL_CARB_KEYS.slice();
      const eggProtein = (sel.protein || []).some((p) => p === "eggs" || p === "egg_whites");
      const fats = ["evoo", "avocado"].concat(eggProtein ? [] : ["hbe"]);
      return [
        step("protein", "a protein", 1, 1, allProteins, pools.bowlProteins),
        step("carb", "a carb", 1, 1, BOWL_CARB_KEYS, carbs),
        step("veg", "a vegetable", 1, 1, BOWL_VEG_KEYS, BOWL_VEG_KEYS),
        step("fat", "your fats", 1, 2, fats, fats, eggProtein ? { note: "Hard-boiled egg is skipped as a fat since eggs are already the protein." } : null),
      ];
    }
    if (template === "smoothie" || template === "oatmeal") {
      const smoothie = template === "smoothie";
      const fruitAll = ["banana", "berries_cup", "blueberries_cup", "strawberries_cup", "cherries_cup", "mango_cup"];
      // Tight budgets mirror the generator's cheap flavors (banana, raisins, pumpkin).
      const fruit = lowTier ? ["banana"] : fruitAll;
      const all = smoothie
        ? ["oats_cup"].concat(fruitAll, ["spinach_cup"])
        : ["oats_cup"].concat(fruitAll.filter((k) => k !== "mango_cup"), ["raisins_cup", "pumpkin_cup", "honey_tsp", "maple_tsp"]);
      const allowed = smoothie
        ? ["oats_cup"].concat(fruit, ["spinach_cup"])
        : ["oats_cup"].concat(fruit.filter((k) => k !== "mango_cup"), ["raisins_cup", "pumpkin_cup", "honey_tsp", "maple_tsp"]);
      const carbs = step("carbs", "your carbs", 1, 4, all, allowed, {
        note: (smoothie
          ? "Protein: " + powder + " is always included. 8 oz " + (flags.nut ? "soy" : "almond") + " milk is added for you."
          : "Protein: " + powder + " is always included. Oats are always the base; milk is added at 4 oz per ½ cup oats."),
      });
      if (!smoothie) carbs.required = ["oats_cup"];
      return [carbs, step("fats", "your fats", 1, 2, seedFats, seedFats)];
    }
    if (template === "salad_jar") {
      const allProteins = ["beef", "turkey", "chicken", "chicken_thigh", "salmon", "cod", "shrimp"].concat(flags.vegetarian ? ["tofu"] : []);
      const greens = ["lettuce_cup", "mixed_greens_cup", "spinach_cup", "kale_cup"];
      const veg = ["carrots_cup", "peppers_cup", "cherry_tomato_cup", "cucumber_cup", "onion_cup", "corn_cup"];
      const fats = ["evoo", "avocado", "hbe", "feta", "parmesan"];
      return [
        step("protein", "a protein", 1, 1, allProteins, pools.saladProteins),
        step("greens", "your greens", 1, lowTier ? 1 : 2, greens, lowTier ? ["lettuce_cup"] : greens),
        step("veg", "your vegetables", 1, lowTier ? 1 : 3, veg, veg),
        step("extras", "optional add-ins", 0, 2, ["black_beans_cup", "salad_rice"], ["black_beans_cup", "salad_rice"], { note: "Optional: ¼–½ cup beans and/or a little rice help hit your carb target." }),
        step("fat", "your fats", 1, 2, fats, fats),
      ];
    }
    if (template === "nut") {
      const all = ["almonds_oz", "peanuts_oz", "cashews_oz", "pistachios_oz"];
      return [step("nut", flags.nut ? "your seeds" : "a nut", 1, 1, flags.nut ? [] : all, pools.nutKeys)];
    }
    if (template === "greek" || template === "cottage") {
      return [
        step("fruit", "a fruit", 1, 1, ["pineapple", "peach", "mango", "berries"], pools.fruits),
        step("sweet", "a sweetener (optional)", 0, 1, ["honey_tsp", "maple_tsp"], ["honey_tsp", "maple_tsp"], { note: "Optional: 1–2 tsp if your carbs allow." }),
      ];
    }
    if (template === "hb_egg") {
      return [step("fruit", "a fruit", 1, 1, ["pineapple", "peach", "mango", "berries"], pools.fruits)];
    }
    return [];
  }

  /** True when a step's selection satisfies its limits. */
  function pickStepValid(st, chosen) {
    const vals = (chosen || []).filter((v) => st.options.some((o) => o.value === v));
    if (st.required.some((r) => vals.indexOf(r) === -1 && st.options.some((o) => o.value === r))) return false;
    return vals.length >= st.min && vals.length <= st.max;
  }

  function splitFatSpoons(ings, keys, fatLeft) {
    const share = Math.max(0, fatLeft) / keys.length;
    const cap = keys.length === 1 ? 6 : 3;
    keys.forEach((k) => {
      const tsp = clamp(Math.round(share / FOOD[k].f), 1, cap);
      ings.push(qtyLine(k, tsp, formatQty(tsp) + " tsp " + FOOD[k].name));
    });
  }

  const PICK_TITLE_WORD = {
    banana: "banana", berries_cup: "berry", blueberries_cup: "blueberry", strawberries_cup: "strawberry", cherries_cup: "cherry",
    mango_cup: "mango", spinach_cup: "green", oats_cup: "oat", pumpkin_cup: "pumpkin", raisins_cup: "raisin", honey_tsp: "honey", maple_tsp: "maple",
  };
  function pickedJarTitle(carbs, fats, noun) {
    const words = [];
    if ((fats || []).indexOf("pb_tsp") !== -1) words.push("peanut butter");
    (carbs || []).forEach((k) => {
      const w = PICK_TITLE_WORD[k];
      if (!w || (noun === "oatmeal" && k === "oats_cup")) return;
      if (words.indexOf(w) === -1 && words.length < 3) words.push(w);
    });
    if (!words.length) return noun === "oatmeal" ? "Classic oatmeal" : "Protein smoothie";
    const t = words.join(" ") + " " + noun;
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function buildPickedSmoothie(sel, targetCal, tg, milkKey, flags) {
    const carbs = sel.carbs || [];
    const fats = sel.fats || [];
    const ings = [];
    const scoops = proteinQtyForTarget(FOOD[proteinPowderKey(flags)].p, tg.p, 0.5, 2, 0.25);
    ings.push(qtyLine(proteinPowderKey(flags), scoops));
    const fruits = carbs.filter((k) => k !== "oats_cup" && k !== "spinach_cup");
    const others = fruits.filter((k) => k !== "banana");
    const fruitQty = {};
    if (fruits.indexOf("banana") !== -1) fruitQty.banana = others.length ? 0.5 : 1;
    others.forEach((k) => { fruitQty[k] = others.length === 1 ? (fruitQty.banana ? 0.75 : 1) : 0.5; });
    const pushFruit = () => fruits.map((k) => qtyLine(k, fruitQty[k]));
    let fruitLines = pushFruit();
    let used = sumIngredients(ings.concat(fruitLines));
    // Short on carbs and no oats picked: grow the picked fruit (banana ≤ 1, others ≤ 1½ cups).
    if (carbs.indexOf("oats_cup") === -1) {
      let guard = 0;
      while (used.c < tg.c - 8 && guard++ < 12) {
        let grew = false;
        if (fruitQty.banana != null && fruitQty.banana < 1) { fruitQty.banana = 1; grew = true; }
        else {
          const k = others.find((x) => fruitQty[x] < 1.5);
          if (k) { fruitQty[k] += 0.25; grew = true; }
        }
        if (!grew) break;
        fruitLines = pushFruit();
        used = sumIngredients(ings.concat(fruitLines));
      }
    }
    fruitLines.forEach((l) => ings.push(l));
    if (carbs.indexOf("spinach_cup") !== -1) ings.push(qtyLine("spinach_cup", 1));
    if (carbs.indexOf("oats_cup") !== -1) {
      used = sumIngredients(ings);
      const oatCups = clamp(Math.round(((tg.c - used.c) / FOOD.oats_cup.c) * 4) / 4, 0.25, 0.75);
      ings.push(qtyLine("oats_cup", oatCups, formatQty(oatCups) + " cup dry oats"));
    }
    const mk = milkKey || plantMilkKey(flags);
    ings.push(qtyLine(mk, 8, "8 oz " + FOOD[mk].name));
    used = sumIngredients(ings);
    splitFatSpoons(ings, fats, tg.f - used.f);
    return {
      title: pickedJarTitle(carbs, fats, "smoothie"),
      type: "smoothie",
      flavor: null,
      ingredients: ings,
      totals: roundMacros(sumIngredients(ings)),
      notes: ["Optional flavor: cinnamon or cacao"],
      targetGrams: tg,
      targetCal,
    };
  }

  function buildPickedOatmeal(sel, targetCal, tg, includeMilk, flags) {
    const carbs = sel.carbs || [];
    const fats = sel.fats || [];
    const ings = [];
    const scoops = proteinQtyForTarget(FOOD[proteinPowderKey(flags)].p, tg.p, 0.5, 2, 0.25);
    ings.push(qtyLine(proteinPowderKey(flags), scoops));
    let oatCups = clamp(Math.round(((tg.c * (2 / 3)) / FOOD.oats_cup.c) * 4) / 4, 0.5, 2);
    const extras = carbs.filter((k) => k !== "oats_cup");
    const fruitCount = extras.filter((k) => k !== "honey_tsp" && k !== "maple_tsp").length;
    const qty = {
      banana: fruitCount === 1 ? 1 : 0.5,
      berries_cup: 0.5, blueberries_cup: 0.5, strawberries_cup: 0.5,
      cherries_cup: fruitCount > 2 ? 0.5 : 0.75,
      raisins_cup: 0.125, pumpkin_cup: 1 / 3, honey_tsp: 1, maple_tsp: 1,
    };
    const build = () => {
      const list = ings.slice();
      list.push(qtyLine("oats_cup", oatCups, formatQty(oatCups) + " cup dry oats"));
      extras.forEach((k) => list.push(qtyLine(k, qty[k])));
      return list;
    };
    let list = build();
    let guard = 0;
    while (sumIngredients(list).c < tg.c - 10 && guard++ < 10) {
      const sw = extras.find((k) => (k === "honey_tsp" || k === "maple_tsp") && qty[k] < 2);
      if (sw) qty[sw] = 2;
      else if (oatCups < 2) oatCups += 0.25;
      else break;
      list = build();
    }
    if (includeMilk !== false) {
      const milkOz = Math.max(0, Math.round((oatCups / 0.5) * 4));
      const mk = plantMilkKey(flags);
      if (milkOz > 0) list.push(qtyLine(mk, milkOz, milkOz + " oz " + FOOD[mk].name));
    }
    splitFatSpoons(list, fats, tg.f - sumIngredients(list).f);
    return {
      title: pickedJarTitle(carbs, fats, "oatmeal"),
      type: "oatmeal",
      flavor: null,
      ingredients: list,
      totals: roundMacros(sumIngredients(list)),
      notes: ["Optional flavor: cinnamon, cacao, or a pinch of salt"],
      targetGrams: tg,
      targetCal,
      _oatCups: oatCups,
    };
  }

  function buildPickedSaladJar(sel, targetCal, tg, tier) {
    const protein = (sel.protein || [])[0] || "chicken";
    const pk = PROTEIN_FOOD_KEY[protein];
    const titles = {
      beef: "Ground beef salad jar", turkey: "Turkey salad jar", chicken: "Chicken salad jar", chicken_thigh: "Chicken thigh salad jar",
      salmon: "Salmon salad jar", cod: "Cod salad jar", shrimp: "Shrimp salad jar", tofu: "Tofu salad jar",
    };
    const extras = sel.extras || [];
    const ings = [qtyLine(pk, proteinQtyForTarget(FOOD[pk].p, tg.p, 3, 10, 0.5))];
    if (extras.indexOf("black_beans_cup") !== -1) {
      ings.push(qtyLine("black_beans_cup", extras.indexOf("salad_rice") !== -1 ? 0.25 : 0.5));
    }
    const greens = sel.greens || ["lettuce_cup"];
    greens.forEach((g, i) => {
      let cups;
      if (greens.length === 1) cups = 2.5;
      else if (g === "lettuce_cup") cups = 2;
      else cups = greens.indexOf("lettuce_cup") !== -1 ? 1 : 1.5;
      if (g === "kale_cup") cups = Math.min(cups, 2);
      ings.push(qtyLine(g, cups));
    });
    (sel.veg || []).forEach((vk, i) => {
      ings.push(qtyLine(vk, clamp(snapCupFraction(0.25 + ((i + 1) % 3) * 0.25), 0.25, 1)));
    });
    if (extras.indexOf("salad_rice") !== -1) {
      const need = tg.c - sumIngredients(ings).c;
      ings.push(qtyLine("rice_cup", clamp(snapCupFraction(need / FOOD.rice_cup.c), 0.25, 1)));
    }
    const fats = sel.fat || ["evoo"];
    const share = Math.max(0, tg.f - sumIngredients(ings).f) / fats.length;
    fats.forEach((fs) => {
      if (fs === "avocado") ings.push(qtyLine("avocado_oz", clamp(Math.round((share / FOOD.avocado_oz.f) * 2) / 2, 1, 3)));
      else if (fs === "hbe") ings.push(qtyLine("hard_boiled_egg", clamp(Math.round(share / FOOD.hard_boiled_egg.f), 1, 2)));
      else if (fs === "feta") ings.push(qtyLine("feta_oz", clamp(Math.round((share / FOOD.feta_oz.f) * 2) / 2, 0.5, 2)));
      else if (fs === "parmesan") ings.push(qtyLine("parmesan_oz", clamp(Math.round((share / FOOD.parmesan_oz.f) * 2) / 2, 0.5, 1.5)));
      else ings.push(qtyLine("evoo_tsp", clamp(Math.round(share / FOOD.evoo_tsp.f), 1, 3)));
    });
    return {
      title: titles[protein] || "Salad jar",
      type: "salad_jar",
      protein,
      ingredients: ings,
      totals: roundMacros(sumIngredients(ings)),
      notes: ["Season lightly to taste"],
      targetGrams: tg,
      targetCal,
    };
  }

  /** One picked slot → suggestion (portions from the template macro logic). */
  function buildPickedSuggestion(pick, targetCal, tg, planOptions, milkOverride) {
    planOptions = planOptions || {};
    const pools = mealTypePools(planOptions);
    const tier = pools.tier;
    const flags = pools.flags;
    const sel = (pick && pick.sel) || {};
    const t = pick && pick.template;
    let s;
    if (t === "bowl") {
      s = buildBowlSlot(sel.protein[0], targetCal, tg, { vegKey: sel.veg[0], carbKey: sel.carb[0], tier, fatStyles: sel.fat });
    } else if (t === "smoothie") s = buildPickedSmoothie(sel, targetCal, tg, milkOverride, flags);
    else if (t === "oatmeal") s = buildPickedOatmeal(sel, targetCal, tg, milkOverride !== "none", flags);
    else if (t === "salad_jar") s = buildPickedSaladJar(sel, targetCal, tg, tier);
    else if (t === "nut") s = buildNutOnlySnack(sel.nut[0], targetCal, tg);
    else if (t === "hb_egg") {
      const fruit = sel.fruit[0];
      const ings = [qtyLine("hard_boiled_egg", clamp(Math.round(tg.p / FOOD.hard_boiled_egg.p), 1, 3))];
      addFruitCarbs(ings, fruit, tg.c - sumIngredients(ings).c, targetCal - sumIngredients(ings).kcal, { sweetener: null });
      s = { title: "Hard boiled eggs & " + fruit, type: "hb_egg_snack", ingredients: ings, totals: roundMacros(sumIngredients(ings)), notes: [], targetGrams: tg, targetCal };
    } else {
      const kind = t === "cottage" ? "cottage" : "greek";
      const fruit = sel.fruit[0];
      const base = buildLeanSnackProtein(kind, fruit, tg.p, tg.f);
      addFruitCarbs(base.ings, fruit, tg.c - sumIngredients(base.ings).c, targetCal - sumIngredients(base.ings).kcal,
        { sweetener: (sel.sweet || [])[0] || null });
      const fruitWord = { pineapple: "pineapple", peach: "peach", mango: "mango", berries: "berries" }[fruit] || "fruit";
      s = {
        title: (kind === "cottage" ? "Cottage cheese & " : "Greek yogurt & ") + fruitWord,
        type: kind === "cottage" ? "cottage_cheese" : "greek_yogurt",
        ingredients: base.ings, totals: roundMacros(sumIngredients(base.ings)), notes: [], targetGrams: tg, targetCal,
      };
    }
    s._picked = { template: t, sel: JSON.parse(JSON.stringify(sel)) };
    return restrictSuggestion(s, flags);
  }

  // Adjustable picked ingredients: [step, min, max] in the food's unit, by macro role.
  const PICK_TUNE = {
    beef_oz: ["p", 0.5, 3, 10], turkey_oz: ["p", 0.5, 3, 10], chicken_oz: ["p", 0.5, 3, 10], chicken_thigh_oz: ["p", 0.5, 3, 10],
    salmon_oz: ["p", 0.5, 3, 10], cod_oz: ["p", 0.5, 3, 10], shrimp_oz: ["p", 0.5, 3, 10], tofu_oz: ["p", 0.5, 3, 12],
    egg: ["p", 1, 2, 8], egg_white: ["p", 1, 3, 8], protein_scoop: ["p", 0.5, 0.5, 2], plant_protein_scoop: ["p", 0.5, 0.5, 2],
    cottage_lf_cup: ["p", 0.25, 0.5, 2], greek_nonfat_cup: ["p", 0.25, 0.5, 2],
    rice_cup: ["c", 0.25, 0.25, 2], brown_rice_cup: ["c", 0.25, 0.5, 2], quinoa_cup: ["c", 0.25, 0.5, 2],
    potato_oz: ["c", 1, 4, 16], sweet_potato_oz: ["c", 1, 4, 16], oats_cup: ["c", 0.25, 0.25, 2],
    banana: ["c", 0.5, 0.5, 1], berries_cup: ["c", 0.25, 0.25, 1.5], blueberries_cup: ["c", 0.25, 0.25, 1.5],
    strawberries_cup: ["c", 0.25, 0.25, 1.5], cherries_cup: ["c", 0.25, 0.25, 1.5], mango_cup: ["c", 0.25, 0.25, 1.5],
    pineapple_cup: ["c", 0.25, 0.5, 2], peach_cup: ["c", 0.25, 0.5, 2], black_beans_cup: ["c", 0.25, 0.25, 0.5],
    evoo_tsp: ["f", 1, 1, 3], avocado_oz: ["f", 0.5, 1, 4], feta_oz: ["f", 0.5, 0.5, 2], parmesan_oz: ["f", 0.5, 0.5, 1.5],
    chia_tsp: ["f", 1, 1, 6], hemp_tsp: ["f", 1, 1, 6], walnuts_tsp: ["f", 1, 1, 6], pb_tsp: ["f", 1, 1, 6],
    almonds_oz: ["f", 0.25, 0.5, 3], peanuts_oz: ["f", 0.25, 0.5, 3], cashews_oz: ["f", 0.25, 0.5, 3],
    pistachios_oz: ["f", 0.25, 0.5, 3], pumpkin_seeds_oz: ["f", 0.25, 0.5, 3],
  };
  const TBSP_TO_TSP = { chia_tbsp: "chia_tsp", hemp_tbsp: "hemp_tsp", walnuts_tbsp: "walnuts_tsp", pb_tbsp: "pb_tsp" };

  /**
   * Tune a picked day toward ±100 kcal / ±2% macros by nudging only the
   * ingredients the user picked (never adding or removing foods). Greedy: each
   * pass applies the single ±1-step change that most improves the day.
   */
  function tunePickedDay(results, macroPct, dailyCalories) {
    const score = () => {
      const tot = results.reduce((a, r) => ({ kcal: a.kcal + r.suggestion.totals.kcal, p: a.p + r.suggestion.totals.p, c: a.c + r.suggestion.totals.c, f: a.f + r.suggestion.totals.f }), { kcal: 0, p: 0, c: 0, f: 0 });
      const pct = macroPercents(tot);
      let sc = Math.max(0, Math.abs(tot.kcal - dailyCalories) - 60) / 40;
      ["p", "c", "f"].forEach((m) => { sc += Math.max(0, Math.abs(pct[m] - macroPct[m]) - 1.5); });
      results.forEach((r) => {
        const tol = r.kind === "snack" ? 75 : 150;
        sc += Math.max(0, Math.abs(r.suggestion.totals.kcal - r.calories) - tol) / 20;
      });
      return sc;
    };
    const lineAt = (key, qty) => {
      if (FOOD[key].unit === "tsp") return qtyLine(key, qty, formatQty(qty) + " tsp " + FOOD[key].name);
      return qtyLine(key, qty);
    };
    let current = score();
    for (let pass = 0; pass < 40 && current > 0; pass++) {
      let best = null;
      results.forEach((r, ri) => {
        r.suggestion.ingredients.forEach((ing, ii) => {
          if (!ing || ing._note || !ing._key) return;
          const baseKey = TBSP_TO_TSP[ing._key] || ing._key;
          const rule = PICK_TUNE[baseKey];
          if (!rule) return;
          if (baseKey === "oats_cup" && r.suggestion.type === "oatmeal" && rule) { /* oat base: keep ≥ ½ cup */ }
          const qty = TBSP_TO_TSP[ing._key] ? ing._qty * 3 : ing._qty;
          const min = baseKey === "oats_cup" && r.suggestion.type === "oatmeal" ? 0.5 : rule[2];
          const maxQ = baseKey === "oats_cup" && r.suggestion.type === "smoothie" ? 0.75 : rule[3];
          [-1, 1].forEach((dir) => {
            const nq = Math.round((qty + dir * rule[1]) * 1000) / 1000;
            if (nq < min - 1e-9 || nq > maxQ + 1e-9) return;
            const prevIngs = r.suggestion.ingredients;
            const prevTotals = r.suggestion.totals;
            const next = prevIngs.slice();
            next[ii] = lineAt(baseKey, nq);
            r.suggestion.ingredients = next;
            r.suggestion.totals = roundMacros(sumIngredients(next));
            const sc = score();
            r.suggestion.ingredients = prevIngs;
            r.suggestion.totals = prevTotals;
            if (sc < current - 0.05 && (!best || sc < best.sc)) best = { sc, ri, ii, key: baseKey, nq };
          });
        });
      });
      if (!best) break;
      const r = results[best.ri];
      const next = r.suggestion.ingredients.slice();
      next[best.ii] = lineAt(best.key, best.nq);
      r.suggestion.ingredients = next;
      r.suggestion.totals = roundMacros(sumIngredients(next));
      current = best.sc;
    }
    return results;
  }

  /**
   * Build a full plan from picks (one { template, sel } per schedule slot).
   * Mirrors the generator's day-level milk rules, then tunes picked portions.
   */
  function buildPickedPlan(answers, picks, variant) {
    const calories = answers.calorieMode === "help"
      ? estimateCalories(answers.weightLbs, answers.weightGoal, answers.activity)
      : answers.calories;
    const macro = macrosFromWeightGoal(answers.weightGoal);
    const macroPct = { p: macro.p, c: macro.c, f: macro.f };
    let meals = answers.meals;
    let snacks = answers.snacks;
    if (answers.mealOption && MEAL_OPTIONS[answers.mealOption]) {
      meals = MEAL_OPTIONS[answers.mealOption].meals;
      snacks = MEAL_OPTIONS[answers.mealOption].snacks;
    }
    const planOptions = { budget: answers.budget, tierOverrides: answers._tierOverrides, restrictions: answers.restrictions };
    const flags = restrictionFlags(answers.restrictions);
    const slots = buildSchedule(calories, meals, snacks);
    const results = slots.map((slot, i) => {
      const tg = gramsExact(slot.calories, macroPct);
      return Object.assign({}, slot, {
        targetMacros: gramsFromPct(slot.calories, macroPct),
        suggestion: buildPickedSuggestion(picks[i], slot.calories, { p: tg.p, c: tg.c, f: tg.f }, planOptions),
      });
    });
    const dayTot = () => results.reduce((a, r) => ({ kcal: a.kcal + r.suggestion.totals.kcal, p: a.p + r.suggestion.totals.p }), { kcal: 0, p: 0 });
    const dayTargetP = (calories * macroPct.p) / 100 / 4;
    // Smoothie milk: dairy skim/2% when the day is short (same rule as generated plans; never when dairy-free).
    let t = dayTot();
    if (!flags.dairy && t.kcal <= calories && t.p <= dayTargetP + 8 && (t.kcal < calories - 80 || t.p < dayTargetP - 8)) {
      const r = results.find((x) => x.suggestion.type === "smoothie");
      if (r) {
        const milkKey = t.kcal < calories - 200 && t.p >= dayTargetP - 5 ? "milk_2pct_oz" : "milk_skim_oz";
        const rebuilt = buildPickedSuggestion(picks[results.indexOf(r)], r.calories, r.suggestion.targetGrams, planOptions, milkKey);
        const nk = t.kcal - r.suggestion.totals.kcal + rebuilt.totals.kcal;
        const np = t.p - r.suggestion.totals.p + rebuilt.totals.p;
        if (nk <= calories + 100 && np <= dayTargetP + 12) r.suggestion = rebuilt;
      }
    }
    // Oatmeal milk: omit if the day would pass the goal by more than 100.
    t = dayTot();
    if (t.kcal > calories + 100) {
      results.forEach((r, i) => {
        if (r.suggestion.type !== "oatmeal") return;
        const rebuilt = buildPickedSuggestion(picks[i], r.calories, r.suggestion.targetGrams, planOptions, "none");
        const cur = dayTot().kcal;
        if (cur - r.suggestion.totals.kcal + rebuilt.totals.kcal < cur) {
          rebuilt.notes = rebuilt.notes.concat(["Milk omitted to stay within daily calorie tolerance"]);
          r.suggestion = rebuilt;
        }
      });
    }
    tunePickedDay(results, macroPct, calories);
    results.forEach((r) => {
      const picked = r.suggestion._picked;
      finalizeSuggestion(restrictSuggestion(r.suggestion, flags));
      r.suggestion._picked = picked;
    });
    const plan = recomputePlanFromSchedule(answers, results, variant || 0);
    plan.builtBy = "pick";
    return plan;
  }

  function nutritionOverview(plan) {
    const bd = (plan.micros && plan.micros.breakdown) || {};
    const schedule = plan.schedule || [];
    const titles = schedule.map((s) => (s.suggestion && s.suggestion.title) || "").filter(Boolean);
    const types = schedule.map((s) => (s.suggestion && s.suggestion.type) || "").filter(Boolean);
    const sentences = [];

    const fiber = bd.fiber_g;
    if (fiber && fiber.pct >= 75) {
      sentences.push(
        "Fiber lands near " +
          fiber.pct +
          "% of the daily suggestion, so bowls of oats, beans, and produce help support digestion and steady energy."
      );
    } else if (titles.some((t) => /oatmeal|oat/i.test(t))) {
      sentences.push(
        "Oatmeal in the rotation brings soluble fiber that can support digestion and help keep you full between meals."
      );
    }

    const vitC = bd.vitC_mg;
    if (vitC && vitC.pct >= 70) {
      sentences.push(
        "Vitamin C is at about " +
          vitC.pct +
          "% of the daily mark from fruit and vegetables, which is useful for everyday immune support."
      );
    }

    const pot = bd.potassium_mg;
    if (pot && pot.pct >= 60) {
      sentences.push(
        "Potassium from fruit and veg sits around " +
          pot.pct +
          "% of the suggested intake, rounding out electrolytes alongside the day’s proteins."
      );
    }

    const iron = bd.iron_mg;
    if (iron && iron.pct >= 55) {
      sentences.push(
        "Iron from lean proteins and greens covers roughly " +
          iron.pct +
          "% of the daily suggestion, which helps with energy metabolism."
      );
    }

    const cal = bd.calcium_mg;
    if (cal && cal.pct >= 55) {
      sentences.push(
        "Calcium from dairy, fortified milks, or greens reaches about " +
          cal.pct +
          "% of the daily target."
      );
    }

    const mag = bd.magnesium_mg;
    if (mag && mag.pct >= 55 && sentences.length < 5) {
      sentences.push(
        "Magnesium from oats, nuts, and produce sits near " +
          mag.pct +
          "% of the suggested amount, supporting muscle and recovery needs."
      );
    }

    if (types.includes("smoothie") || titles.some((t) => /smoothie/i.test(t))) {
      if (sentences.length < 5) {
        sentences.push(
          "Smoothie slots pack fruit and protein powder into an easy prep that still contributes meaningful micronutrients."
        );
      }
    }
    if (types.includes("bowl") || titles.some((t) => /bowl|salad/i.test(t))) {
      if (sentences.length < 5) {
        sentences.push(
          "Savory bowls and jars keep vegetables in the mix so the day isn’t only carbs and protein powder."
        );
      }
    }
    if (titles.some((t) => /egg|yogurt|cottage|almond|nut/i.test(t)) && sentences.length < 5) {
      sentences.push(
        "Snacks lean on eggs, yogurt, cottage cheese, or nuts so protein stays available between larger meals."
      );
    }

    while (sentences.length < 3) {
      const fillers = [
        "Produce choices are spread across different colors so vitamin and mineral coverage is broader than a single fruit or veg repeated all day.",
        "Macros stay close to your targets while ingredients stay prep-friendly for a once-a-week cook.",
        "Overall, the day balances protein-forward meals with fiber-rich carbs and measured fats for satiety.",
      ];
      sentences.push(fillers[sentences.length % fillers.length]);
    }

    const blurb = sentences.slice(0, 5).join(" ");
    return { blurb };
  }

  /* ── doc32: Suggested supplements ─────────────────────────────────────────
   * Plan-aware and restriction-aware. From the nutrition audit: vitamin D was
   * low in every plan; EPA/DHA is near zero without fish; iron can run short on
   * a cut for anyone who menstruates (the app doesn't know sex, so it's
   * phrased conditionally); creatine is the common evidence-based lifter pick;
   * vegans need B12. No brands or links.
   */
  const FISH_KEYS = { salmon_oz: "salmon", cod_oz: "cod" };

  function supplementsForPlan(plan, answers) {
    plan = plan || {};
    const bd = (plan.micros && plan.micros.breakdown) || {};
    const restr = Array.isArray(plan.restrictions) ? plan.restrictions : (answers && answers.restrictions);
    const flags = restrictionFlags(restr);
    const days = prepDaysFor(plan);
    let goal = answers && answers.weightGoal;
    const mac = plan.daily && plan.daily.macros;
    if (mac) {
      const g = ["lose", "maintain", "gain"].find((x) => { const m = macrosFromWeightGoal(x); return m.p === mac.p && m.c === mac.c && m.f === mac.f; });
      if (g) goal = g;
    }
    // Fish servings a week: fish slots per day × plan days (the day's menu repeats all week).
    let fishSlots = 0;
    let salmonSlots = 0;
    (plan.schedule || []).forEach((slot) => {
      const keys = ((slot.suggestion && slot.suggestion.ingredients) || []).map((i) => i && i._key);
      if (keys.some((k) => FISH_KEYS[k])) fishSlots += 1;
      if (keys.indexOf("salmon_oz") !== -1) salmonSlots += 1;
    });
    const fishWeek = fishSlots * days;
    const salmonWeek = salmonSlots * days;
    const amt = (m) => (m ? (Math.abs(m.amount) >= 10 ? Math.round(m.amount) : Math.round(m.amount * 10) / 10) + " " + m.unit : "");
    const items = [];

    const d = bd.vitD_mcg;
    items.push({
      id: "vitamin_d",
      icon: "☀️",
      name: flags.vegan ? "Vitamin D (vegan D3 or D2)" : "Vitamin D3",
      tag: "Low in your plan",
      why: (d ? "Your plan gets about " + amt(d) + " a day (" + Math.round(d.pct) + "% of the " + d.target + " " + d.unit + " target). " : "") +
        "Few everyday foods have much vitamin D, and every Pure Prep plan comes up short." +
        (flags.vegan ? " Most D3 comes from sheep's wool, so pick one labeled vegan (lichen-sourced) or use D2." : ""),
      dose: "1,000–2,000 IU (25–50 mcg) a day, with a meal",
    });

    const noFish = flags.fish; // vegetarian, vegan or fish/shellfish-free
    if (noFish) {
      items.push({
        id: "omega3",
        icon: "🌿",
        name: "Algae-based omega-3 (EPA + DHA)",
        tag: "Low in your plan",
        why: "Your plan skips fish, so it has almost none of the omega-3s EPA and DHA (heart and brain health). Algae oil is where fish get theirs, so it fits " +
          (flags.vegan ? "a vegan" : flags.vegetarian ? "a vegetarian" : "a fish-free") + " diet.",
        dose: "250–500 mg combined EPA + DHA a day, with food",
      });
    } else if (fishWeek >= 2) {
      items.push({
        id: "fish_oil",
        icon: "🐟",
        name: "Fish oil (omega-3 EPA + DHA)",
        tag: "Optional",
        soft: true,
        why: salmonWeek >= 2
          ? "You're eating salmon about " + salmonWeek + " times a week, which already covers EPA and DHA for most people. Only worth it on weeks without fish."
          : "You're eating fish about " + fishWeek + " times a week. Cod is lean and fairly low in omega-3s, so a small dose is optional.",
        dose: "If you take it: 250 mg combined EPA + DHA a day, with food",
      });
    } else {
      items.push({
        id: "fish_oil",
        icon: "🐟",
        name: "Fish oil (omega-3 EPA + DHA)",
        tag: "Low in your plan",
        why: (fishWeek === 1 ? "Your plan has fish only once a week" : "Your plan has no fish") +
          ", so it's very low in the omega-3s EPA and DHA (heart and brain health). Guidelines suggest about 2 servings of fish a week.",
        dose: "250–500 mg combined EPA + DHA a day, with food",
      });
    }

    const iron = bd.iron_mg;
    if (goal === "lose" || flags.vegetarian || (iron && iron.pct < 60)) {
      items.push({
        id: "iron",
        icon: "🍃",
        name: "Iron",
        tag: "Only if it applies to you",
        conditional: true,
        why: "Only if you menstruate or a blood test showed low iron: women 19–50 need about 18 mg a day" +
          (iron ? " and your plan gives about " + amt(iron) + " (" + Math.round(iron.pct) + "%)" : "") + "." +
          (goal === "lose" ? " Eating less on a cut makes it harder to get enough." : "") +
          (flags.vegetarian ? " Iron from plants is absorbed less well, so pair beans and greens with vitamin C." : "") +
          " Men and post-menopausal women usually need only 8 mg and shouldn't take iron unless told to.",
        dose: "Often 18 mg a day, only if your doctor agrees",
      });
    }

    if (flags.vegan) {
      items.push({
        id: "b12",
        icon: "🌱",
        name: "Vitamin B12",
        tag: "Needed on a vegan diet",
        why: "B12 comes almost only from animal foods, so vegans need a supplement or fortified foods to avoid a deficiency.",
        dose: "25–100 mcg a day (or 1,000 mcg two to three times a week)",
      });
    }

    items.push({
      id: "creatine",
      icon: "💪",
      name: "Creatine monohydrate",
      tag: "If you lift",
      conditional: true,
      why: "If you strength train, it's the best-studied supplement for strength and muscle gains." +
        (flags.vegetarian ? " Meat-free diets have less creatine to start with, so the benefit may be bigger, and it's made synthetically (vegan-friendly)." : "") +
        " Skip it if you don't lift.",
      dose: "3–5 g a day, any time of day; no loading phase needed",
    });

    return {
      items,
      disclaimer: "Not medical advice — check with your doctor before starting any supplement, especially if you're pregnant, nursing, take medication or have a health condition.",
    };
  }

  function supplementsHtml(plan, answers) {
    const r = supplementsForPlan(plan, answers);
    const lis = r.items.map((it) =>
      '<li class="mp-supp' + (it.soft ? " soft" : "") + '" data-supp="' + prepEsc(it.id) + '">' +
      '<div class="mp-supp-head"><span class="mp-supp-ico" aria-hidden="true">' + it.icon + "</span><strong>" + prepEsc(it.name) + "</strong>" +
      '<span class="mp-supp-tag' + (it.soft ? " soft" : it.conditional ? " cond" : "") + '">' + prepEsc(it.tag) + "</span></div>" +
      '<p class="mp-supp-why">' + prepEsc(it.why) + "</p>" +
      '<p class="mp-supp-dose"><b>Typical dose:</b> ' + prepEsc(it.dose) + "</p></li>"
    ).join("");
    return '<div class="mp-card mp-supps"><p class="mp-hint">Based on this plan\'s nutrition — a few gaps food alone doesn\'t easily cover.</p>' +
      '<ul class="mp-supp-list">' + lis + "</ul>" +
      '<p class="mp-supp-disclaimer">' + prepEsc(r.disclaimer) + "</p></div>";
  }

  function macroPieHtml(macros, centerStrong, centerLabel) {
    const p = Number(macros.p) || 0;
    const c = Number(macros.c) || 0;
    const f = Number(macros.f) || 0;
    const pEnd = p;
    const cEnd = p + c;
    const style =
      "background: conic-gradient(" +
      "#5a7a52 0 " +
      pEnd +
      "%, " +
      "#c4785a " +
      pEnd +
      "% " +
      cEnd +
      "%, " +
      "#d4a84b " +
      cEnd +
      "% 100%)";
    return (
      '<div class="mp-macro-pie" style="' +
      style +
      '"><div class="mp-macro-pie-hole"><strong>' +
      centerStrong +
      "</strong><span>" +
      centerLabel +
      "</span></div></div>"
    );
  }

  /* ── UI ── */

  function createOnboarding(root, opts) {
    opts = opts || {};
    const answers = {
      budget: 400,
      cadence: "every_other_week",
      calorieMode: "known",
      calories: 2000,
      weightLbs: null,
      weightGoal: null,
      activity: null,
      mealOption: "3m2s",
      meals: 3,
      snacks: 2,
      daysPerWeek: 6,
      selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
      restrictions: [],
    };
    let step = 0;
    // Random seed so each questionnaire run gets a different meal mix
    // (assignSuggestions picks proteins/flavors from this variant).
    function randomPlanVariant() {
      return Math.floor(Math.random() * 64);
    }
    let planVariant = randomPlanVariant();

    if (opts.answers) Object.assign(answers, opts.answers);
    if (opts.inventory && opts.inventory.length) {
      answers._inventory = opts.inventory.map((it) => Object.assign({}, it));
    }
    if (opts.plan) {
      answers.__lockedPlan = opts.plan;
      // Refresh grocery so leftover inventory is credited on Update / Pick new.
      if (answers._inventory && answers._inventory.length && opts.plan.schedule) {
        answers.__lockedPlan = Object.assign({}, opts.plan, {
          grocery: buildGroceryList(
            opts.plan.schedule,
            answers,
            opts.plan.budgetTier
          ),
        });
      }
    }

    function steps() {
      const list = ["budget", "cadence", "calorieMode"];
      if (answers.calorieMode === "known") {
        list.push("calories");
        // Drive: ask weight goal after calories (skip if already given via Help me find out)
        list.push("weightGoal");
      }
      if (answers.calorieMode === "help") list.push("calorieHelp");
      list.push("restrictions");
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
          // doc32: choose "Let's pick our meals" or "Give me some ideas" first.
          pickState = null;
          showBuildChoice();
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
                placeholder="e.g. 400" value="${answers.budget ?? 400}" />
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
                placeholder="e.g. 2000" value="${answers.calories ?? 2000}" />
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

      if (id === "weightGoal") {
        const body = el(`<div></div>`);
        body.appendChild(
          radioGroup(
            "weightGoal",
            [
              { value: "lose", label: "Lose" },
              { value: "maintain", label: "Maintain" },
              { value: "gain", label: "Gain" },
            ],
            answers.weightGoal || "maintain"
          )
        );
        body.appendChild(
          el(
            `<p class="mp-hint">Macro targets follow your weight goal (loss 33/42/25, maintain 28/42/30, gain 25/45/30). Weight is only needed when using Help me find out for calories.</p>`
          )
        );
        ask("What is your weight goal?", body, () => {
          const v = selectedRadio("weightGoal");
          if (!v) return "Pick a weight goal.";
          answers.weightGoal = v;
        });
      }

      if (id === "restrictions") {
        const cur = normalizeRestrictions(answers.restrictions);
        const body = el(`<div></div>`);
        const box = el(`<div class="mp-options mp-restrictions"></div>`);
        [{ id: "none", label: "None" }].concat(RESTRICTION_OPTIONS).forEach((o) => {
          const on = o.id === "none" ? !cur.length : cur.indexOf(o.id) !== -1;
          box.appendChild(el(
            `<label class="mp-option${on ? " selected" : ""}">
              <input type="checkbox" name="restriction" value="${o.id}" ${on ? "checked" : ""} />
              <span>${o.label}</span>
            </label>`
          ));
        });
        box.addEventListener("change", (e) => {
          const t = e.target;
          if (!t || t.name !== "restriction") return;
          const all = Array.from(box.querySelectorAll('input[name="restriction"]'));
          // "None" is exclusive: picking it clears the rest, picking anything clears "None".
          if (t.value === "none" && t.checked) all.forEach((n) => { if (n !== t) n.checked = false; });
          if (t.value !== "none" && t.checked) all.forEach((n) => { if (n.value === "none") n.checked = false; });
          all.forEach((n) => n.closest(".mp-option").classList.toggle("selected", n.checked));
        });
        body.appendChild(box);
        body.appendChild(el(
          `<p class="mp-hint" style="margin-top:10px">Pick all that apply. We'll leave those foods out of every plan, reroll and suggestion. Vegan covers vegetarian, dairy-free and egg-free; dairy-free plans use plant protein powder, and nut-free swaps almond milk for soy milk. Pure Prep's menu has no pork, so pork-free is always met.</p>`
        ));
        ask("Any dietary restrictions?", body, () => {
          const checked = Array.from(root.querySelectorAll('input[name="restriction"]:checked')).map((n) => n.value);
          if (!checked.length) return "Pick at least one option (or None).";
          answers.restrictions = normalizeRestrictions(checked.filter((v) => v !== "none"));
        });
      }

      if (id === "meals") {
        ask(
          "How many meals do you prefer per day?",
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
          "How many days per week will you follow your plan?",
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

    /* ── doc32: build choice + "Let's pick our meals" wizard ── */
    const fromQuestionnaire = opts.startAt !== "results";
    let pickState = null;
    let lastBuildMode = null;

    function escText(t) {
      return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    /** Shared step chrome (progress, label, title, Back / Dashboard / Next). */
    function frame(o) {
      clear();
      root.appendChild(el(`<div class="mp-progress"><span style="width:${Math.max(4, Math.min(100, Math.round(o.pct || 0)))}%"></span></div>`));
      const wrap = el(`<section class="mp-step mp-build"${o.id ? ` id="${o.id}"` : ""}></section>`);
      wrap.appendChild(el(`<div class="step-label">${escText(o.label)}</div>`));
      wrap.appendChild(el(`<h2 class="mp-q">${escText(o.title)}</h2>`));
      wrap.appendChild(o.body);
      const err = el(`<p class="mp-error" hidden></p>`);
      wrap.appendChild(err);
      const nav = el(`<div class="mp-nav"></div>`);
      const back = el(`<button type="button" class="mp-back">Back</button>`);
      back.disabled = !o.onBack;
      if (o.onBack) back.onclick = o.onBack;
      const dash = el(`<button type="button" class="mp-back" id="dashLink">Dashboard</button>`);
      dash.onclick = () => {
        root.dispatchEvent(new CustomEvent("pureprep-goto", { detail: { screen: "home", save: false }, bubbles: true }));
      };
      const next = el(`<button type="button" class="mp-next">${escText(o.nextLabel || "Next")}</button>`);
      if (o.onNext) next.onclick = () => { if (!next.disabled) o.onNext(); };
      else next.disabled = true;
      nav.appendChild(back);
      nav.appendChild(dash);
      nav.appendChild(next);
      wrap.appendChild(nav);
      root.appendChild(wrap);
      return { wrap, next, err };
    }

    function optionRow(type, name, value, title, desc, checked, extra) {
      return el(
        `<label class="mp-option${checked ? " selected" : ""}${extra && extra.locked ? " locked" : ""}">
          <input type="${type}" name="${name}" value="${escText(value)}" ${checked ? "checked" : ""} ${extra && extra.locked ? "disabled" : ""} />
          <span class="mp-option-text"><span class="mp-option-title">${escText(title)}${extra && extra.tag ? ` <span class="mp-pick-tag">${escText(extra.tag)}</span>` : ""}</span>${desc ? `<small class="mp-option-desc">${escText(desc)}</small>` : ""}</span>
        </label>`
      );
    }

    function showBuildChoice() {
      const body = el(`<div class="mp-options mp-build-choice"></div>`);
      body.appendChild(optionRow("radio", "buildMode", "pick", "Let's pick our meals",
        "Choose a template and ingredients for each meal and snack. We'll portion everything to hit your targets.", lastBuildMode === "pick"));
      body.appendChild(optionRow("radio", "buildMode", "ideas", "Give me some ideas",
        "We'll suggest a full day of meals for you. You can reroll any of them.", lastBuildMode === "ideas"));
      const f = frame({
        id: "buildChoice",
        label: "Build your meal plan",
        title: "How would you like to build your meals?",
        body,
        pct: 100,
        onBack: fromQuestionnaire ? () => { step = steps().length - 1; render(); } : null,
        onNext: () => {
          const v = selectedRadio("buildMode");
          if (!v) return;
          lastBuildMode = v;
          if (v === "ideas") {
            if (fromQuestionnaire) {
              planVariant = randomPlanVariant();
              answers.__lockedPlan = null;
              answers._slotVariants = [];
            }
            showResult();
          } else {
            startPick();
          }
        },
      });
      f.next.disabled = !lastBuildMode;
      body.addEventListener("change", () => {
        body.querySelectorAll(".mp-option").forEach((n) => n.classList.toggle("selected", n.querySelector("input").checked));
        f.next.disabled = !selectedRadio("buildMode");
      });
    }

    function pickPlanOptions() {
      return { budget: answers.budget, tierOverrides: answers._tierOverrides, restrictions: answers.restrictions };
    }

    function startPick() {
      if (!pickState) {
        const calories = answers.calorieMode === "help"
          ? estimateCalories(answers.weightLbs, answers.weightGoal, answers.activity)
          : answers.calories;
        const mo = answers.mealOption && MEAL_OPTIONS[answers.mealOption];
        const slots = buildSchedule(calories, mo ? mo.meals : answers.meals, mo ? mo.snacks : answers.snacks);
        pickState = { slots, i: 0, step: 0, picks: slots.map(() => ({ template: null, sel: {} })) };
      } else {
        pickState.i = 0;
        pickState.step = 0;
      }
      renderPick();
    }

    function pickBack() {
      const ps = pickState;
      if (ps.step > 0) ps.step -= 1;
      else if (ps.i > 0) {
        ps.i -= 1;
        const pk = ps.picks[ps.i];
        ps.step = pk.template ? pickStepsFor(pk.template, pk.sel, pickPlanOptions()).length : 0;
      } else {
        showBuildChoice();
        return;
      }
      renderPick();
    }

    function stockKeys() {
      const have = {};
      (answers._inventory || []).forEach((it) => {
        if (it && it.key && Number(it.qtyRemaining) > 0) have[groceryKey(it.key)] = true;
      });
      return have;
    }

    function renderPick() {
      const ps = pickState;
      const po = pickPlanOptions();
      const slot = ps.slots[ps.i];
      const pk = ps.picks[ps.i];
      const total = ps.slots.length;
      const lastSlot = ps.i === total - 1;
      const templates = pickTemplatesFor(slot.kind, po);
      const tplLabel = (id) => {
        const t = PICK_TEMPLATES[slot.kind === "snack" ? "snack" : "meal"].find((x) => x.id === id);
        return t ? t.label : id;
      };
      if (ps.step === 0) {
        const body = el(`<div></div>`);
        if (!templates.length) {
          // Defensive: a restriction combination that leaves this slot without any protein.
          body.appendChild(el(`<p class="mp-pick-empty">Your dietary restrictions leave no protein option for ${escText(slot.name.toLowerCase())}, so we can't build it. Go back and loosen a restriction, or edit them later on your Profile.</p>`));
          frame({ label: slot.name, title: slot.name + ": no options fit", body, pct: (ps.i / total) * 100, onBack: pickBack });
          return;
        }
        body.appendChild(el(`<p class="mp-hint mp-pick-intro">${escText(slot.name)} of ${total} · about ${slot.calories} cal. Pick a template; next you'll choose what goes in it.</p>`));
        const box = el(`<div class="mp-options mp-pick-templates"></div>`);
        if (pk.template && !templates.some((t) => t.id === pk.template)) { pk.template = null; pk.sel = {}; }
        templates.forEach((t) => box.appendChild(optionRow("radio", "pickTemplate", t.id, t.label, t.desc, pk.template === t.id)));
        body.appendChild(box);
        const f = frame({
          id: "pickTemplateStep",
          label: slot.name + " · template",
          title: slot.name + ": pick a template",
          body,
          pct: (ps.i / total) * 100,
          onBack: pickBack,
          onNext: () => {
            const v = selectedRadio("pickTemplate");
            if (!v) return;
            if (v !== pk.template) { pk.template = v; pk.sel = {}; }
            ps.step = 1;
            renderPick();
          },
        });
        f.next.disabled = !pk.template;
        box.addEventListener("change", () => {
          box.querySelectorAll(".mp-option").forEach((n) => n.classList.toggle("selected", n.querySelector("input").checked));
          f.next.disabled = !selectedRadio("pickTemplate");
        });
        return;
      }

      const stepsArr = pickStepsFor(pk.template, pk.sel, po);
      const st = stepsArr[ps.step - 1];
      const inOpts = (v) => st.options.some((o) => o.value === v);
      let cur = (pk.sel[st.id] || []).filter(inOpts);
      st.required.forEach((r) => { if (inOpts(r) && cur.indexOf(r) === -1) cur.unshift(r); });
      if (!cur.length && st.min >= 1 && st.options.length === 1) cur = [st.options[0].value];
      pk.sel[st.id] = cur;
      const single = st.min === 1 && st.max === 1;
      const limitText = st.min === st.max ? "Pick " + st.min : st.min === 0 ? "Optional: pick up to " + st.max : "Pick " + st.min + "–" + st.max;
      const body = el(`<div></div>`);
      // What's already picked for this slot (earlier steps).
      const sofar = stepsArr.slice(0, ps.step - 1).map((s2) => (pk.sel[s2.id] || []).map((v) => {
        const o = s2.options.find((x) => x.value === v);
        return o ? o.label : v;
      }).join(" + ")).filter(Boolean);
      body.appendChild(el(`<p class="mp-pick-sofar"><strong>${escText(tplLabel(pk.template))}</strong>${sofar.length ? " · " + escText(sofar.join(" · ")) : ""}</p>`));
      if (st.note) body.appendChild(el(`<p class="mp-hint mp-pick-note">${escText(st.note)}</p>`));
      const box = el(`<div class="mp-options mp-pick-ingredients" data-step="${escText(st.id)}" data-min="${st.min}" data-max="${st.max}"></div>`);
      const stock = stockKeys();
      if (!st.options.length) {
        box.appendChild(el(`<p class="mp-pick-empty">None of these fit your dietary restrictions${st.min ? ", so this template can't be built. Go back and pick another template." : ". You can skip this step."}</p>`));
      }
      st.options.forEach((o) => {
        const locked = st.required.indexOf(o.value) !== -1;
        const inStock = stock[groceryKey(o.key)];
        box.appendChild(optionRow(single ? "radio" : "checkbox", "pickIng", o.value, o.label, locked ? "Always the base" : "",
          cur.indexOf(o.value) !== -1, { locked, tag: inStock ? "In stock" : "" }));
      });
      body.appendChild(box);
      const count = el(`<p class="mp-pick-count" aria-live="polite"></p>`);
      body.appendChild(count);
      if (st.hidden) {
        body.appendChild(el(`<p class="mp-hint mp-pick-budget">A few pricier options are hidden to fit your $${escText(answers.budget)}/month budget.</p>`));
      }
      const isLast = lastSlot && ps.step === stepsArr.length;
      const f = frame({
        id: "pickIngredientStep",
        label: slot.name + " · " + tplLabel(pk.template) + " · step " + ps.step + " of " + stepsArr.length,
        title: "Pick " + st.title,
        body,
        pct: ((ps.i + ps.step / (stepsArr.length + 1)) / total) * 100,
        onBack: () => { pk.sel[st.id] = cur.slice(); pickBack(); },
        nextLabel: isLast ? "See my plan" : "Next",
        onNext: () => {
          if (!pickStepValid(st, cur)) return;
          pk.sel[st.id] = cur.slice();
          if (ps.step < stepsArr.length) ps.step += 1;
          else if (!lastSlot) { ps.i += 1; ps.step = 0; }
          else { finishPick(); return; }
          renderPick();
        },
      });
      const sync = () => {
        const inputs = Array.from(box.querySelectorAll('input[name="pickIng"]'));
        cur = inputs.filter((n) => n.checked).map((n) => n.value);
        const full = cur.length >= st.max;
        inputs.forEach((n) => {
          const row = n.closest(".mp-option");
          if (!single && !st.required.includes(n.value)) {
            n.disabled = full && !n.checked;
            row.classList.toggle("disabled", n.disabled);
          }
          row.classList.toggle("selected", n.checked);
        });
        count.textContent = limitText + " · " + cur.length + " picked" + (full && st.max > 1 ? " (max)" : "");
        f.next.disabled = !pickStepValid(st, cur);
      };
      box.addEventListener("change", sync);
      sync();
    }

    function finishPick() {
      const po = pickPlanOptions();
      // Drop any selection no longer valid (e.g. protein changed after picking fats).
      const picks = pickState.picks.map((pk) => {
        const sel = {};
        pickStepsFor(pk.template, pk.sel, po).forEach((st) => {
          sel[st.id] = (pk.sel[st.id] || []).filter((v) => st.options.some((o) => o.value === v));
        });
        return { template: pk.template, sel };
      });
      planVariant = randomPlanVariant();
      answers._slotVariants = [];
      answers._rerollHistory = {};
      answers.__lockedPlan = buildPickedPlan(answers, picks, planVariant);
      showResult();
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
      const targetPie = macroPieHtml(plan.daily.macros, String(plan.daily.calories), "cals");
      const actualPie = macroPieHtml(c.actualPct, String(plan.actual.kcal), "cals");
      const microPies = MICRO_KEYS.map((k) => {
        const m = plan.micros.breakdown[k];
        const pct = Math.min(100, Math.max(0, m.pct));
        const pie = "conic-gradient(var(--moss) 0 " + pct + "%, var(--linen) " + pct + "% 100%)";
        const amtLabel = (Math.abs(m.amount) >= 10 ? Math.round(m.amount) : Math.round(m.amount * 10) / 10) + m.unit;
        const sodiumNote = k === "sodium_mg"
          ? `<p class="mp-micro-note">Does not include added salt/seasoning</p>`
          : "";
        return `<div class="mp-micro-pie-card" data-micro="${k}" title="${amtLabel} · ${m.pct}% of ${m.target}${m.unit}">
          <div class="mp-micro-pie" style="background:${pie}">
            <span class="mp-pie-pct">${m.pct}%</span>
            <span class="mp-pie-amt">${amtLabel}</span>
          </div>
          <div class="mp-micro-pie-label">${m.label}</div>
          ${sodiumNote}
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
        <h2>Daily targets &amp; actuals</h2>
        <div class="mp-dual-macros">
          <div class="mp-goal mp-macro-panel">
            <h3 class="mp-panel-title">Target</h3>
            <div class="mp-macro-row">
              <div class="mp-cals-block">
                <div class="mp-cals">${plan.daily.calories}</div>
                <div class="mp-macros">
                  ${plan.daily.protein_g}g p · ${plan.daily.carbs_g}g c · ${plan.daily.fat_g}g f
                  <br/>(${plan.daily.macros.p}% / ${plan.daily.macros.c}% / ${plan.daily.macros.f}%)
                </div>
              </div>
              ${targetPie}
            </div>
          </div>
          <div class="mp-goal mp-macro-panel mp-actual">
            <h3 class="mp-panel-title">Actual</h3>
            <div class="mp-macro-row">
              <div class="mp-cals-block">
                <div class="mp-cals">${plan.actual.kcal}</div>
                <div class="mp-macros">
                  ${plan.actual.p}g p · ${plan.actual.c}g c · ${plan.actual.f}g f
                  <br/>(${c.actualPct.p}% / ${c.actualPct.c}% / ${c.actualPct.f}%)
                </div>
              </div>
              ${actualPie}
            </div>
            <div class="mp-badges">
              ${badge(c.calOk, "±100 cal")}
              ${badge(c.pOk, "P ±2%")}
              ${badge(c.cOk, "C ±2%")}
              ${badge(c.fOk, "F ±2%")}
            </div>
          </div>
        </div>
        <p class="mp-hint">$${plan.budget}/mo · shop ${cadence} · ${plan.daysPerWeek} days/week${plan.selectedDays && plan.selectedDays.length ? " (" + plan.selectedDays.map(function(d){ var x = DAYS_OF_WEEK.find(function(z){return z.id===d}); return x?x.short:d; }).join(", ") + ")" : ""}. Budget tier: ${plan.budgetTier ? plan.budgetTier.label : "—"}. Macro targets follow weight goal (${answers.weightGoal || "maintain"}). Snacks ≈ half a meal (±75); meals within ±150.</p>
        <h2>Meals &amp; snacks</h2>
        <div class="mp-slots"></div>
        <h2>Suggested supplements</h2>
        ${supplementsHtml(plan, answers)}
        <h2>Nutrition overview</h2>
        <div class="mp-goal mp-nutrition-overview">
          <p class="mp-overview-blurb">${overview.blurb}</p>
        </div>
        <details class="mp-micro-expand">
          <summary>Micronutrients</summary>
          <p class="mp-hint">Vitamins and minerals vs suggested daily intake. Hover a chart to see the amount.</p>
          <div class="mp-micro-pies">${microPies}</div>
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
          <p class="mp-price-note">Prices are estimates; the price on Walmart.com governs.</p>
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
                <strong>${slot.name}: ${t.kcal} cal - ${s.title}</strong>
              </div>
              ${opts.mealPlanLocked ? "" : `<button type="button" class="mp-reroll mp-reroll-slot" data-slot="${slotIndex}">Reroll</button>`}
            </header>
            <ul class="mp-ingredients">
              ${lis}
              <li class="totals">
                <span class="ing-name">Meal total</span>
                <span class="ing-macros">${t.kcal} kcal · ${t.p}p / ${t.c}c / ${t.f}f</span>
              </li>
            </ul>
            ${noteHtml}
            ${prepHtml(slot, { days: prepDaysFor(plan) })}
          </article>`
        );
        slotsEl.appendChild(card);
      });
      slotsEl.insertAdjacentHTML("beforebegin", prepDayHtml(plan, {
        open: false,
        note: plan.cadence && plan.cadence !== "weekly" ? "You shop " + cadence + ", but prep weekly so everything stays fresh." : "",
      }));

      const nav = section.querySelector(".mp-nav");
      const lockedNote = opts.mealPlanLocked
        ? `<p class="mp-note" style="margin:8px 0">This week's plan is locked because groceries are already ordered.</p>`
        : "";
      nav.innerHTML = `
          ${lockedNote}
          <button type="button" class="mp-back" id="toDash">← Dashboard</button>
          ${opts.mealPlanLocked ? "" : `<button type="button" class="mp-reroll" id="reroll">Reroll all meals</button>`}
          <button type="button" class="mp-next" id="saveClose">${opts.mealPlanLocked ? "Close" : "Save &amp; close"}</button>`;

      root.appendChild(section);

      function finishToDashboard() {
        // When locked (groceries already ordered), do not save plan mutations.
        const shouldSave = !opts.mealPlanLocked;
        const detail = {
          plan: currentPlan,
          answers: Object.assign({}, answers),
          save: shouldSave,
        };
        root.dispatchEvent(new CustomEvent("onboarding-complete", { detail, bubbles: true }));
        root.dispatchEvent(
          new CustomEvent("pureprep-goto", {
            detail: { screen: "home", save: shouldSave, plan: currentPlan, answers: Object.assign({}, answers) },
            bubbles: true,
          })
        );
      }

      section.querySelectorAll(".mp-reroll-slot").forEach((btn) => {
        btn.onclick = () => {
          if (opts.mealPlanLocked) return;
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

      const rerollAll = section.querySelector("#reroll");
      if (rerollAll) {
        rerollAll.onclick = () => {
          if (opts.mealPlanLocked) return;
          answers.__lockedPlan = null;
          answers._rerollHistory = {};
          const next = rerollDay(answers, currentPlan, planVariant);
          planVariant = next.variant || planVariant + 1;
          answers._slotVariants = next._slotVariants ? next._slotVariants.slice() : [];
          answers.__lockedPlan = next;
          showResult();
        };
      }
      section.querySelector("#saveClose").onclick = finishToDashboard;
      section.querySelector("#toDash").onclick = finishToDashboard;
    }

    if (opts.startAt === "results" && (answers.__lockedPlan || answers.calories)) {
      // Locked (groceries ordered) weeks go straight to the read-only plan.
      if (opts.mealPlanLocked) showResult();
      else showBuildChoice();
    } else {
      render();
    }
    return {
      getAnswers: () => Object.assign({}, answers),
      buildPlan: (o) => buildPlan(answers, o),
      reroll: () => {
        planVariant += 1;
        showResult();
      },
    };
  }

  /* ── Prep instructions (doc29) ──────────────────────────────────────────
   * Every meal/snack gets "Weekly prep" (once on prep day, for all of the
   * week's plan days) and "Daily" (minimal day-of) steps, derived from the
   * slot's actual ingredients × plan days, so rerolls and saved plans always
   * match. prepDayPlan() consolidates the week into one ordered checklist
   * (oven + rice first, shared sheet pan at one temperature, one pot of eggs…).
   *
   * PREP_DOC holds instructions listed in the Meal Templates doc, keyed by
   * template type (bowl | salad_jar | smoothie | oatmeal | nut | greek_yogurt |
   * cottage_cheese | hb_egg_snack) as { weekly: [..], daily: [..] } with {n}
   * (servings) placeholders. When an entry exists its method lines are used
   * (amounts for the week are still listed first); otherwise we improvise.
   * Entries marked builder: true (smoothie, oatmeal) keep the doc wording as
   * the core of each step and append the plan's specifics (which items go in
   * the jar vs. are added the day of, with amounts).
   *
   * From the Meal Templates doc (export 2026-09-28). The doc's Bowl "Daily prep"
   * line duplicates the oatmeal one (jar/milk/oats), a copy-paste error, so it
   * is not applied; bowls, salad jars and snacks have no doc steps (improvised).
   */
  const PREP_DOC = {
    smoothie: {
      builder: true,
      weekly: ["Portion out dry ingredients into {n} jars."],
      daily: ["Empty jar into blender and add remaining ingredients. Blend until smooth and enjoy."],
    },
    oatmeal: {
      builder: true,
      weekly: ["Portion out dry ingredients into {n} jars."],
      daily: ["Empty jar into bowl and add milk or water. Microwave for 1-2 minutes until oats are soft. Add toppings and enjoy."],
    },
  };
  // Shelf-stable items that go in the weekly jar (smoothie/oatmeal). Everything
  // else (milk, banana, frozen fruit, spinach, nut butter, pumpkin, honey/maple) is added daily.
  const PREP_JAR_DRY = {
    protein_scoop: 1, oats_cup: 1, chia_tsp: 1, chia_tbsp: 1, hemp_tsp: 1, hemp_tbsp: 1,
    walnuts_tsp: 1, walnuts_tbsp: 1, raisins_cup: 1, cacao_tsp: 1, cinnamon_tsp: 1, pb_powder_tbsp: 1, pb_powder_tsp: 1,
  };
  const PREP_FROZEN = { berries_cup: 1, blueberries_cup: 1, strawberries_cup: 1, cherries_cup: 1, mango_cup: 1 };
  const PREP_OVEN_F = 400;
  // Minutes at 400°F on a parchment-lined sheet pan.
  const PREP_OVEN = {
    potato_oz: { min: 35, how: "in 1-inch cubes" },
    sweet_potato_oz: { min: 30, how: "in 1-inch cubes" },
    chicken_oz: { min: 22, how: "", done: "chicken reaches 165°F inside" },
    chicken_thigh_oz: { min: 25, how: "", done: "chicken reaches 165°F inside" },
    salmon_oz: { min: 13, how: "fillets", done: "salmon flakes easily, 145°F" },
    cod_oz: { min: 12, how: "fillets", done: "cod flakes easily, 145°F" },
    shrimp_oz: { min: 8, how: "thawed and patted dry", done: "shrimp are pink" },
    broccoli_cup: { min: 18, how: "florets" },
    cauliflower_cup: { min: 22, how: "florets" },
    carrots_cup: { min: 25, how: "halved" },
    peppers_cup: { min: 18, how: "sliced" },
    asparagus_cup: { min: 12, how: "trimmed" },
    zucchini_cup: { min: 15, how: "in half-moons" },
    mixed_veg_cup: { min: 20, how: "straight from frozen" },
  };
  const PREP_GRAIN = {
    rice_cup: { name: "white rice", min: 20 },
    brown_rice_cup: { name: "brown rice", min: 45 },
    quinoa_cup: { name: "quinoa", min: 15 },
  };
  const PREP_SKILLET = { beef_oz: 1, turkey_oz: 1 };
  const PREP_FISH = { salmon_oz: 1, cod_oz: 1, shrimp_oz: 1 };
  const PREP_EGG_BAKE_MIN = 15;
  const PREP_NAMES = {
    rice_cup: "cooked white rice", brown_rice_cup: "cooked brown rice", quinoa_cup: "cooked quinoa",
    protein_scoop: "protein powder", banana: "", oats_cup: "dry oats", beef_oz: "93% lean ground beef",
    turkey_oz: "lean ground turkey", chicken_oz: "chicken breast", chicken_thigh_oz: "chicken thighs",
    salmon_oz: "salmon", cod_oz: "cod", shrimp_oz: "shrimp", evoo_tsp: "olive oil", egg: "", egg_white: "",
    hard_boiled_egg: "", berries_cup: "mixed berries", cherries_cup: "frozen cherries", pumpkin_cup: "pumpkin puree",
    greek_nonfat_cup: "0% Greek yogurt", greek_2pct_cup: "2% Greek yogurt", cottage_lf_cup: "low-fat cottage cheese",
    black_beans_cup: "black beans", avocado_oz: "avocado",
  };

  function prepPlural(word, qty) {
    return Number(qty) <= 1 + 1e-9 ? word : word + "s";
  }

  /** 10.5 → "10½", 3.25 → "3¼", 1.8 → "1.8". */
  function prepNum(q) {
    const n = Math.round((Number(q) || 0) * 100) / 100;
    const whole = Math.floor(n + 1e-9);
    const frac = Math.round((n - whole) * 100) / 100;
    const glyph = { 0.25: "¼", 0.5: "½", 0.75: "¾" }[frac];
    if (!frac) return String(whole);
    if (glyph) return (whole ? String(whole) : "") + glyph;
    return String(Math.round(n * 10) / 10);
  }

  /** Quantity label used in prep text; whole tsp/tbsp (tbsp only when divisible by 3 tsp). */
  function prepAmountLabel(key, qty) {
    const f = FOOD[key];
    const q = Number(qty) || 0;
    const u = f ? f.unit : "";
    if (u === "cup") return formatCupQty(q) + " " + prepPlural("cup", q > 1 ? 2 : 1);
    if (u === "tsp" || u === "tbsp") {
      const tsp = Math.max(1, Math.round(u === "tbsp" ? q * 3 : q));
      return tsp >= 3 && tsp % 3 === 0 ? tsp / 3 + " tbsp" : tsp + " tsp";
    }
    if (u === "scoop") return prepNum(q) + " " + prepPlural("scoop", q);
    if (u === "egg") return Math.round(q) + " " + prepPlural(key === "hard_boiled_egg" ? "hard-boiled egg" : "egg", Math.round(q));
    if (u === "white") return Math.round(q) + " " + prepPlural("egg white", Math.round(q));
    if (u === "medium") return prepNum(q) + " " + prepPlural("banana", q);
    if (u === "oz") return prepNum(q) + " oz";
    return formatQty(q) + (u ? " " + u : "");
  }

  function prepName(key) {
    if (key in PREP_NAMES) return PREP_NAMES[key];
    return FOOD[key] ? FOOD[key].name : key;
  }

  /** "42 oz salmon" (+ " (7 × 6 oz)" when showPer and n > 1). */
  function prepItem(key, per, n, showPer) {
    const total = per * n;
    const name = prepName(key);
    let s = prepAmountLabel(key, total) + (name ? " " + name : "");
    if (showPer && n > 1) s += " (" + n + " × " + prepAmountLabel(key, per) + ")";
    return s;
  }
  function prepPer(key, per) {
    const name = prepName(key);
    return prepAmountLabel(key, per) + (name ? " " + name : "");
  }

  function prepJoin(list) {
    const a = list.filter(Boolean);
    if (a.length <= 1) return a.join("");
    return a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  }

  function prepDaysFor(plan) {
    const d = (plan && plan.selectedDays && plan.selectedDays.length) || Number(plan && plan.daysPerWeek) || 7;
    return clamp(Math.round(d), 1, 7);
  }

  function prepFill(text, n) {
    return String(text).replace(/\{n\}/g, String(n));
  }

  /** How many days cooked food keeps refrigerated (fish 3, everything else 4). */
  function prepFridgeDays(keys) {
    return keys.some((k) => PREP_FISH[k]) ? 3 : 4;
  }

  function prepStorageLine(what, n, limit) {
    if (n <= limit) return "Refrigerate the " + what + " (keeps " + limit + " days).";
    return "Refrigerate " + what + " for days 1–" + limit + "; freeze the other " + (n - limit) +
      ". The night before, move the next one from the freezer to the fridge.";
  }

  /**
   * One oven timeline at 400°F: longest item goes in first, shorter ones are
   * added so everything finishes together. items: [{key, qty}] (week totals).
   */
  function prepSheetPanLine(items, opts) {
    opts = opts || {};
    const list = items
      .filter((it) => PREP_OVEN[it.key] && it.qty > 0)
      .map((it) => Object.assign({ min: PREP_OVEN[it.key].min, how: PREP_OVEN[it.key].how }, it))
      .sort((a, b) => b.min - a.min || (a.key < b.key ? -1 : 1));
    if (!list.length) return null;
    const total = list[0].min;
    const label = (it) => prepAmountLabel(it.key, it.qty) + " " + prepName(it.key) + (it.how ? " (" + it.how + ")" : "");
    const groups = [];
    list.forEach((it) => {
      const at = total - it.min;
      const g = groups.find((x) => x.at === at);
      if (g) g.items.push(it); else groups.push({ at, items: [it] });
    });
    const parts = groups.map((g, i) => (i === 0 ? "start " : "at " + g.at + " min add ") + prepJoin(g.items.map(label)));
    // Pan load: ~48 oz protein/potatoes or ~12 cups veg per half-sheet pan, single layer.
    const load = list.reduce((a, it) => a + (FOOD[it.key].unit === "oz" ? it.qty / 48 : it.qty / 12), 0);
    const pans = Math.max(1, Math.ceil(load - 0.05));
    let s = (pans > 1 ? pans + " sheet pans" : "One sheet pan") + " at " + PREP_OVEN_F + "°F (parchment-lined): " + parts.join("; ") + ".";
    if (opts.oilTsp) s += " Toss the " + prepJoin(list.filter((it) => !PREP_FISH[it.key] && !/chicken/.test(it.key)).map((it) => prepName(it.key)).slice(0, 3)) +
      " with " + prepAmountLabel("evoo_tsp", opts.oilTsp) + " olive oil and a pinch of salt first.";
    const done = list.map((it) => PREP_OVEN[it.key].done).filter(Boolean);
    s += " Done at " + total + " min" + (done.length ? " (" + done[0] + ")" : "") + ".";
    if (pans > 1) s += " Keep a single layer; if the pans don't fit together, roast in two rounds.";
    return { text: s, minutes: total, pans };
  }

  function prepGrainLine(key, cookedTotal) {
    const g = PREP_GRAIN[key];
    const dry = cookedTotal / 3;
    return "Cook " + formatCupQty(dry) + " " + prepPlural("cup", dry > 1 ? 2 : 1) + " dry " + g.name +
      " (makes " + prepAmountLabel(key, cookedTotal) + " cooked) in a rice cooker or one covered pot, ~" + g.min + " min.";
  }

  function prepSkilletLine(items) {
    const names = items.map((it) => prepAmountLabel(it.key, it.qty) + " " + prepName(it.key));
    return "Brown " + prepJoin(names) + " in one large skillet over medium-high, 8–10 min, breaking it up; drain and season lightly.";
  }

  function prepEggBakeLine(key, total, n) {
    const what = key === "egg_white" ? prepAmountLabel("egg_white", total) : prepAmountLabel("egg", total);
    // A 9×13 pan holds ~12 eggs; a rimmed half-sheet pan ~24.
    const pans = total <= 12 ? "a parchment-lined 9×13 pan"
      : Math.ceil(total / 24) === 1 ? "a parchment-lined rimmed sheet pan"
      : Math.ceil(total / 24) + " parchment-lined rimmed sheet pans";
    const min = total <= 12 ? PREP_EGG_BAKE_MIN : PREP_EGG_BAKE_MIN + 3;
    return "Egg bake: whisk " + what + " with a pinch of salt, pour into " + pans + " and bake at " + PREP_OVEN_F +
      "°F for ~" + min + " min until set (same oven, same temperature). Cut into " + n + " " + prepPlural("portion", n) + ".";
  }

  function prepBoilLine(total) {
    return "Hard-boil " + prepAmountLabel("egg", total) + " at once: cover with water, bring to a boil, cover and turn off the heat for 11 min, then move to ice water.";
  }

  /** Normalized ingredient view for a suggestion: [{key, qty}]. */
  function prepIngs(s) {
    return ((s && s.ingredients) || []).filter((i) => i && !i._note && i._key && FOOD[i._key]).map((i) => ({ key: i._key, qty: Number(i._qty) || 0 }));
  }

  function prepDocOverride(type, n, amountLine, generated) {
    const doc = PREP_DOC[type];
    if (!doc || doc.builder || (!doc.weekly && !doc.daily)) return Object.assign({ source: "improvised" }, generated);
    const weekly = [amountLine].concat((doc.weekly || []).map((t) => prepFill(t, n)));
    const daily = doc.daily && doc.daily.length ? doc.daily.map((t) => prepFill(t, n)) : generated.daily;
    return { weekly, daily, tasks: generated.tasks, source: "doc" };
  }

  /* ── per-template builders ── return { weekly, daily, tasks } ── */

  function prepCookedMeal(s, n, kind) {
    const ings = prepIngs(s);
    const weekly = [];
    const daily = [];
    const tasks = [];
    const oven = [];
    const skillet = [];
    let oilTsp = 0;
    let hbe = 0;
    let avocado = 0;
    const raw = [];
    const byKey = {};
    ings.forEach((i) => { byKey[i.key] = (byKey[i.key] || 0) + i.qty; });
    const proteinKey = ings.map((i) => i.key).find((k) => PREP_OVEN[k] && /_oz$/.test(k) && !/potato/.test(k) || PREP_SKILLET[k] || k === "egg" || k === "egg_white");
    ings.forEach((i) => {
      const k = i.key;
      if (PREP_SKILLET[k]) skillet.push({ key: k, qty: i.qty * n, per: i.qty });
      else if (PREP_OVEN[k] && (kind === "bowl" || k === proteinKey)) oven.push({ key: k, qty: i.qty * n, per: i.qty });
      else if (k === "evoo_tsp") oilTsp = i.qty * n;
      else if (k === "hard_boiled_egg") hbe = i.qty;
      else if (k === "avocado_oz") avocado = i.qty;
      else if (!PREP_GRAIN[k] && k !== "egg" && k !== "egg_white") raw.push(i);
    });
    const eggKey = byKey.egg ? "egg" : byKey.egg_white ? "egg_white" : null;
    // 1. Grains (start first)
    Object.keys(PREP_GRAIN).forEach((g) => {
      if (!byKey[g]) return;
      weekly.push(prepGrainLine(g, byKey[g] * n));
      tasks.push({ kind: "grain", key: g, qty: byKey[g] * n });
    });
    // 2. Eggs to boil (fat serving)
    if (hbe) {
      weekly.push(prepBoilLine(hbe * n) + (kind === "bowl"
        ? (n > 5 ? " Keep them in the shell in the fridge (good for a week)." : " Peel and keep in a covered container.")
        : " Peel and slice."));
      tasks.push({ kind: "boil", qty: hbe * n });
    }
    // 3. Oven: one sheet pan at one temperature (bowls: protein + carb + veg; jars: protein only)
    const useOil = kind === "bowl" ? oilTsp : 0;
    const pan = prepSheetPanLine(oven, { oilTsp: useOil });
    if (pan) {
      weekly.push(pan.text);
      oven.forEach((it) => tasks.push({ kind: "oven", key: it.key, qty: it.qty }));
      if (useOil) tasks.push({ kind: "oil", qty: useOil });
    }
    if (eggKey) {
      weekly.push(prepEggBakeLine(eggKey, byKey[eggKey] * n, n));
      tasks.push({ kind: "eggbake", key: eggKey, qty: byKey[eggKey] * n, n });
    }
    // 4. Skillet
    if (skillet.length) {
      weekly.push(prepSkilletLine(skillet));
      skillet.forEach((it) => tasks.push({ kind: "skillet", key: it.key, qty: it.qty }));
    }
    const limit = prepFridgeDays(ings.map((i) => i.key));
    if (kind === "bowl") {
      const parts = ings.filter((i) => ["evoo_tsp", "avocado_oz", "hard_boiled_egg"].indexOf(i.key) === -1).map((i) => prepPer(i.key, i.qty));
      weekly.push("Cool 10 min, then divide into " + n + " " + prepPlural("container", n) + ": " + prepJoin(parts) + " each.");
      weekly.push(prepStorageLine(n === 1 ? "container" : "containers", n, limit));
      tasks.push({ kind: "portion", text: n + " " + s.title.toLowerCase() + " " + prepPlural("container", n), limit, n });
      daily.push("Microwave the container 2–2½ min, stirring halfway, until hot.");
      if (avocado) daily.push("Top with " + prepPer("avocado_oz", avocado) + ", sliced fresh so it doesn't brown.");
      if (hbe) daily.push(n > 5 ? "Peel and add " + prepAmountLabel("hard_boiled_egg", hbe) + "."
        : "Add " + prepAmountLabel("hard_boiled_egg", hbe) + " (already peeled).");
      if (oilTsp && !pan) daily.push("Drizzle " + prepAmountLabel("evoo_tsp", oilTsp / n) + " olive oil.");
      daily.push("Season to taste and eat.");
    } else {
      // Salad jars: chop raw veg/greens once; layer dressing → hearty veg → rice → protein → cheese/egg → greens.
      const cupRaw = raw.filter((i) => FOOD[i.key].unit === "cup");
      const chop = cupRaw.map((i) => prepItem(i.key, i.qty, n, false));
      if (chop.length) {
        const tips = [];
        if (byKey.black_beans_cup) tips.push("rinse the beans");
        if (byKey.corn_cup) tips.push("thaw the corn under cool water");
        if (byKey.cherry_tomato_cup) tips.push("leave tomatoes whole so they stay firm");
        weekly.push("Wash and chop: " + prepJoin(chop) + (tips.length ? " (" + tips.join("; ") + ")" : "") + ".");
        cupRaw.forEach((i) => tasks.push({ kind: "chop", key: i.key, qty: i.qty * n }));
      }
      const layer = [];
      if (oilTsp) layer.push(prepPer("evoo_tsp", oilTsp / n) + " olive oil (+ a splash of vinegar or lemon)");
      ings.filter((i) => ["black_beans_cup", "corn_cup", "onion_cup", "peppers_cup", "carrots_cup", "cucumber_cup", "cherry_tomato_cup"].indexOf(i.key) !== -1)
        .forEach((i) => layer.push(prepPer(i.key, i.qty)));
      Object.keys(PREP_GRAIN).forEach((g) => { if (byKey[g]) layer.push(prepPer(g, byKey[g])); });
      if (proteinKey) layer.push(prepPer(proteinKey, byKey[proteinKey]) + " (cooled)");
      ["feta_oz", "parmesan_oz"].forEach((k) => { if (byKey[k]) layer.push(prepPer(k, byKey[k])); });
      if (hbe) layer.push(prepAmountLabel("hard_boiled_egg", hbe) + ", sliced");
      ings.filter((i) => ["lettuce_cup", "kale_cup", "spinach_cup", "mixed_greens_cup"].indexOf(i.key) !== -1).forEach((i) => layer.push(prepPer(i.key, i.qty)));
      const jarLimit = Math.min(5, limit);
      const build = Math.min(n, jarLimit);
      weekly.push("Layer " + build + " " + prepPlural("jar", build) + " bottom to top: " + prepJoin(layer) + ". Lid and refrigerate.");
      if (n > jarLimit) {
        weekly.push("For days " + (jarLimit + 1) + "–" + n + ": freeze the remaining " + prepName(proteinKey) + " in portions and keep the chopped veg and greens bagged in the fridge.");
        daily.push("Days " + (jarLimit + 1) + "–" + n + ": the night before, thaw a protein portion in the fridge and fill a jar the same way (2 min).");
      }
      tasks.push({ kind: "portion", text: n + " " + s.title.toLowerCase() + "s", limit: jarLimit, n });
      if (avocado) daily.push("Add " + prepPer("avocado_oz", avocado) + ", sliced fresh so it doesn't brown.");
      daily.push("Shake the jar into a bowl, toss and eat cold.");
    }
    return { weekly, daily, tasks };
  }

  function prepFillJars(text, n) {
    return prepFill(text, n).replace(/\b1 jars\b/g, "1 jar");
  }

  /** Optional flavor words from the suggestion's notes that can go in the dry jar. */
  function prepJarFlavors(s) {
    const note = (s.notes || []).find((x) => /cinnamon|cacao|pumpkin spice|salt/i.test(x));
    if (!note) return "";
    const words = [];
    if (/cinnamon/i.test(note)) words.push("cinnamon");
    if (/cacao/i.test(note)) words.push("cacao");
    if (/pumpkin spice/i.test(note)) words.push("pumpkin spice");
    if (/salt/i.test(note)) words.push("a pinch of salt");
    if (!words.length) return "";
    const optional = /optional/i.test(note) || words.length > 1;
    const list = words.length > 1 ? words.slice(0, -1).join(", ") + " or " + words[words.length - 1] : words[0];
    return optional ? "Optional: add " + list + " to each jar, to taste." : "Add " + list + " to each jar, to taste.";
  }

  /** Daily add-in label: frozen fruit comes "from the freezer bag", banana is sliced fresh. */
  function prepAddIn(i) {
    if (i.key === "banana") return prepAmountLabel("banana", i.qty) + " (sliced fresh)";
    if (PREP_FROZEN[i.key]) return prepPer(i.key, i.qty) + " (from the freezer bag)";
    return prepPer(i.key, i.qty);
  }

  function prepJarWeekly(type, s, n, dry, all) {
    const doc = PREP_DOC[type];
    const core = prepFillJars(doc.weekly[0], n);
    const weekly = [
      core.replace(/\.$/, "") + (dry.length ? (n === 1 ? ". In the jar: " : ". Each jar: ") + prepJoin(dry.map((i) => prepPer(i.key, i.qty))) + ". Lid and keep in the pantry." : ". Lid and keep in the pantry."),
    ];
    (doc.weekly || []).slice(1).forEach((t) => weekly.push(prepFillJars(t, n)));
    const flav = prepJarFlavors(s);
    if (flav) weekly.push(flav);
    if (n > 1) weekly.push("Uses " + prepJoin(all.map((i) => prepItem(i.key, i.qty, n, false))) + " for the week.");
    return weekly;
  }

  function prepSmoothie(s, n) {
    const ings = prepIngs(s);
    const dry = ings.filter((i) => PREP_JAR_DRY[i.key]);
    const rest = ings.filter((i) => !PREP_JAR_DRY[i.key]);
    // Milk first, then fruit/veg, then nut butter etc.
    rest.sort((a, b) => (/milk/.test(b.key) ? 1 : 0) - (/milk/.test(a.key) ? 1 : 0));
    const weekly = prepJarWeekly("smoothie", s, n, dry, dry.concat(rest));
    const dailyDoc = PREP_DOC.smoothie.daily[0];
    const daily = [
      rest.length
        ? dailyDoc.replace("add remaining ingredients.", "add remaining ingredients: " + prepJoin(rest.map(prepAddIn)) + ".")
        : dailyDoc,
    ];
    return {
      weekly, daily, source: "doc",
      tasks: [{ kind: "pack", text: n + " smoothie " + prepPlural("jar", n) + " of dry ingredients (" + s.title.toLowerCase() + ")" }],
    };
  }

  function prepOatmeal(s, n) {
    const ings = prepIngs(s);
    const dry = ings.filter((i) => PREP_JAR_DRY[i.key]);
    const milk = ings.filter((i) => /milk/.test(i.key));
    const pumpkin = ings.filter((i) => i.key === "pumpkin_cup");
    const toppings = ings.filter((i) => !PREP_JAR_DRY[i.key] && !/milk/.test(i.key) && i.key !== "pumpkin_cup");
    const oats = ings.find((i) => i.key === "oats_cup");
    const weekly = prepJarWeekly("oatmeal", s, n, dry, dry.concat(milk, pumpkin, toppings));
    // Liquid: the plan's milk, or water at the doc ratio (4 oz per ½ cup oats) when milk was omitted.
    const liquid = milk.length
      ? prepJoin(milk.map((i) => prepPer(i.key, i.qty)))
      : (oats ? "about " + Math.max(4, Math.round((oats.qty / 0.5) * 4)) + " oz water" : "water");
    const withPumpkin = pumpkin.length ? "; stir in " + prepJoin(pumpkin.map((i) => prepPer(i.key, i.qty))) + " too" : "";
    const dailyDoc = PREP_DOC.oatmeal.daily[0];
    let text = dailyDoc.replace("add milk or water.", "add milk or water (" + liquid + withPumpkin + ").");
    if (toppings.length) text = text.replace("Add toppings and enjoy.", "Add toppings and enjoy: " + prepJoin(toppings.map(prepAddIn)) + ".");
    return {
      weekly, daily: [text], source: "doc",
      tasks: [{ kind: "pack", text: n + " oatmeal " + prepPlural("jar", n) + " of dry ingredients (" + s.title.toLowerCase() + ")" }],
    };
  }

  function prepSnackContainers(s, n, noun) {
    const ings = prepIngs(s);
    const eggs = ings.find((i) => i.key === "hard_boiled_egg");
    const weekly = [];
    const tasks = [];
    if (eggs) {
      weekly.push(prepBoilLine(eggs.qty * n) + (n > 5 ? " Peel " + prepAmountLabel("hard_boiled_egg", eggs.qty * 5) + " for days 1–5; keep the rest in the shell." : " Peel."));
      tasks.push({ kind: "boil", qty: eggs.qty * n });
    }
    const limit = 5;
    const each = ings.map((i) => prepPer(i.key, i.qty));
    const build = Math.min(n, limit);
    weekly.push("Pack " + build + " " + prepPlural(noun, build) + ": " + prepJoin(each) + " in each. Lid and refrigerate.");
    if (n > limit) {
      weekly.push("For days " + (limit + 1) + "–" + n + ": portion the rest " + (eggs ? "(keep those eggs unpeeled)" : "but keep the fruit separate") + " so it stays fresh.");
    }
    if (n > 1) weekly.push("Uses " + prepJoin(ings.map((i) => prepItem(i.key, i.qty, n, false))) + " for the week.");
    const daily = ["Grab 1 " + noun + " and eat" + (eggs ? " (pinch of salt and pepper optional)." : ", stirring first.")];
    if (n > limit) daily.push("Days " + (limit + 1) + "–" + n + ": " + (eggs ? "peel the eggs" : "add the fruit") + " the night before (1 min).");
    tasks.push({ kind: "pack", text: n + " " + s.title.toLowerCase() + " " + prepPlural(noun, n) });
    return { weekly, daily, tasks };
  }

  function prepNuts(s, n) {
    const ings = prepIngs(s);
    const nut = ings[0];
    const weekly = [
      "Portion " + (nut ? prepItem(nut.key, nut.qty, n, false) : "the nuts") + " into " + n + " snack " + prepPlural("bag", n) +
        (nut ? " (" + prepAmountLabel(nut.key, nut.qty) + " each — weigh once, then eyeball)" : "") + ".",
    ];
    ings.slice(1).forEach((i) => weekly.push("Add " + prepPer(i.key, i.qty) + " to each bag."));
    return { weekly, daily: ["Grab 1 bag."], tasks: [{ kind: "pack", text: n + " snack " + prepPlural("bag", n) + " of " + (nut ? prepAmountLabel(nut.key, nut.qty) + " " + prepName(nut.key) : "nuts") }] };
  }

  /** Weekly + daily prep for one schedule slot. ctx: { days } (plan days this week). */
  function prepForSlot(slot, ctx) {
    const s = slot && slot.suggestion ? slot.suggestion : slot;
    const n = clamp(Math.round((ctx && ctx.days) || 7), 1, 7);
    const type = (s && s.type) || "";
    let gen;
    if (type === "bowl") gen = prepCookedMeal(s, n, "bowl");
    else if (type === "salad_jar") gen = prepCookedMeal(s, n, "jar");
    else if (type === "smoothie") gen = prepSmoothie(s, n);
    else if (type === "oatmeal") gen = prepOatmeal(s, n);
    else if (type === "nut") gen = prepNuts(s, n);
    else if (type === "greek_yogurt" || type === "cottage_cheese") gen = prepSnackContainers(s, n, "cup");
    else if (type === "hb_egg_snack") gen = prepSnackContainers(s, n, "container");
    else {
      const ings = prepIngs(s);
      gen = {
        weekly: ["Portion " + n + " " + prepPlural("serving", n) + ": " + prepJoin(ings.map((i) => prepPer(i.key, i.qty))) + " each. Refrigerate."],
        daily: ["Grab 1 serving (reheat if needed)."],
        tasks: [{ kind: "pack", text: n + " " + prepPlural("serving", n) + " of " + String((s && s.title) || "this meal").toLowerCase() }],
      };
    }
    const amountLine = "For " + n + " " + prepPlural("day", n) + ": " + prepJoin(prepIngs(s).map((i) => prepItem(i.key, i.qty, n, false))) + ".";
    const out = gen.source === "doc" ? gen : prepDocOverride(type, n, amountLine, gen);
    out.days = n;
    out.type = type;
    return out;
  }

  /**
   * Consolidated, efficiency-ordered prep-day checklist for a plan's week:
   * preheat + long-cooking grains first, all eggs in one pot, one shared
   * 400°F oven timeline, one skillet, then no-cook packing while things cook.
   */
  function prepDayPlan(plan, ctx) {
    const n = clamp(Math.round((ctx && ctx.days) || prepDaysFor(plan)), 1, 7);
    const tasks = [];
    ((plan && plan.schedule) || []).forEach((slot) => {
      prepForSlot(slot, { days: n }).tasks.forEach((t) => tasks.push(Object.assign({ slot: slot.name }, t)));
    });
    const sum = (kind) => {
      const m = {};
      tasks.filter((t) => t.kind === kind).forEach((t) => { m[t.key || "_"] = (m[t.key || "_"] || 0) + t.qty; });
      return m;
    };
    const steps = [];
    const oven = sum("oven");
    const eggBake = tasks.filter((t) => t.kind === "eggbake");
    const grains = sum("grain");
    const hasOven = Object.keys(oven).length > 0 || eggBake.length > 0;
    if (hasOven) steps.push({ id: "preheat", text: "Preheat the oven to " + PREP_OVEN_F + "°F and line sheet pans with parchment." });
    Object.keys(grains).sort((a, b) => PREP_GRAIN[b].min - PREP_GRAIN[a].min).forEach((g) => {
      steps.push({ id: "grain-" + g, text: prepGrainLine(g, grains[g]) });
    });
    const boil = tasks.filter((t) => t.kind === "boil").reduce((a, t) => a + t.qty, 0);
    if (boil) steps.push({ id: "boil", text: prepBoilLine(boil) + " Peel as each meal says." });
    if (Object.keys(oven).length) {
      const oil = tasks.filter((t) => t.kind === "oil").reduce((a, t) => a + t.qty, 0);
      const pan = prepSheetPanLine(Object.keys(oven).map((k) => ({ key: k, qty: oven[k] })), { oilTsp: oil });
      steps.push({ id: "oven", text: pan.text });
    }
    eggBake.forEach((t) => steps.push({ id: "eggbake-" + t.key, text: prepEggBakeLine(t.key, t.qty, t.n) }));
    const sk = sum("skillet");
    if (Object.keys(sk).length) steps.push({ id: "skillet", text: prepSkilletLine(Object.keys(sk).map((k) => ({ key: k, qty: sk[k] }))) });
    const chop = sum("chop");
    const packs = tasks.filter((t) => t.kind === "pack").map((t) => t.text);
    const whileCooking = [];
    if (Object.keys(chop).length) whileCooking.push("wash and chop " + prepJoin(Object.keys(chop).map((k) => prepAmountLabel(k, chop[k]) + " " + prepName(k))));
    packs.forEach((p) => whileCooking.push("make " + p));
    if (whileCooking.length) {
      steps.push({ id: "while", text: (hasOven || Object.keys(grains).length || Object.keys(sk).length ? "While everything cooks: " : "") + whileCooking.join("; ") + "." });
    }
    const portions = tasks.filter((t) => t.kind === "portion");
    if (portions.length) {
      const limit = Math.min.apply(null, portions.map((t) => t.limit));
      steps.push({
        id: "portion",
        text: "Cool cooked food 10 min, then portion " + prepJoin(portions.map((t) => t.text)) + " (see each meal). " +
          (n > limit ? "Refrigerate days 1–" + limit + " and freeze the rest; move one to the fridge the night before." : "Refrigerate everything."),
      });
    }
    const minutes = Math.max(
      0,
      ...Object.keys(grains).map((g) => PREP_GRAIN[g].min),
      Object.keys(oven).length ? Math.max(...Object.keys(oven).map((k) => PREP_OVEN[k].min)) + 10 : 0,
      eggBake.length ? PREP_EGG_BAKE_MIN + 10 : 0,
      boil ? 25 : 0,
      Object.keys(sk).length ? 15 : 0
    );
    return { days: n, steps, minutes: minutes + 10 + 5 * packs.length };
  }

  function prepEsc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /** Collapsible "Weekly prep" + "Daily" block for one meal/snack card (starts collapsed). */
  function prepHtml(slot, ctx) {
    const r = prepForSlot(slot, ctx);
    // doc31: collapsed by default (tap "Prep steps" to expand); pass { open: true } to start open.
    const open = !!(ctx && ctx.open === true);
    const li = (arr) => arr.map((t) => "<li>" + prepEsc(t) + "</li>").join("");
    return '<details class="mp-prep" data-prep-type="' + prepEsc(r.type) + '" data-prep-source="' + r.source + '" data-prep-days="' + r.days + '"' + (open ? " open" : "") + ">" +
      '<summary><span class="mp-prep-title">Prep steps</span><span class="mp-prep-sub">weekly + daily</span></summary>' +
      '<div class="mp-prep-body">' +
      '<div class="mp-prep-block mp-prep-weekly"><h4><span class="mp-prep-ico" aria-hidden="true">🧺</span>Weekly prep <small>· prep day, ' + r.days + " " + prepPlural("serving", r.days) + "</small></h4><ol>" + li(r.weekly) + "</ol></div>" +
      '<div class="mp-prep-block mp-prep-daily"><h4><span class="mp-prep-ico" aria-hidden="true">🌱</span>Daily <small>· day of</small></h4><ol>' + li(r.daily) + "</ol></div>" +
      "</div></details>";
  }

  /** Consolidated prep-day checklist for a plan (checkboxes are just for ticking off; not saved). */
  function prepDayHtml(plan, ctx) {
    const d = prepDayPlan(plan, ctx);
    const open = !!(ctx && ctx.open);
    const note = (ctx && ctx.note) || "";
    const items = d.steps.map((st, i) =>
      '<li><label><input type="checkbox" data-prep-step="' + prepEsc(st.id) + '" /><span><b>' + (i + 1) + ".</b> " + prepEsc(st.text) + "</span></label></li>"
    ).join("");
    return '<details class="mp-prepday" data-prep-days="' + d.days + '"' + (open ? " open" : "") + ">" +
      '<summary><span class="mp-prep-title">🌿 Prep day checklist</span><span class="mp-prep-sub">~' + d.minutes + " min · " + d.days + " " + prepPlural("day", d.days) + "</span></summary>" +
      '<div class="mp-prep-body"><p class="mp-prepday-intro">Do this once a week, in this order, for all meals &amp; snacks. Each card below has the same steps for just that item, plus what\'s left for the day of.' + (note ? " " + prepEsc(note) : "") + "</p>" +
      '<ul class="mp-prepday-list">' + items + "</ul></div></details>";
  }

  global.MealPlanOnboarding = {
    RESTRICTION_OPTIONS,
    FOOD_TAGS,
    supplementsForPlan,
    supplementsHtml,
    pickTemplatesFor,
    pickStepsFor,
    pickStepValid,
    buildPickedSuggestion,
    buildPickedPlan,
    normalizeRestrictions,
    restrictionFlags,
    foodAllowed,
    restrictSuggestion,
    mealTypePools,
    MACRO_PRESETS,
    macrosFromWeightGoal,
    MEAL_OPTIONS,
    ACTIVITY_FACTOR,
    FOOD,
    BOWL_VEG_KEYS,
    BOWL_CARB_KEYS,
    pickBowlCarbKey,
    MICRO_TARGETS,
    MICRO_KEYS,
    PRICE_CATALOG,
    UNIT_GRAMS,
    DAYS_OF_WEEK,
    estimateCalories,
    buildSchedule,
    buildPlan,
    buildPlanOnce,
    fitPlanToBudget,
    gramsFromPct,
    createOnboarding,
    evaluateCompliance,
    lookupPrice,
    aggregateDayMicros,
    nutritionOverview,
    dedupeIngredients,
    finalizeSuggestion,
    macroPieHtml,
    buildGroceryList,
    groceryKey,
    groceryQty,
    groceryLine,
    groceryUnitStep,
    dailyGroceryNeeds,
    canonicalizeInventory,
    normalizeGroceryList,
    applyStockToGrocery,
    roundBuyQty,
    formatQty,
    displayUnit,
    shoppingPlanDays,
    budgetTier,
    rerollSlot,
    rerollDay,
    recomputePlanFromSchedule,
    buildMealSuggestionForType,
    buildSnackSuggestionForType,
    buildSaladJarSlot,
    buildHbEggSnack,
    formatCupQty,
    snapCupFraction,
    PREP_DOC,
    prepForSlot,
    prepDayPlan,
    prepDaysFor,
    prepAmountLabel,
    prepHtml,
    prepDayHtml,
  };
})(typeof window !== "undefined" ? window : globalThis);
