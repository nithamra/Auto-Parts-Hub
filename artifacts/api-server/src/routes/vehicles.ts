import { Router } from "express";

const router = Router();

const VEHICLE_DATA: Record<string, Record<string, number[]>> = {
  Ford: {
    "F-150": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    "F-250": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Mustang": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    "Explorer": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Bronco": [2021, 2022, 2023, 2024],
    "Ranger": [2019, 2020, 2021, 2022, 2023, 2024],
    "Expedition": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
  },
  Chevrolet: {
    "Silverado 1500": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    "Silverado 2500": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Camaro": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    "Colorado": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Suburban": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Tahoe": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Blazer": [2019, 2020, 2021, 2022, 2023, 2024],
  },
  GMC: {
    "Sierra 1500": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    "Sierra 2500": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Canyon": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Yukon": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Terrain": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Acadia": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
  },
  Jeep: {
    "Wrangler": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    "Gladiator": [2020, 2021, 2022, 2023, 2024],
    "Grand Cherokee": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Cherokee": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Compass": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Renegade": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
  },
  Dodge: {
    "Ram 1500": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Ram 2500": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Charger": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "Challenger": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    "Durango": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
  },
};

// GET /vehicles/makes
router.get("/vehicles/makes", async (req, res) => {
  const makes = Object.entries(VEHICLE_DATA).map(([make, models]) => ({
    make,
    models: Object.keys(models),
  }));
  res.json(makes);
});

// GET /vehicles/models?make=Ford
router.get("/vehicles/models", async (req, res) => {
  const { make } = req.query as { make: string };
  if (!make || !VEHICLE_DATA[make]) return res.status(404).json({ error: "Make not found" });
  const models = Object.entries(VEHICLE_DATA[make]).map(([model, years]) => ({
    model,
    years,
  }));
  res.json(models);
});

// GET /vehicles/years?make=Ford&model=F-150
router.get("/vehicles/years", async (req, res) => {
  const { make, model } = req.query as { make: string; model: string };
  if (!make || !model || !VEHICLE_DATA[make]?.[model]) {
    return res.status(404).json({ error: "Make/model not found" });
  }
  res.json(VEHICLE_DATA[make][model]);
});

export default router;
