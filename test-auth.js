

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  firstName: 'John',
  lastName: 'Doe',
  userName: 'nabl-api',
  email: 'nabl.api@example.com',
  password: '123',
  confirmPassword: '123',
  organization: 'Test Organization'
};

let accessToken = null;
let userId = null;

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      ...options.headers
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  console.log(`${options.method || 'GET'} ${endpoint}:`, response.status, data);
  return { response, data };
}

async function testRegister() {
  console.log('\n=== Testing Registration ===');
  const { data } = await makeRequest('/users/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  if (data.success) {
    console.log('✅ Registration successful');
  } else {
    console.log('❌ Registration failed:', data.message);
  }
}

async function testLogin() {
  console.log('\n=== Testing Login ===');
  const { data } = await makeRequest('/users/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });
  
  if (data.success) {
    accessToken = data.data.accessToken;
    userId = data.data.userId;
    console.log('✅ Login successful');
    console.log('Access Token:', accessToken.substring(0, 50) + '...');
  } else {
    console.log('❌ Login failed:', data.message);
  }
}

async function testGetProfile() {
  console.log('\n=== Testing Get Profile ===');
  const { data } = await makeRequest('/users/profile');
  
  if (data.success) {
    console.log('✅ Get profile successful');
    console.log('User data:', data.data);
  } else {
    console.log('❌ Get profile failed:', data.message);
  }
}

async function testUpdateProfile() {
  console.log('\n=== Testing Update Profile ===');
  const { data } = await makeRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify({
      firstname: 'John Updated',
      lastname: 'Doe Updated'
    })
  });
  
  if (data.success) {
    console.log('✅ Update profile successful');
  } else {
    console.log('❌ Update profile failed:', data.message);
  }
}

async function testChangePassword() {
  console.log('\n=== Testing Change Password ===');
  const { data } = await makeRequest('/users/change-password', {
    method: 'PUT',
    body: JSON.stringify({
      currentPassword: testUser.password,
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123'
    })
  });
  
  if (data.success) {
    console.log('✅ Change password successful');
    testUser.password = 'newpassword123';
  } else {
    console.log('❌ Change password failed:', data.message);
  }
}

async function testLogout() {
  console.log('\n=== Testing Logout ===');
  const { data } = await makeRequest('/users/logout', {
    method: 'POST'
  });
  
  if (data.success) {
    console.log('✅ Logout successful');
    accessToken = null;
  } else {
    console.log('❌ Logout failed:', data.message);
  }
}

async function testProtectedRouteWithoutToken() {
  console.log('\n=== Testing Protected Route Without Token ===');
  const { data } = await makeRequest('/users/profile');
  
  if (!data.success && data.message.includes('Access token is required')) {
    console.log('✅ Properly rejected request without token');
  } else {
    console.log('❌ Should have rejected request without token');
  }
}

async function testHealthCheck() {
  console.log('\n=== Testing Health Check ===');
  const { data } = await makeRequest('/health');
  
  if (data.success) {
    console.log('✅ Health check successful');
    console.log('Server status:', data.message);
  } else {
    console.log('❌ Health check failed:', data.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Authentication Tests...\n');
  
  try {
    await testHealthCheck();
    await testRegister();
    await testLogin();
    await testGetProfile();
    await testUpdateProfile();
    await testChangePassword();
    await testLogout();
    await testProtectedRouteWithoutToken();
    
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests }; 