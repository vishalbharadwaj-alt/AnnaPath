PRAGMA foreign_keys = ON;

-- ===============================
-- Tables converted for SQLite
-- ===============================

-- Food table
CREATE TABLE IF NOT EXISTS foods (
    food_id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_name TEXT NOT NULL,
    region TEXT NOT NULL
);

-- Ingredient table
CREATE TABLE IF NOT EXISTS ingredients (
    ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
    common_name TEXT NOT NULL,
    chemical_name TEXT NOT NULL,
    health_effect_tag TEXT NOT NULL
);

-- Mapping table
CREATE TABLE IF NOT EXISTS food_ingredients (
    food_id INTEGER,
    ingredient_id INTEGER,
    impact_level TEXT NOT NULL,
    reason TEXT,
    PRIMARY KEY (food_id, ingredient_id),
    FOREIGN KEY (food_id) REFERENCES foods(food_id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
);

-- ===============================
-- Insert data (ingredients, foods, mappings)
-- ===============================

INSERT INTO ingredients (common_name, chemical_name, health_effect_tag) VALUES
('Sugar', 'Sucrose', 'raises_blood_glucose'),
('Starch', 'Amylose and Amylopectin', 'raises_blood_glucose'),
('Protein', 'Amino acids', 'stabilizes_blood_sugar'),
('Omega-3 Fatty Acids', 'EPA and DHA', 'anti_inflammatory'),
('Dietary Fiber', 'Cellulose', 'slows_glucose_absorption'),
('Vitamin C', 'Ascorbic Acid', 'improves_insulin_response'),
('Saturated Fat', 'Fatty Acids', 'increases_insulin_resistance'),
('Caffeine', 'Alkaloid', 'metabolic_stimulation'),
('Refined Oil', 'Trans and Saturated Fats', 'insulin_resistance'),
('Sodium', 'Sodium Chloride', 'raises_blood_pressure');

-- Foods – Guwahati
INSERT INTO foods (food_name, region) VALUES
('White Rice', 'Guwahati'),
('Rohu Fish', 'Guwahati'),
('Catla Fish', 'Guwahati'),
('Broiler Chicken', 'Guwahati'),
('Local Chicken', 'Guwahati'),
('Potato', 'Guwahati'),
('Spinach', 'Guwahati'),
('Cabbage', 'Guwahati'),
('Drumstick (Moringa)', 'Guwahati'),
('Banana', 'Guwahati'),
('Apple', 'Guwahati'),
('Pomegranate', 'Guwahati'),
('Sweet Milk Tea', 'Guwahati'),
('Soft Drink', 'Guwahati'),
('Packaged Chips', 'Guwahati'),
('Nemu (Lime)', 'Guwahati'),
('Kaji Nemu', 'Guwahati');

-- Foods – North Guwahati
INSERT INTO foods (food_name, region) VALUES
('White Rice', 'North Guwahati'),
('Rohu Fish', 'North Guwahati'),
('Catla Fish', 'North Guwahati'),
('Local Chicken', 'North Guwahati'),
('Potato', 'North Guwahati'),
('Spinach', 'North Guwahati'),
('Cabbage', 'North Guwahati'),
('Drumstick (Moringa)', 'North Guwahati'),
('Banana', 'North Guwahati'),
('Plain Tea', 'North Guwahati'),
('Nemu (Lime)', 'North Guwahati'),
('Kaji Nemu', 'North Guwahati');

-- Food–Ingredient Mappings
INSERT INTO food_ingredients VALUES
(1, 2, 'avoid', 'High glycemic load, spikes blood sugar'),
(18, 2, 'avoid', 'High glycemic load, spikes blood sugar'),
(2, 3, 'safe', 'High-quality protein helps glucose stability'),
(2, 4, 'safe', 'Omega-3 supports metabolic health'),
(3, 3, 'safe', 'High-quality protein helps glucose stability'),
(3, 4, 'safe', 'Omega-3 supports metabolic health'),
(4, 3, 'safe', 'Protein improves satiety'),
(4, 7, 'limit', 'Excess fat may worsen insulin resistance'),
(5, 3, 'safe', 'Lean protein source'),
(5, 7, 'limit', 'Moderate fat content'),
(6, 2, 'avoid', 'Rapid glucose release'),
(7, 5, 'safe', 'Fiber slows glucose absorption'),
(8, 5, 'safe', 'Fiber supports sugar control'),
(9, 5, 'safe', 'Low glycemic vegetable'),
(10, 2, 'limit', 'Natural sugar content'),
(11, 5, 'safe', 'Fiber and antioxidants'),
(12, 5, 'safe', 'Improves insulin sensitivity'),
(13, 1, 'avoid', 'Causes sharp blood sugar spikes'),
(13, 8, 'limit', 'Excess caffeine may stress metabolism'),
(14, 1, 'avoid', 'Extremely high added sugar'),
(15, 9, 'avoid', 'Refined oils worsen insulin resistance'),
(15, 10, 'limit', 'High sodium content'),
(16, 6, 'safe', 'Low sugar citrus, improves insulin response'),
(17, 6, 'safe', 'Vitamin C rich, safe for diabetes and thyroid'),
(28, 6, 'safe', 'Low sugar citrus'),
(29, 6, 'safe', 'Traditional Assam lime, metabolically safe');