/**
 * Run with: pnpm --filter @workspace/api-server exec tsx src/seed-categories.ts
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

type Cat = { name: string; slug: string; sortOrder?: number; children?: Cat[] };

const TREE: Cat[] = [
  {
    name: "Auto Parts",
    slug: "auto-parts",
    sortOrder: 1,
    children: [
      {
        name: "Engine Parts",
        slug: "engine-parts",
        sortOrder: 1,
        children: [
          { name: "Air Filters", slug: "air-filters", sortOrder: 1 },
          { name: "Oil Filters", slug: "oil-filters", sortOrder: 2 },
          { name: "Fuel Filters", slug: "fuel-filters", sortOrder: 3 },
          { name: "Spark Plugs", slug: "spark-plugs", sortOrder: 4 },
          { name: "Timing Belts & Chains", slug: "timing-belts-chains", sortOrder: 5 },
          { name: "Water Pumps", slug: "water-pumps", sortOrder: 6 },
          { name: "Gaskets & Seals", slug: "gaskets-seals", sortOrder: 7 },
          { name: "Belts & Pulleys", slug: "belts-pulleys", sortOrder: 8 },
        ],
      },
      {
        name: "Brakes",
        slug: "brakes",
        sortOrder: 2,
        children: [
          { name: "Brake Pads", slug: "brake-pads", sortOrder: 1 },
          { name: "Brake Discs / Rotors", slug: "brake-discs-rotors", sortOrder: 2 },
          { name: "Brake Shoes", slug: "brake-shoes", sortOrder: 3 },
          { name: "Brake Calipers", slug: "brake-calipers", sortOrder: 4 },
          { name: "Brake Drums", slug: "brake-drums", sortOrder: 5 },
          { name: "Brake Hoses", slug: "brake-hoses", sortOrder: 6 },
          { name: "Brake Sensors", slug: "brake-sensors", sortOrder: 7 },
        ],
      },
      {
        name: "Suspension & Steering",
        slug: "suspension-steering",
        sortOrder: 3,
        children: [
          { name: "Shock Absorbers", slug: "shock-absorbers", sortOrder: 1 },
          { name: "Struts", slug: "struts", sortOrder: 2 },
          { name: "Springs", slug: "springs", sortOrder: 3 },
          { name: "Control Arms", slug: "control-arms", sortOrder: 4 },
          { name: "Ball Joints", slug: "ball-joints", sortOrder: 5 },
          { name: "Tie Rods", slug: "tie-rods", sortOrder: 6 },
          { name: "Bushings", slug: "bushings", sortOrder: 7 },
          { name: "Wheel Bearings", slug: "wheel-bearings", sortOrder: 8 },
        ],
      },
      {
        name: "Electrical",
        slug: "electrical",
        sortOrder: 4,
        children: [
          { name: "Batteries", slug: "batteries", sortOrder: 1 },
          { name: "Alternators", slug: "alternators", sortOrder: 2 },
          { name: "Starter Motors", slug: "starter-motors", sortOrder: 3 },
          { name: "Ignition Coils", slug: "ignition-coils", sortOrder: 4 },
          { name: "Sensors", slug: "sensors", sortOrder: 5 },
          { name: "Relays", slug: "relays", sortOrder: 6 },
          { name: "Fuses", slug: "fuses", sortOrder: 7 },
          { name: "Wiring", slug: "wiring", sortOrder: 8 },
        ],
      },
      {
        name: "Lighting",
        slug: "lighting",
        sortOrder: 5,
        children: [
          { name: "Headlight Bulbs", slug: "headlight-bulbs", sortOrder: 1 },
          { name: "LED Bulbs", slug: "led-bulbs", sortOrder: 2 },
          { name: "Tail Lights", slug: "tail-lights", sortOrder: 3 },
          { name: "Fog Lights", slug: "fog-lights", sortOrder: 4 },
          { name: "Interior Lights", slug: "interior-lights", sortOrder: 5 },
          { name: "DRLs", slug: "drls", sortOrder: 6 },
        ],
      },
      {
        name: "Cooling System",
        slug: "cooling-system",
        sortOrder: 6,
        children: [
          { name: "Radiators", slug: "radiators", sortOrder: 1 },
          { name: "Cooling Fans", slug: "cooling-fans", sortOrder: 2 },
          { name: "Thermostats", slug: "thermostats", sortOrder: 3 },
          { name: "Hoses", slug: "hoses", sortOrder: 4 },
          { name: "Expansion Tanks", slug: "expansion-tanks", sortOrder: 5 },
        ],
      },
      {
        name: "Transmission & Drivetrain",
        slug: "transmission-drivetrain",
        sortOrder: 7,
        children: [
          { name: "Clutch Kits", slug: "clutch-kits", sortOrder: 1 },
          { name: "CV Joints", slug: "cv-joints", sortOrder: 2 },
          { name: "Axles", slug: "axles", sortOrder: 3 },
          { name: "Driveshafts", slug: "driveshafts", sortOrder: 4 },
          { name: "Gearbox Parts", slug: "gearbox-parts", sortOrder: 5 },
          { name: "Flywheels", slug: "flywheels", sortOrder: 6 },
        ],
      },
      {
        name: "Exhaust System",
        slug: "exhaust-system",
        sortOrder: 8,
        children: [
          { name: "Mufflers", slug: "mufflers", sortOrder: 1 },
          { name: "Catalytic Converters", slug: "catalytic-converters", sortOrder: 2 },
          { name: "Oxygen Sensors", slug: "oxygen-sensors", sortOrder: 3 },
          { name: "Exhaust Pipes", slug: "exhaust-pipes", sortOrder: 4 },
          { name: "Mounts", slug: "mounts", sortOrder: 5 },
        ],
      },
      {
        name: "Body Parts",
        slug: "body-parts",
        sortOrder: 9,
        children: [
          { name: "Bumpers", slug: "bumpers", sortOrder: 1 },
          { name: "Fenders", slug: "fenders", sortOrder: 2 },
          { name: "Hoods", slug: "hoods", sortOrder: 3 },
          { name: "Mirrors", slug: "mirrors", sortOrder: 4 },
          { name: "Grilles", slug: "grilles", sortOrder: 5 },
          { name: "Door Handles", slug: "door-handles", sortOrder: 6 },
          { name: "Windshield Wipers", slug: "windshield-wipers", sortOrder: 7 },
        ],
      },
    ],
  },
  {
    name: "Oils & Fluids",
    slug: "oils-fluids",
    sortOrder: 2,
    children: [
      { name: "Engine Oil", slug: "engine-oil", sortOrder: 1 },
      { name: "Transmission Fluid", slug: "transmission-fluid", sortOrder: 2 },
      { name: "Brake Fluid", slug: "brake-fluid", sortOrder: 3 },
      { name: "Coolant / Antifreeze", slug: "coolant-antifreeze", sortOrder: 4 },
      { name: "Power Steering Fluid", slug: "power-steering-fluid", sortOrder: 5 },
      { name: "Differential Oil", slug: "differential-oil", sortOrder: 6 },
      { name: "Grease", slug: "grease", sortOrder: 7 },
      { name: "Additives", slug: "additives", sortOrder: 8 },
      { name: "Cleaners & Degreasers", slug: "cleaners-degreasers", sortOrder: 9 },
    ],
  },
  {
    name: "Car Accessories",
    slug: "car-accessories",
    sortOrder: 3,
    children: [
      {
        name: "Interior",
        slug: "interior-accessories",
        sortOrder: 1,
        children: [
          { name: "Seat Covers", slug: "seat-covers", sortOrder: 1 },
          { name: "Floor Mats", slug: "floor-mats", sortOrder: 2 },
          { name: "Steering Wheel Covers", slug: "steering-wheel-covers", sortOrder: 3 },
          { name: "Dashboard Accessories", slug: "dashboard-accessories", sortOrder: 4 },
          { name: "Organizers", slug: "organizers", sortOrder: 5 },
        ],
      },
      {
        name: "Exterior & Electronics",
        slug: "exterior-electronics",
        sortOrder: 2,
        children: [
          { name: "Phone Holders", slug: "phone-holders", sortOrder: 1 },
          { name: "Chargers", slug: "chargers", sortOrder: 2 },
          { name: "Dash Cameras", slug: "dash-cameras", sortOrder: 3 },
          { name: "Reverse Cameras", slug: "reverse-cameras", sortOrder: 4 },
          { name: "Car Covers", slug: "car-covers", sortOrder: 5 },
          { name: "Roof Racks", slug: "roof-racks", sortOrder: 6 },
          { name: "Air Fresheners", slug: "air-fresheners", sortOrder: 7 },
          { name: "Sun Shades", slug: "sun-shades", sortOrder: 8 },
          { name: "Jump Starters", slug: "jump-starters", sortOrder: 9 },
          { name: "Tire Inflators", slug: "tire-inflators", sortOrder: 10 },
        ],
      },
    ],
  },
  {
    name: "Tires & Wheels",
    slug: "tires-wheels",
    sortOrder: 4,
    children: [
      { name: "Tires", slug: "tires", sortOrder: 1 },
      { name: "Rims", slug: "rims", sortOrder: 2 },
      { name: "Wheel Nuts", slug: "wheel-nuts", sortOrder: 3 },
      { name: "Valve Stems", slug: "valve-stems", sortOrder: 4 },
      { name: "TPMS Sensors", slug: "tpms-sensors", sortOrder: 5 },
    ],
  },
  {
    name: "Tools & Garage",
    slug: "tools-garage",
    sortOrder: 5,
    children: [
      { name: "Socket Sets", slug: "socket-sets", sortOrder: 1 },
      { name: "Jacks", slug: "jacks", sortOrder: 2 },
      { name: "Jack Stands", slug: "jack-stands", sortOrder: 3 },
      { name: "Torque Wrenches", slug: "torque-wrenches", sortOrder: 4 },
      { name: "OBD-II Scanners", slug: "obd-ii-scanners", sortOrder: 5 },
      { name: "Battery Chargers", slug: "battery-chargers-tool", sortOrder: 6 },
      { name: "Funnels", slug: "funnels", sortOrder: 7 },
    ],
  },
  {
    name: "Performance Parts",
    slug: "performance-parts",
    sortOrder: 6,
    children: [
      { name: "Air Intakes", slug: "air-intakes", sortOrder: 1 },
      { name: "Performance Exhausts", slug: "performance-exhausts", sortOrder: 2 },
      { name: "Turbo Components", slug: "turbo-components", sortOrder: 3 },
      { name: "Suspension Kits", slug: "suspension-kits", sortOrder: 4 },
      { name: "ECU Tuners", slug: "ecu-tuners", sortOrder: 5 },
    ],
  },
];

async function insertTree(cats: Cat[], parentId: number | null = null) {
  for (const cat of cats) {
    // Upsert by slug
    const existing = await db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, cat.slug))
      .limit(1);

    let id: number;
    if (existing.length > 0) {
      await db
        .update(categoriesTable)
        .set({ name: cat.name, parentId, sortOrder: cat.sortOrder ?? 0 })
        .where(eq(categoriesTable.id, existing[0].id));
      id = existing[0].id;
    } else {
      const [row] = await db
        .insert(categoriesTable)
        .values({ name: cat.name, slug: cat.slug, parentId, sortOrder: cat.sortOrder ?? 0 })
        .returning({ id: categoriesTable.id });
      id = row.id;
    }

    if (cat.children?.length) {
      await insertTree(cat.children, id);
    }
  }
}

console.log("🌱 Seeding categories...");
await insertTree(TREE);
console.log("✅ Categories seeded successfully");
await pool.end();
