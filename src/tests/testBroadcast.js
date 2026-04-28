
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testBroadcastAPI() {
  console.log('\n Testing Public Broadcasting API...\n');
  
  let teacherId = null;
  let principalToken = null;
  

  console.log(' Getting teacher information...');
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'teacher@school.com',
      password: 'teacher123'
    });
    teacherId = loginRes.data.data.user.id;
    console.log(`   Teacher ID: ${teacherId}`);
 
    const principalLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'principal@school.com',
      password: 'principal123'
    });
    principalToken = principalLogin.data.data.token;
  } catch (error) {
    console.log('    Failed to get teacher info');
    return;
  }
  
  
  console.log('\n Testing Public Endpoint (No Auth Required)...');
  try {
    const response = await axios.get(`${API_URL}/broadcast/live/${teacherId}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Message: ${response.data.message}`);
    console.log(`   Data count: ${response.data.data.length}`);
  } catch (error) {
    console.log(`  Error: ${error.response?.status} - ${error.response?.data?.message}`);
  }
  
  console.log('\nTesting Subject Filtering...');
  try {
    const response = await axios.get(`${API_URL}/broadcast/live/${teacherId}?subject=Maths`);
    console.log(`    Filtered by Maths`);
    console.log(`   Message: ${response.data.message}`);
    console.log(`   Subject filter: ${response.data.subject_filter}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  

  console.log('\nTesting Invalid Subject...');
  try {
    const response = await axios.get(`${API_URL}/broadcast/live/${teacherId}?subject=InvalidSubject`);
    console.log(`    Response received (should be empty)`);
    console.log(`   Message: ${response.data.message}`);
    console.log(`   Data count: ${response.data.data.length}`);
  } catch (error) {
    console.log(`    Error: ${error.message}`);
  }
  
  
  console.log('\n Testing Get All Teachers Endpoint...');
  try {
    const response = await axios.get(`${API_URL}/broadcast/teachers`);
    console.log(`   Found ${response.data.count} teachers`);
    if (response.data.data.length > 0) {
      console.log(`   First teacher: ${response.data.data[0].name}`);
      console.log(`   Has active content: ${response.data.data[0].has_active_content}`);
    }
  } catch (error) {
    console.log(`    Error: ${error.message}`);
  }
  

  console.log('\n Testing Get Teacher Subjects Endpoint...');
  try {
    const response = await axios.get(`${API_URL}/broadcast/teacher/${teacherId}/subjects`);
    console.log(`   x Found ${response.data.count} subjects`);
    if (response.data.data.length > 0) {
      console.log(`   Subjects: ${response.data.data.join(', ')}`);
    }
  } catch (error) {
    console.log(`    Error: ${error.message}`);
  }
  
 
  console.log('\nTesting Broadcast by Subject...');
  try {
    const response = await axios.get(`${API_URL}/broadcast/subject/Maths`);
    console.log(`   Response received`);
    console.log(`   Message: ${response.data.message}`);
    console.log(`   Teachers with content: ${response.data.data.length}`);
  } catch (error) {
    console.log(`   x Error: ${error.message}`);
  }
  
  console.log('\n Testing Empty Response Formatting...');
  try {
    const fakeTeacherId = '00000000-0000-0000-0000-000000000000';
    const response = await axios.get(`${API_URL}/broadcast/live/${fakeTeacherId}`);
    console.log(`  Response format correct`);
    console.log(`   Success: ${response.data.success}`);
    console.log(`   Message: ${response.data.message}`);
    console.log(`   Data array: ${Array.isArray(response.data.data) ? 'Yes' : 'No'}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n Public Broadcasting API tests completed!\n');
}


testBroadcastAPI().catch(console.error);