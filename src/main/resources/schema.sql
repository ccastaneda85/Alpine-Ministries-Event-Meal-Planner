CREATE TABLE IF NOT EXISTS meal_plans (
    meal_plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS event_days (
    event_day_id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    meal_plan_id BIGINT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS meal_periods (
    meal_period_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_day_id BIGINT NOT NULL,
    menu_id BIGINT,
    meal_period_type VARCHAR(255) NOT NULL CHECK (meal_period_type IN ('BREAKFAST','LUNCH','DINNER'))
);

CREATE TABLE IF NOT EXISTS kitchen_prep_lists (
    kitchen_prep_list_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_day_id BIGINT NOT NULL UNIQUE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS kitchen_prep_list_items (
    kitchen_prep_list_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    kitchen_prep_list_id BIGINT NOT NULL,
    menu_item_id BIGINT,
    menu_item_name VARCHAR(255),
    adult_servings INTEGER,
    youth_servings INTEGER,
    kid_servings INTEGER,
    code_servings INTEGER,
    priority INTEGER,
    status VARCHAR(255) CHECK (status IN ('TODO','IN_PROGRESS','DONE')),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS group_reservations (
    group_reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_name VARCHAR(255) NOT NULL,
    default_adult_count INTEGER NOT NULL,
    default_youth_count INTEGER NOT NULL,
    default_kid_count INTEGER NOT NULL,
    default_code_count INTEGER NOT NULL,
    default_custom_diet_count INTEGER NOT NULL,
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    custom_diet_notes TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS group_meal_attendances (
    group_meal_attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_reservation_id BIGINT NOT NULL,
    meal_period_id BIGINT NOT NULL,
    adult_count INTEGER NOT NULL,
    youth_count INTEGER NOT NULL,
    kid_count INTEGER NOT NULL,
    code_count INTEGER NOT NULL,
    custom_diet_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS menus (
    menu_id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_items (
    menu_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_entries (
    menu_entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    display_order INTEGER
);

CREATE TABLE IF NOT EXISTS ingredients (
    ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_name VARCHAR(255) NOT NULL,
    unit_of_measure VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_item_recipes (
    menu_item_recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id BIGINT NOT NULL,
    ingredient_id BIGINT NOT NULL,
    adult_portion FLOAT NOT NULL,
    youth_portion FLOAT NOT NULL,
    kid_portion FLOAT NOT NULL,
    code_portion FLOAT NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS purchase_lists (
    purchase_list_id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_plan_id BIGINT NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    status VARCHAR(255) NOT NULL CHECK (status IN ('DRAFT','FINALIZED','PURCHASED')),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS purchase_list_items (
    purchase_list_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_list_id BIGINT NOT NULL,
    ingredient_id BIGINT,
    purchase_list_item_name VARCHAR(255) NOT NULL,
    quantity FLOAT NOT NULL,
    uom VARCHAR(255) NOT NULL,
    checked BOOLEAN NOT NULL,
    notes TEXT
);
