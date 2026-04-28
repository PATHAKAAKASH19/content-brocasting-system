
import axios from "axios";

const API_URL = "http://localhost:3000/api/auth";

async function testAuth() {
  console.log("\n Testing Authentication System...\n");

 
  console.log("Testing Registration:");
  try {
    const registerRes = await axios.post(`${API_URL}/register`, {
      name: "Test Teacher",
      email: "testteacher@example.com",
      password: "password123",
      role: "teacher",
    });
    console.log("   Registration successful:", registerRes.data.message);
    console.log("   User ID:", registerRes.data.data.id);
  } catch (error) {
    if (error.response?.status === 409) {
      console.log("   User already exists, skipping registration");
    } else {
      console.log(
        "    Registration failed:",
        error.response?.data?.message || error.message,
      );
    }
  }
  console.log("");

 
  console.log(" Testing Login:");
  let token;
  try {
    const loginRes = await axios.post(`${API_URL}/login`, {
      email: "testteacher@example.com",
      password: "password123",
    });
    token = loginRes.data.data.token;
    console.log("    Login successful");
    console.log("   User:", loginRes.data.data.user.name);
    console.log("   Role:", loginRes.data.data.user.role);
    console.log("   Token received:", token ? "Yes" : "No");
  } catch (error) {
    console.log(
      "    Login failed:",
      error.response?.data?.message || error.message,
    );
  }
  console.log("");

 
  if (token) {
    console.log("Testing Protected Route (GET /me):");
    try {
      const meRes = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("   Successfully accessed protected route");
      console.log(
        "   User info:",
        meRes.data.data.name,
        `(${meRes.data.data.role})`,
      );
    } catch (error) {
      console.log(
        "   Failed:",
        error.response?.data?.message || error.message,
      );
    }
    console.log("");

    
    console.log("Testing Role-Based Access (Teacher route):");
    try {
      const teacherRes = await axios.get(`${API_URL}/teacher-only`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("    Teacher route accessible");
    } catch (error) {
      if (error.response?.status === 403) {
        console.log("   Access denied (expected if not teacher)");
      } else {
        console.log(
          "    Error:",
          error.response?.data?.message || error.message,
        );
      }
    }
  }

  console.log("\n Authentication tests completed!\n");
}


testAuth().catch(console.error);
