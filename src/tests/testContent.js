
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "http://localhost:3000/api";

async function testContent() {
  console.log("\n Testing Content Upload System...\n");

  let teacherToken;
  let principalToken;

 
  console.log("1️⃣ Logging in as Teacher...");
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: "teacher@school.com",
      password: "teacher123",
    });
    teacherToken = loginRes.data.data.token;
    console.log("  Teacher logged in");
  } catch (error) {
    console.log("    Teacher login failed. Please register first.");
    console.log("   Run: npm run test:auth first");
    return;
  }

  
  console.log("\n2️⃣ Uploading content...");

  
  const testImagePath = path.join(__dirname, "../../test-image.jpg");

 
  if (!fs.existsSync(testImagePath)) {
    
    fs.writeFileSync(testImagePath, "This is a test file");
    console.log("   ⚠️ Created test file (not an actual image)");
  }

  const formData = new FormData();
  formData.append("file", fs.createReadStream(testImagePath));
  formData.append("title", "Test Maths Content");
  formData.append("subject", "Maths");
  formData.append("description", "This is a test content for Maths subject");
  formData.append("start_time", new Date().toISOString());
  formData.append(
    "end_time",
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  );
  formData.append("rotation_duration", "5");

  try {
    const uploadRes = await axios.post(`${API_URL}/content/upload`, formData, {
      headers: {
        Authorization: `Bearer ${teacherToken}`,
        ...formData.getHeaders(),
      },
    });
    console.log("    Upload successful!");
    console.log("   Content ID:", uploadRes.data.data.id);
    console.log("   Status:", uploadRes.data.data.status);
  } catch (error) {
    console.log(
      "    Upload failed:",
      error.response?.data?.message || error.message,
    );
  }

 
  console.log("\n Getting teacher content...");
  try {
    const contentRes = await axios.get(`${API_URL}/content/teacher`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    console.log(`Found ${contentRes.data.count} content items`);
    if (contentRes.data.data.length > 0) {
      console.log("   First item:", contentRes.data.data[0].title);
    }
  } catch (error) {
    console.log(
      "    Failed:",
      error.response?.data?.message || error.message,
    );
  }

 
  console.log("\n4️⃣ Logging in as Principal...");
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: "principal@school.com",
      password: "principal123",
    });
    principalToken = loginRes.data.data.token;
    console.log("   Principal logged in");
  } catch (error) {
    console.log("    Principal login failed");
  }

 
  if (principalToken) {
    console.log("\n Getting all content (Principal view)...");
    try {
      const allContentRes = await axios.get(`${API_URL}/content/all`, {
        headers: { Authorization: `Bearer ${principalToken}` },
      });
      console.log(`   Total content: ${allContentRes.data.count}`);

     
      const pendingRes = await axios.get(
        `${API_URL}/content/all?status=pending`,
        {
          headers: { Authorization: `Bearer ${principalToken}` },
        },
      );
      console.log(`    Pending content: ${pendingRes.data.count}`);
    } catch (error) {
      console.log(
        "    Failed:",
        error.response?.data?.message || error.message,
      );
    }
  }

  console.log("\n Content upload tests completed!\n");

 
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }
}


testContent().catch(console.error);
