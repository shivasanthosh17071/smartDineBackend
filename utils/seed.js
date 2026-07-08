/**
 * Seed script - populates the database with a demo branch, tables (with QR codes),
 * menu categories, and menu items so the frontend has data to work with immediately.
 *
 * Run with: npm run seed
 */
require("dotenv").config();
const connectDB = require("../config/db");
const Branch = require("../models/Branch");
const Table = require("../models/Table");
const MenuCategory = require("../models/MenuCategory");
const MenuItem = require("../models/MenuItem");
const { generateTableQR } = require("./qrGenerator");
const { v4: uuidv4 } = require("uuid");

const seed = async () => {
  await connectDB();
  console.log("🌱 Seeding SmartDine demo data...");

  await Promise.all([
    Branch.deleteMany({}),
    Table.deleteMany({}),
    MenuCategory.deleteMany({}),
    MenuItem.deleteMany({}),
  ]);

  const branch = await Branch.create({
    name: "SmartDine Downtown",
    address: "123 MG Road",
    city: "Hyderabad",
    phone: "+91-9000000000",
    gstNumber: "36ABCDE1234F1Z5",
  });

  const tableNumbers = ["T1", "T2", "T3", "T4", "T5"];
  for (const num of tableNumbers) {
    const table = await Table.create({
      branch: branch._id,
      tableNumber: num,
      capacity: 4,
      qrToken: uuidv4(),
    });
    const { qrToken, qrCodeImage } = await generateTableQR(table._id.toString());
    table.qrToken = qrToken;
    table.qrCodeImage = qrCodeImage;
    await table.save();
  }

  const starters = await MenuCategory.create({
    branch: branch._id,
    name: "Starters",
    displayOrder: 1,
  });
  const mains = await MenuCategory.create({
    branch: branch._id,
    name: "Main Course",
    displayOrder: 2,
  });
  const beverages = await MenuCategory.create({
    branch: branch._id,
    name: "Beverages",
    displayOrder: 3,
  });
  const desserts = await MenuCategory.create({
    branch: branch._id,
    name: "Desserts",
    displayOrder: 4,
  });

  await MenuItem.insertMany([
    {
      branch: branch._id,
      category: starters._id,
      name: "Paneer Tikka",
      description: "Chargrilled cottage cheese marinated in smoky spices",
      price: 220,
      isVeg: true,
      tags: ["bestseller"],
      spiceLevels: ["Mild", "Medium", "Hot"],
      prepTimeMinutes: 15,
    },
    {
      branch: branch._id,
      category: starters._id,
      name: "Chicken 65",
      description: "Spicy deep-fried chicken bites, South Indian style",
      price: 260,
      isVeg: false,
      spiceLevels: ["Medium", "Hot"],
      prepTimeMinutes: 18,
    },
    {
      branch: branch._id,
      category: mains._id,
      name: "Butter Chicken",
      description: "Creamy tomato-based curry with tandoori chicken",
      price: 340,
      isVeg: false,
      portionSizes: ["Half", "Full"],
      addOns: [{ name: "Extra Butter", price: 20 }],
      prepTimeMinutes: 22,
    },
    {
      branch: branch._id,
      category: mains._id,
      name: "Paneer Butter Masala",
      description: "Cottage cheese cubes in rich tomato gravy",
      price: 300,
      isVeg: true,
      portionSizes: ["Half", "Full"],
      prepTimeMinutes: 20,
    },
    {
      branch: branch._id,
      category: mains._id,
      name: "Veg Biryani",
      description: "Fragrant basmati rice with mixed vegetables and spices",
      price: 260,
      isVeg: true,
      tags: ["popular"],
      prepTimeMinutes: 25,
    },
    {
      branch: branch._id,
      category: beverages._id,
      name: "Masala Chaas",
      description: "Spiced buttermilk",
      price: 60,
      isVeg: true,
      prepTimeMinutes: 5,
    },
    {
      branch: branch._id,
      category: beverages._id,
      name: "Fresh Lime Soda",
      price: 80,
      isVeg: true,
      prepTimeMinutes: 5,
    },
    {
      branch: branch._id,
      category: desserts._id,
      name: "Gulab Jamun",
      description: "Warm milk dumplings soaked in sugar syrup",
      price: 120,
      isVeg: true,
      prepTimeMinutes: 8,
    },
  ]);

  console.log("✅ Seed complete!");
  console.log(`   Branch ID: ${branch._id}`);
  console.log("   5 tables created with QR codes");
  console.log("   4 categories, 8 menu items created");
  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
