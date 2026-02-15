const axios = require('axios');

async function testRegister() {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/register', {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User',
      role: 'STUDENT'
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Registration failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

testRegister();
