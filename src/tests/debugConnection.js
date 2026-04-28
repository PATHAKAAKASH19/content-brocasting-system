
import dotenv from "dotenv";
import supabase from "../config/supabase.js";

dotenv.config();

async function debugConnection() {
  console.log("\n Debugging Supabase Connection...\n");

  console.log("Checking Environment Variables:");
  console.log(
    `   SUPABASE_URL: ${process.env.SUPABASE_URL ? "Set" : "Missing"}`,
  );
  console.log(
    `   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? "Set" : "Missing"}`,
  );
  console.log(
    `   JWT_SECRET: ${process.env.JWT_SECRET ? "Set" : "Missing"}`,
  );
  console.log("");

 
  console.log("Testing Supabase Connection:");
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.log(`Error: ${error.message}`);
      console.log(`Error Code: ${error.code}`);
      console.log(`Error Details:`, error);
    } else {
      console.log("Supabase connection successful!");
    }
  } catch (err) {
    console.log(`Connection failed: ${err.message}`);
  }
  console.log("");

  console.log("Checking Available Tables:");
  try {
  
    const { data, error } = await supabase.from("users").select("*").limit(1);

    if (error) {
      console.log(`Cannot access users table: ${error.message}`);
    } else {
      console.log("users table is accessible");
    }
  } catch (err) {
    console.log(`Error checking tables: ${err.message}`);
  }
  console.log("");

 
  console.log("Testing Raw SQL (if RPC enabled):");
  try {
   
    console.log("Trying to check if users table exists...");
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

debugConnection();
