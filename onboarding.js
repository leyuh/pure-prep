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
      salmon: "salmon_oz", cod: "cod_oz", shrimp: "shrimp_oz",
    }[protein];
    const titles = {
      beef: "Ground beef salad jar", turkey: "Turkey salad jar", chicken: "Chicken salad jar",
      chicken_thigh: "Chicken thigh salad jar", salmon: "Salmon salad jar", cod: "Cod salad jar",
      shrimp: "Shrimp salad jar",
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
    return { tier, bowlProteins, saladProteins, breakfastFlavors, smoothieSafeFlavors, nutKeys, fruits };
  }

  /**
   * Build one meal suggestion of an explicit type (not locked by slot position).
   * seed cycles flavors / proteins / veg / fat styles.
   */
  function buildMealSuggestionForType(type, calories, targetGrams, seed, planOptions) {
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

    // Cheap proteins first; exclude seafood when preferCheapProtein
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
    const smoothieSafeFlavors = breakfastFlavors.filter((f) => f !== "pumpkin_spice" && f !== "banana_bread");
    // Peanuts first on budget tiers; pricey nuts mainly on high
    const nutKeys =
      tier.preferCheapProduce || tier.preferCheapProtein
        ? tier.reduceVariety
          ? ["peanuts_oz"]
          : ["peanuts_oz", "almonds_oz"]
        : ["almonds_oz", "peanuts_oz", "cashews_oz", "pistachios_oz"];
    const leanKinds = ["cottage", "greek"];
    // Cheap lean fruits: pineapple over peach/mango/berries when budget-tight
    const fruits = tier.preferCheapProduce
      ? tier.reduceVariety
        ? ["pineapple", "peach"]
        : ["pineapple", "peach", "mango", "berries"]
      : ["pineapple", "peach", "mango", "berries"];

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
        if (planOptions.freeMealTypes) {
          // Variant-driven among all 4 meal types (used by day reroll / free mix)
          const type = MEAL_TYPES_ALL[(variant + mealCount) % MEAL_TYPES_ALL.length];
          suggestion = buildMealSuggestionForType(type, slot.calories, tg, variant + mealCount * 17, {
            budget: planOptions.budget,
            tier,
            tierOverrides: planOptions.tierOverrides,
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
            if (variant % 2 === 1) {
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
          if ((variant + bowlI) % 2 === 1) {
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

    for (const r of results) {
      if (r && r.suggestion) finalizeSuggestion(r.suggestion);
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
        if (!agg[ing._key]) agg[ing._key] = 0;
        agg[ing._key] += (ing._qty || 0) * planDays;
      }
    }

    // Drive Onboarding: credit leftover inventory (e.g. 4 leftover eggs → order 4 fewer).
    const onHand = {};
    const inv = (answers && answers._inventory) || [];
    inv.forEach((it) => {
      if (!it || !it.key) return;
      onHand[it.key] = (onHand[it.key] || 0) + (Number(it.qtyRemaining) || 0);
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
    };
    const macroPct = currentPlan.daily.macros;
    const tg = gramsExact(slot.calories, macroPct);
    const isMeal = slot.kind === "meal";

    // Build candidate list: meals explore all 4 template types; snacks explore nut/cottage/greek/hb_egg
    const candidates = [];
    if (isMeal) {
      const orderedTypes = MEAL_TYPES_ALL.slice().sort((a, b) => {
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
      const orderedSnacks = SNACK_TYPES_ALL.slice().sort((a, b) => {
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
          planVariant = randomPlanVariant();
          answers.__lockedPlan = null;
          answers._slotVariants = [];
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
          </article>`
        );
        slotsEl.appendChild(card);
      });

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
      showResult();
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

  global.MealPlanOnboarding = {
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
  };
})(typeof window !== "undefined" ? window : globalThis);
