import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import UserModel from "../models/user.model.js";

dotenv.config();

async function testUserModel() {
  console.log("\nTesting User Model...\n");

  try {
  
    console.log("Test 1: Check email existence");
    const exists = await UserModel.emailExists("principal@school.com");
    console.log(`Email exists: ${exists}\n`);

 
    console.log("Test 2: Find user by email");
    const user = await UserModel.findByEmail("principal@school.com");
    if (user) {
      console.log(
        `   Found: ${user.name} (${user.email}) - Role: ${user.role}`,
      );
      console.log(`User ID: ${user.id}\n`);
    } else {
      console.log("User not found\n");
    }

    if (user) {
      console.log("Test 3: Find user by ID");
      const userById = await UserModel.findById(user.id);
      console.log(`Found: ${userById.name}\n`);
    }

    
    console.log("Test 4: Get all teachers");
    const teachers = await UserModel.getAllTeachers();
    console.log(`Total teachers: ${teachers.length}`);
    teachers.forEach((t) => console.log(`   - ${t.name} (${t.email})`));
    console.log("");

    console.log("Test 5: Get user statistics");
    const stats = await UserModel.getStats();
    console.log(`Total Users: ${stats.totalUsers}`);
    console.log(`Total Teachers: ${stats.totalTeachers}`);
    console.log(`Active Teachers: ${stats.activeTeachers}\n`);

    console.log("All tests completed successfully!\n");
  } catch (error) {
    console.error("Test failed:", error.message || error);
    console.error("Full error details:", JSON.stringify(error, null, 2));
    console.error("Error stack:", error.stack);
  }
}


testUserModel();
