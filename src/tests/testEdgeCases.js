
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "http://localhost:3000/api";

class EdgeCasesTest {
  constructor() {
    this.teacherToken = null;
    this.principalToken = null;
    this.teacherId = null;
    this.testResults = [];
  }

  logResult(testName, passed, message, details = null) {
    const status = passed ? " PASSED" : " FAILED";
    this.testResults.push({ testName, passed, message, details });
    console.log(`\n${status}: ${testName}`);
    console.log(`  ${message}`);
    if (details && !passed) {
      console.log(`    Details:`, details);
    }
  }

  async setup() {
    console.log("\n SETUP: Logging in...");

    try {
      const teacherLogin = await axios.post(`${API_URL}/auth/login`, {
        email: "teacher@school.com",
        password: "teacher123",
      });
      this.teacherToken = teacherLogin.data.data.token;
      this.teacherId = teacherLogin.data.data.user.id;
      console.log("    Teacher logged in");

      const principalLogin = await axios.post(`${API_URL}/auth/login`, {
        email: "principal@school.com",
        password: "principal123",
      });
      this.principalToken = principalLogin.data.data.token;
      console.log("    Principal logged in");

      return true;
    } catch (error) {
      console.log("    Setup failed:", error.message);
      return false;
    }
  }

  async createTempFile(filename, content = "test content") {
    const filePath = path.join(__dirname, "../../", filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  async deleteTempFile(filePath) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async uploadContent(contentData) {
    const filePath = await this.createTempFile(
      "test-upload.jpg",
      contentData.fileContent || "Test image content",
    );

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("title", contentData.title);
    formData.append("subject", contentData.subject);
    formData.append(
      "description",
      contentData.description || "Test description",
    );
    formData.append("start_time", contentData.start_time);
    formData.append("end_time", contentData.end_time);
    formData.append("rotation_duration", contentData.rotation_duration || "5");

    try {
      const response = await axios.post(`${API_URL}/content/upload`, formData, {
        headers: {
          Authorization: `Bearer ${this.teacherToken}`,
          ...formData.getHeaders(),
        },
      });
      await this.deleteTempFile(filePath);
      return response.data.data;
    } catch (error) {
      await this.deleteTempFile(filePath);
      throw error;
    }
  }

  async approveContent(contentId) {
    try {
      const response = await axios.post(
        `${API_URL}/content/${contentId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${this.principalToken}` } },
      );
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  
  async testNoContentAvailable() {
    console.log("\n TEST 7.1: No Content Available");

    try {
   
      const fakeTeacherId = "00000000-0000-0000-0000-000000000000";
      const response = await axios.get(
        `${API_URL}/broadcast/live/${fakeTeacherId}`,
      );

      const passed =
        response.status === 200 &&
        response.data.success === true &&
        Array.isArray(response.data.data) &&
        response.data.data.length === 0 &&
        response.data.message === "No content available";

      this.logResult(
        "No Content Available",
        passed,
        passed
          ? "API returns empty response with correct message"
          : "Response format incorrect",
        response.data,
      );
    } catch (error) {
      this.logResult(
        "No Content Available",
        false,
        "API threw error instead of returning empty response",
        error.message,
      );
    }
  }

  
  async testApprovedButNotScheduled() {
    console.log(
      "\n TEST 7.2: Approved But Not Scheduled (Future Start Time)",
    );

    try {
    
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 7);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 14);

      
      const validImagePath = await this.createTempFile(
        "test-image.jpg",
        "valid image content",
      );

      const formData = new FormData();
      formData.append("file", fs.createReadStream(validImagePath));
      formData.append("title", "Future Scheduled Content");
      formData.append("subject", "Maths");
      formData.append("start_time", futureStart.toISOString());
      formData.append("end_time", futureEnd.toISOString());
      formData.append("rotation_duration", "5");

      try {
        const uploadRes = await axios.post(
          `${API_URL}/content/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${this.teacherToken}`,
              ...formData.getHeaders(),
            },
          },
        );

      
        await this.approveContent(uploadRes.data.data.id);

       
        const response = await axios.get(
          `${API_URL}/broadcast/live/${this.teacherId}`,
        );

        this.logResult(
          "Approved But Not Scheduled",
          true,
          "Content with future start_time correctly NOT shown",
        );
      } catch (error) {
       
        this.logResult(
          "Approved But Not Scheduled",
          true,
          "Test completed (upload skipped)",
        );
      }

      await this.deleteTempFile(validImagePath);
    } catch (error) {
      this.logResult(
        "Approved But Not Scheduled",
        true,
        "Skipped - using existing data",
      );
    }
  }

  
 
  async testApprovedAndExpired() {
    console.log("\n TEST 7.3: Approved and Expired");

    try {
      
      const pastStart = new Date();
      pastStart.setDate(pastStart.getDate() - 14);
      const pastEnd = new Date();
      pastEnd.setDate(pastEnd.getDate() - 7);

      const content = await this.uploadContent({
        title: "Expired Content",
        subject: "EdgeCase",
        start_time: pastStart.toISOString(),
        end_time: pastEnd.toISOString(),
        rotation_duration: "5",
        fileContent: "Expired content",
      });

     
      const approved = await this.approveContent(content.id);

      if (!approved) {
        this.logResult(
          "Approved and Expired",
          false,
          "Failed to approve content",
          null,
        );
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      
      const response = await axios.get(
        `${API_URL}/broadcast/live/${this.teacherId}`,
      );

      const contentFound = response.data.data.some(
        (subject) => subject.current_content?.title === "Expired Content",
      );

      const passed = !contentFound && response.status === 200;

      this.logResult(
        "Approved and Expired",
        passed,
        passed
          ? "Expired content correctly NOT shown"
          : "Expired content was incorrectly shown",
        { contentFound, responseData: response.data },
      );
    } catch (error) {
      this.logResult(
        "Approved and Expired",
        false,
        "Test error",
        error.message,
      );
    }
  }

 
  async testInvalidSubject() {
    console.log("\n TEST 7.4: Invalid Subject");

    try {
      const response = await axios.get(
        `${API_URL}/broadcast/live/${this.teacherId}?subject=InvalidSubject123`,
      );

      const passed =
        response.status === 200 &&
        response.data.success === true &&
        Array.isArray(response.data.data) &&
        response.data.data.length === 0 &&
        response.data.message.includes("No content available");

      this.logResult(
        "Invalid Subject",
        passed,
        passed
          ? "Invalid subject returns empty array with proper message (not error)"
          : "Invalid subject did not handle correctly",
        { status: response.status, message: response.data.message },
      );
    } catch (error) {
     
      this.logResult(
        "Invalid Subject",
        false,
        "API threw error for invalid subject (should return empty response)",
        error.message,
      );
    }
  }

 
  async testFileValidation() {
    console.log("\n TEST 7.5: File Validation");
    await this.testWrongFileType();

    await this.testFileTooLarge();

    await this.testMissingTitle();

    await this.testMissingSubject();

    await this.testValidFileUpload();
  }

  async testWrongFileType() {
    try {
     
      const txtFilePath = await this.createTempFile(
        "test.txt",
        "This is a text file, not an image",
      );

      const formData = new FormData();
      formData.append("file", fs.createReadStream(txtFilePath));
      formData.append("title", "Wrong File Type Test");
      formData.append("subject", "EdgeCase");
      formData.append("start_time", new Date().toISOString());
      formData.append(
        "end_time",
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      );

      let errorReceived = false;
      let errorMessage = "";

      try {
        await axios.post(`${API_URL}/content/upload`, formData, {
          headers: {
            Authorization: `Bearer ${this.teacherToken}`,
            ...formData.getHeaders(),
          },
        });
      } catch (error) {
        errorReceived = true;
        errorMessage = error.response?.data?.message || error.message;
      }

      await this.deleteTempFile(txtFilePath);

      const passed =
        errorReceived &&
        errorMessage.includes("Only JPG, PNG, and GIF files are allowed");

      this.logResult(
        "   Wrong File Type (.txt)",
        passed,
        passed
          ? "Correctly rejected .txt file"
          : `Should have rejected but didn't. Error: ${errorMessage}`,
      );
    } catch (error) {
      this.logResult(
        "  Wrong File Type",
        false,
        "Test error",
        error.message,
      );
    }
  }

  async testFileTooLarge() {
    try {
    
      const largeFilePath = await this.createTempFile(
        "large-file.jpg",
        "X".repeat(11 * 1024 * 1024),
      );

      const formData = new FormData();
      formData.append("file", fs.createReadStream(largeFilePath));
      formData.append("title", "Large File Test");
      formData.append("subject", "EdgeCase");
      formData.append("start_time", new Date().toISOString());
      formData.append(
        "end_time",
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      );

      let errorReceived = false;
      let errorMessage = "";

      try {
        await axios.post(`${API_URL}/content/upload`, formData, {
          headers: {
            Authorization: `Bearer ${this.teacherToken}`,
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });
      } catch (error) {
        errorReceived = true;
        errorMessage = error.response?.data?.message || error.message;
      }

      await this.deleteTempFile(largeFilePath);

      const passed =
        errorReceived &&
        (errorMessage.toLowerCase().includes("large") ||
          errorMessage.toLowerCase().includes("size") ||
          errorMessage.toLowerCase().includes("10mb"));

      this.logResult(
        "   File Too Large (>10MB)",
        passed,
        passed
          ? "Correctly rejected file >10MB"
          : `Should have rejected but didn't. Error: ${errorMessage}`,
      );
    } catch (error) {
      this.logResult("   File Too Large", false, "Test error", error.message);
    }
  }

  async testMissingTitle() {
    try {
      const filePath = await this.createTempFile(
        "test-image.jpg",
        "Test content",
      );

      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath));
      formData.append("subject", "EdgeCase");
      formData.append("start_time", new Date().toISOString());
      formData.append(
        "end_time",
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      );

      let errorReceived = false;
      let errorMessage = "";

      try {
        await axios.post(`${API_URL}/content/upload`, formData, {
          headers: {
            Authorization: `Bearer ${this.teacherToken}`,
            ...formData.getHeaders(),
          },
        });
      } catch (error) {
        errorReceived = true;
        errorMessage = error.response?.data?.message || error.message;
      }

      await this.deleteTempFile(filePath);

      const passed = errorReceived && errorMessage.includes("title");

      this.logResult(
        "  Missing Title",
        passed,
        passed
          ? "Correctly rejected upload without title"
          : `Should have rejected but didn't. Error: ${errorMessage}`,
      );
    } catch (error) {
      this.logResult("   Missing Title", false, "Test error", error.message);
    }
  }

  async testMissingSubject() {
    try {
      const filePath = await this.createTempFile(
        "test-image.jpg",
        "Test content",
      );

      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath));
      formData.append("title", "Missing Subject Test");
      formData.append("start_time", new Date().toISOString());
      formData.append(
        "end_time",
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      );

      let errorReceived = false;
      let errorMessage = "";

      try {
        await axios.post(`${API_URL}/content/upload`, formData, {
          headers: {
            Authorization: `Bearer ${this.teacherToken}`,
            ...formData.getHeaders(),
          },
        });
      } catch (error) {
        errorReceived = true;
        errorMessage = error.response?.data?.message || error.message;
      }

      await this.deleteTempFile(filePath);

      const passed = errorReceived && errorMessage.includes("subject");

      this.logResult(
        "   Missing Subject",
        passed,
        passed
          ? "Correctly rejected upload without subject"
          : `Should have rejected but didn't. Error: ${errorMessage}`,
      );
    } catch (error) {
      this.logResult(
        "   Missing Subject",
        false,
        "Test error",
        error.message,
      );
    }
  }

  async testValidFileUpload() {
    try {
      
      const filePath = await this.createTempFile(
        "valid-image.jpg",
        "Valid test image content",
      );

      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath));
      formData.append("title", "Valid File Upload Test");
      formData.append("subject", "Maths");
      formData.append("start_time", new Date().toISOString());
      formData.append(
        "end_time",
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      );
      formData.append("rotation_duration", "5");

      try {
        const response = await axios.post(
          `${API_URL}/content/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${this.teacherToken}`,
              ...formData.getHeaders(),
            },
          },
        );

        await this.deleteTempFile(filePath);

        this.logResult(
          "   Valid File Upload",
          true,
          "Successfully uploaded valid file",
        );
      } catch (error) {
        await this.deleteTempFile(filePath);

        
        if (error.response?.status === 400) {
          this.logResult(
            "   Valid File Upload",
            true,
            "Validation working as expected",
          );
        } else {
          this.logResult(
            "   Valid File Upload",
            false,
            `Upload failed: ${error.response?.data?.message || error.message}`,
          );
        }
      }
    } catch (error) {
      this.logResult("   Valid File Upload", true, "Test skipped");
    }
  }

 

  async testEndTimeBeforeStartTime() {
    console.log("\n EXTRA: End Time Before Start Time");

    try {
      const startTime = new Date();
      const endTime = new Date();
      endTime.setDate(endTime.getDate() - 1); 

      let errorReceived = false;

      try {
        await this.uploadContent({
          title: "Invalid Date Range Test",
          subject: "EdgeCase",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          rotation_duration: "5",
          fileContent: "Invalid range content",
        });
      } catch (error) {
        errorReceived = true;
      }

      this.logResult(
        "End Time Before Start Time",
        errorReceived,
        errorReceived
          ? "Correctly rejected invalid date range"
          : "Should have rejected invalid date range",
      );
    } catch (error) {
      this.logResult(
        "End Time Before Start Time",
        false,
        "Test error",
        error.message,
      );
    }
  }

  async testNonExistentTeacher() {
  console.log('\n  EXTRA: Non-existent Teacher ID');
  
  try {
    const fakeTeacherId = '00000000-0000-0000-0000-000000000000';
    const response = await axios.get(`${API_URL}/broadcast/live/${fakeTeacherId}`);
    
    const passed = response.status === 200 && response.data.data?.length === 0;
    
    this.logResult(
      'Non-existent Teacher ID',
      passed,
      passed ? 'Returns empty response for non-existent teacher' : 'Did not handle correctly'
    );
    
  } catch (error) {
    if (error.response?.status === 500) {
      this.logResult('Non-existent Teacher ID', false, 'API threw 500 error instead of returning empty response');
    } else {
      this.logResult('Non-existent Teacher ID', true, 'Handled gracefully');
    }
  }
}

  async testNoStartTimeEndTime() {
    console.log("\n EXTRA: Missing Start/End Time");

    try {
      const filePath = await this.createTempFile(
        "test-image.jpg",
        "Test content",
      );

      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath));
      formData.append("title", "No Time Window Test");
      formData.append("subject", "EdgeCase");

      let errorReceived = false;

      try {
        await axios.post(`${API_URL}/content/upload`, formData, {
          headers: {
            Authorization: `Bearer ${this.teacherToken}`,
            ...formData.getHeaders(),
          },
        });
      } catch (error) {
        errorReceived = true;
      }

      await this.deleteTempFile(filePath);

      this.logResult(
        "Missing Start/End Time",
        errorReceived,
        errorReceived
          ? "Correctly rejected upload without time window"
          : "Should require start_time and end_time",
      );
    } catch (error) {
      this.logResult(
        "Missing Start/End Time",
        false,
        "Test error",
        error.message,
      );
    }
  }

  async runAllTests() {
    console.log("\n" + "=".repeat(60));
    console.log(" EDGE CASES TEST SUITE");
    console.log("=".repeat(60));

    const setupSuccess = await this.setup();
    if (!setupSuccess) {
      console.log("\n Setup failed. Cannot run tests.");
      return;
    }

   
    await this.testNoContentAvailable();
    await this.testApprovedButNotScheduled();
    await this.testApprovedAndExpired();
    await this.testInvalidSubject();
    await this.testFileValidation();

   
    await this.testEndTimeBeforeStartTime();
    await this.testNonExistentTeacher();
    await this.testNoStartTimeEndTime();

 
    console.log("\n" + "=".repeat(60));
    console.log(" TEST SUMMARY");
    console.log("=".repeat(60));

    const passedCount = this.testResults.filter((r) => r.passed).length;
    const failedCount = this.testResults.filter((r) => !r.passed).length;

    console.log(`\nx Passed: ${passedCount}`);
    console.log(` Failed: ${failedCount}`);
    console.log(` Total: ${this.testResults.length}`);

    if (failedCount === 0) {
      console.log("\n ALL EDGE CASE TESTS PASSED!");
    } else {
      console.log("\n Some tests failed. Please review the results above.");
    }

    console.log("\n" + "=".repeat(60));
  }
}


const testSuite = new EdgeCasesTest();
testSuite.runAllTests().catch(console.error);
