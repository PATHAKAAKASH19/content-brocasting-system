
import axios from "axios";
import schedulingService from "../services/scheduling.service.js";

const API_URL = "http://localhost:3000/api";

async function testScheduling() {
  console.log("\nTesting Scheduling & Rotation Logic...\n");

  let principalToken;

  console.log("Logging in as Principal...");
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: "principal@school.com",
      password: "principal123",
    });
    principalToken = loginRes.data.data.token;
    console.log(" Principal logged in");
  } catch (error) {
    console.log("Principal login failed");
    return;
  }

  console.log("\nTesting getActiveContent for Maths...");
  try {
    const result = await schedulingService.getActiveContent("Maths");
    if (result.hasContent) {
      console.log("Active content found!");
      console.log(`Current: ${result.data.active.title}`);
      console.log(
        `   Remaining: ${result.data.schedule_info.remaining_time_formatted}`,
      );
      console.log(`   Next: ${result.data.next_content?.title || "None"}`);
    } else {
      console.log("No active content for Maths");
    }
  } catch (error) {
    console.log("Error:", error.message);
  }

 
  console.log("\nTesting Schedule Preview API for Maths...");
  try {
    const previewRes = await axios.get(
      `${API_URL}/schedule/preview/Maths?minutes=30`,
      {
        headers: { Authorization: `Bearer ${principalToken}` },
      },
    );

    if (previewRes.data.success) {
      console.log("Schedule preview generated");
      console.log(
        `   Total content in rotation: ${previewRes.data.data.total_contents}`,
      );
      console.log(
        `   Total cycle duration: ${previewRes.data.data.total_cycle_duration} minutes`,
      );
      console.log(
        `   Current content: ${previewRes.data.data.current_content.title}`,
      );
      console.log(
        `   Remaining time: ${previewRes.data.data.current_remaining_time}`,
      );
      console.log(
        `   Upcoming schedule (${previewRes.data.data.preview_minutes} min):`,
      );

      const upcoming = previewRes.data.data.upcoming_schedule.slice(0, 5);
      upcoming.forEach((item) => {
        console.log(`     - ${item.time_range}: ${item.title}`);
      });
    }
  } catch (error) {
    console.log("Error:", error.response?.data?.message || error.message);
  }


  console.log("\n Testing Get Active Content API...");
  try {
    const activeRes = await axios.get(`${API_URL}/schedule/active/Science`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });

    if (activeRes.data.hasContent) {
      console.log("Active content API working");
      console.log(
        `   Current Science content: ${activeRes.data.data.active.title}`,
      );
    } else {
      console.log("No active content for Science");
    }
  } catch (error) {
    console.log("Error:", error.message);
  }

  console.log("\nTesting Rotation Status Dashboard...");
  try {
    const statusRes = await axios.get(`${API_URL}/schedule/status`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });

    if (statusRes.data.success) {
      console.log("Rotation status retrieved");
      console.log("Status by subject:");
      Object.entries(statusRes.data.data).forEach(([subject, info]) => {
        const status = info.is_active ? "Active" : "Inactive";
        console.log(
          `     - ${subject}: ${status} | ${info.total_content} items`,
        );
        if (info.current_content) {
          console.log(
            `Current: ${info.current_content.title} (${info.next_rotation_in} remaining)`,
          );
        }
      });
    }
  } catch (error) {
    console.log("Error:", error.message);
  }


  console.log("\nTesting Full Schedule API...");
  try {
    const fullRes = await axios.get(`${API_URL}/schedule/full/Maths`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });

    if (fullRes.data.success) {
      console.log("Full schedule retrieved");
      console.log(
        `   Total content in Maths rotation: ${fullRes.data.data.total_content}`,
      );
      console.log("Rotation order:");
      fullRes.data.data.rotation_order.forEach((item) => {
        console.log(
          `     ${item.position}. ${item.title} (${item.duration} min)`,
        );
      });
    }
  } catch (error) {
    console.log("Error:", error.message);
  }

  
  console.log("\nRotation Logic Demonstration:");
  console.log("How rotation works:");
  console.log("   ┌─────────────────────────────────────────────────────────┐");
  console.log("   │ Example: 3 Maths papers with 5 minutes each            │");
  console.log("   │ Total cycle = 15 minutes                               │");
  console.log("   │                                                         │");
  console.log("   │ Time 0-5 min    → Paper A (Algebra Quiz)               │");
  console.log("   │ Time 5-10 min   → Paper B (Geometry Test)              │");
  console.log("   │ Time 10-15 min  → Paper C (Calculus Paper)             │");
  console.log("   │ Time 15-20 min  → Paper A again (loops)                │");
  console.log("   └─────────────────────────────────────────────────────────┘");

  console.log("\nScheduling tests completed!\n");
}

testScheduling().catch(console.error);
