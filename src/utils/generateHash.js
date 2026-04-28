
import bcrypt from "bcryptjs";

async function generateHash() {
  const password = process.argv[2];

  if (!password) {
    console.log("Usage: node src/utils/generateHash.js <password>");
    console.log("Example: node src/utils/generateHash.js principal123");
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  console.log("\n=================================");
  console.log("Password:", password);
  console.log("Bcrypt Hash:", hash);
  console.log("=================================\n");
  console.log("Copy this hash into your SQL INSERT statement\n");
}

generateHash();
