
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "http://localhost:3000/api";

async function testApprovalWorkflow() {
  console.log("\n✅ Testing Approval Workflow...\n");

  let teacherToken;
  let principalToken;
  let contentId;

  // Step 1: Login as Teacher
  console.log("1️⃣ Logging in as Teacher...");
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: "teacher@school.com",
      password: "teacher123",
    });
    teacherToken = loginRes.data.data.token;
    console.log("    Teacher logged in");
  } catch (error) {
    console.log("    Teacher login failed");
    return;
  }

 
  console.log("\n Uploading content for approval...");

  
  const testImagePath = path.join(__dirname, "../../test-upload.jpg");
  fs.writeFileSync(testImagePath, "Test content for approval");

  const formData = new FormData();
  formData.append("file", fs.createReadStream(testImagePath));
  formData.append("title", "Test Content for Approval");
  formData.append("subject", "Science");
  formData.append("description", "This content needs principal approval");
  formData.append("start_time", new Date().toISOString());
  formData.append(
    "end_time",
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  );
  formData.append("rotation_duration", "10");

  try {
    const uploadRes = await axios.post(`${API_URL}/content/upload`, formData, {
      headers: {
        Authorization: `Bearer ${teacherToken}`,
        ...formData.getHeaders(),
      },
    });
    contentId = uploadRes.data.data.id;
    console.log("   Content uploaded successfully");
    console.log(`   Content ID: ${contentId}`);
    console.log(`   Status: ${uploadRes.data.data.status}`);
  } catch (error) {
    console.log("   Upload failed:", error.response?.data?.message);
    fs.unlinkSync(testImagePath);
    return;
  }


  fs.unlinkSync(testImagePath);

  
  console.log("\n3️⃣ Logging in as Principal...");
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: "principal@school.com",
      password: "principal123",
    });
    principalToken = loginRes.data.data.token;
    console.log("    Principal logged in");
  } catch (error) {
    console.log("    Principal login failed");
    return;
  }


  console.log("\n Viewing pending content...");
  try {
    const pendingRes = await axios.get(`${API_URL}/content/pending`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    console.log(`  Found ${pendingRes.data.count} pending content items`);
    if (pendingRes.data.data.length > 0) {
      console.log("   Pending content titles:");
      pendingRes.data.data.forEach((c) =>
        console.log(`     - ${c.title} (${c.subject})`),
      );
    }
  } catch (error) {
    console.log("    Failed:", error.response?.data?.message);
  }

  // Step 5: Test Rejection First
  console.log("\n Testing rejection workflow...");
  try {
    const rejectRes = await axios.post(
      `${API_URL}/content/${contentId}/reject`,
      { rejection_reason: "Please improve the image quality" },
      { headers: { Authorization: `Bearer ${principalToken}` } },
    );
    console.log("    Content rejected");
    console.log(`   Reason: ${rejectRes.data.data.rejection_reason}`);
    console.log(`   Status: ${rejectRes.data.data.status}`);
  } catch (error) {
    console.log("   Rejection failed:", error.response?.data?.message);
  }

 
  console.log("\n Uploading another content for approval test...");
  const testImagePath2 = path.join(__dirname, "../../test-upload2.jpg");
  fs.writeFileSync(testImagePath2, "Another test content");

  const formData2 = new FormData();
  formData2.append("file", fs.createReadStream(testImagePath2));
  formData2.append("title", "Good Content Ready for Approval");
  formData2.append("subject", "Maths");
  formData2.append("description", "This content is ready for approval");
  formData2.append("start_time", new Date().toISOString());
  formData2.append(
    "end_time",
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  );
  formData2.append("rotation_duration", "5");

  let newContentId;
  try {
    const uploadRes = await axios.post(`${API_URL}/content/upload`, formData2, {
      headers: {
        Authorization: `Bearer ${teacherToken}`,
        ...formData2.getHeaders(),
      },
    });
    newContentId = uploadRes.data.data.id;
    console.log("   Content uploaded successfully");
    console.log(`   Content ID: ${newContentId}`);
  } catch (error) {
    console.log("  Upload failed:", error.response?.data?.message);
    fs.unlinkSync(testImagePath2);
    return;
  }

  fs.unlinkSync(testImagePath2);

  
  console.log("\n Testing approval workflow...");
  try {
    const approveRes = await axios.post(
      `${API_URL}/content/${newContentId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${principalToken}` } },
    );
    console.log("   Content approved!");
    console.log(`   Status: ${approveRes.data.data.status}`);
    console.log(`   Approved by: ${approveRes.data.data.approved_by}`);
    console.log(`   Approved at: ${approveRes.data.data.approved_at}`);
  } catch (error) {
    console.log("  Approval failed:", error.response?.data?.message);
  }


  console.log("\n Checking subject schedule...");
  try {
    
    const contentRes = await axios.get(`${API_URL}/content/all`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });

    const approvedContent = contentRes.data.data.filter(
      (c) => c.status === "approved",
    );
    console.log(`   Total approved content: ${approvedContent.length}`);

    const subjects = {};
    approvedContent.forEach((c) => {
      if (!subjects[c.subject]) subjects[c.subject] = [];
      subjects[c.subject].push(c.title);
    });

    console.log("   Content by subject:");
    Object.keys(subjects).forEach((subject) => {
      console.log(`     - ${subject}: ${subjects[subject].length} items`);
    });
  } catch (error) {
    console.log("  Failed:", error.response?.data?.message);
  }

  
  console.log("\n Getting content statistics...");
  try {
    const statsRes = await axios.get(`${API_URL}/content/stats`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    console.log("   Dashboard Statistics:");
    console.log(`     Total Content: ${statsRes.data.data.total}`);
    console.log(`     Pending: ${statsRes.data.data.pending}`);
    console.log(`     Approved: ${statsRes.data.data.approved}`);
    console.log(`     Rejected: ${statsRes.data.data.rejected}`);
    console.log("     By Subject:");
    Object.entries(statsRes.data.data.by_subject).forEach(
      ([subject, count]) => {
        console.log(`       - ${subject}: ${count}`);
      },
    );
  } catch (error) {
    console.log("   Failed:", error.response?.data?.message);
  }

  console.log("\n Approval workflow tests completed!\n");
}


testApprovalWorkflow().catch(console.error);
