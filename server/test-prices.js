const mongoose = require("mongoose");
const MembershipPrice = require("./models/MembershipPrice");
const dotenv = require("dotenv");

dotenv.config();

const testPrices = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ Connected to MongoDB");

    // Check existing prices
    const allPrices = await MembershipPrice.find();
    console.log("\nAll prices in DB:", allPrices);

    // Test ensureFixedMembershipPrices logic
    const FIXED_PRICE_TYPES = [
      { type: "lifetime", name: "Lifetime" },
      { type: "two-year", name: "Two Year" },
    ];

    const docs = [];
    for (const fixed of FIXED_PRICE_TYPES) {
      const sameTypeDocs = await MembershipPrice.find({ type: fixed.type }).sort({ updatedAt: -1, createdAt: -1 });
      let doc = sameTypeDocs[0] || null;
      
      if (doc) {
        console.log(`\nFound existing ${fixed.type}:`, doc);
        doc = await MembershipPrice.findByIdAndUpdate(
          doc._id,
          { type: fixed.type, name: fixed.name },
          { new: true }
        );
        console.log(`Updated ${fixed.type}:`, doc);
      } else {
        console.log(`\nNo existing ${fixed.type}, creating...`);
        doc = await MembershipPrice.create({
          type: fixed.type,
          name: fixed.name,
          price: 0,
        });
        console.log(`Created ${fixed.type}:`, doc);
      }

      docs.push(doc);
    }

    console.log("\n\nFinal docs array:", docs);
    console.log("\n\nFinal prices query:");
    const lifetimeDoc = docs.find((item) => item.type === "lifetime");
    const twoYearDoc = docs.find((item) => item.type === "two-year");
    console.log("Lifetime:", lifetimeDoc);
    console.log("Two Year:", twoYearDoc);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

testPrices();
