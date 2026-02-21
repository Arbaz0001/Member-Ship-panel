/* eslint-disable no-void */

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("node:fs");
const path = require("node:path");

const auth = require("./routes/auth");
const members = require("./routes/membership");
const settings = require("./routes/settings");
const payment = require("./routes/payment");
const admin = require("./routes/admin");
const MembershipPrice = require("./models/MembershipPrice");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

const uploadBase = path.join(__dirname, "uploads");
const profileDir = path.join(uploadBase, "profiles");
const qrDir = path.join(uploadBase, "qr");
const paymentsDir = path.join(uploadBase, "payments");
[uploadBase, profileDir, qrDir, paymentsDir].forEach((dir) => {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use("/uploads", express.static(uploadBase));

app.use("/api/auth", auth);
app.use("/api/members", members);
app.use("/api/settings", settings);
app.use("/api/payment", payment);
app.use("/api/admin", admin);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

const cleanupMembershipPriceIndexes = async () => {
	try {
		const indexes = await MembershipPrice.collection.indexes();
		const legacyUniqueIndexes = indexes.filter(
			(index) => index.unique && index.name !== "_id_"
		);

		for (const index of legacyUniqueIndexes) {
			await MembershipPrice.collection.dropIndex(index.name);
			console.log(`Dropped legacy membership_prices index: ${index.name}`);
		}
	} catch (err) {
		if (err?.codeName !== "NamespaceNotFound") {
			console.error("Index cleanup warning:", err.message);
		}
	}
};

const startServer = async () => {
	await mongoose.connect(process.env.MONGO_URI);
	console.log("MongoDB Connected");
	await cleanupMembershipPriceIndexes();
	app.listen(port, () => console.log(`Server running on ${port}`));
};

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	try {
		await startServer();
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
})();

process.on("unhandledRejection", (reason) => {
	console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
	process.exit(1);
});
