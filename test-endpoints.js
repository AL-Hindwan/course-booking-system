const axios = require('axios');

// Using localhost to test resolution
const API_URL = 'http://localhost:5000/api/auth';
const TEST_USER = {
    name: 'Test Verify User',
    email: `verify-${Date.now()}@example.com`,
    password: 'Password123!',
    role: 'STUDENT'
};

const client = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    validateStatus: () => true // Don't throw on error status
});

async function testEndpoints() {
    console.log('🚀 Starting Endpoint Verification...\n');

    // 1. Health Check
    console.log('1. Testing Health Check...');
    try {
        const health = await axios.get('http://127.0.0.1:5000/health');
        console.log('✅ Health Check Passed:', health.data);
    } catch (e) {
        console.error('❌ Health Check Failed:', e.code || e.message);
        if (e.response) {
            console.error('   Status:', e.response.status);
            console.error('   Data:', JSON.stringify(e.response.data));
        } else {
            console.error('   No response received (Network Error)');
        }
        return;
    }

    // 2. Register
    console.log('\n2. Testing Registration...');
    try {
        const regRes = await client.post('/register', TEST_USER);
        if (regRes.status === 201) {
            console.log('✅ Registration Passed');
            console.log('   User ID:', regRes.data.data?.userId || 'No ID returned');
        } else {
            console.error('❌ Registration Failed:', regRes.status);
            console.error('   Error:', JSON.stringify(regRes.data, null, 2));
            return;
        }
    } catch (e) {
        console.error('❌ Registration Exception:', e.message);
        return;
    }

    // 3. Login
    console.log('\n3. Testing Login...');
    try {
        const loginRes = await client.post('/login', {
            email: TEST_USER.email,
            password: TEST_USER.password
        });

        var accessToken = '';
        var cookie = '';

        if (loginRes.status === 200) {
            console.log('✅ Login Passed');
            accessToken = loginRes.data.data?.accessToken;
            cookie = loginRes.headers['set-cookie'];
            console.log('   Access Token received:', !!accessToken);
            console.log('   Refresh Cookie received:', !!cookie);
        } else {
            console.error('❌ Login Failed:', loginRes.status);
            console.error('   Error:', JSON.stringify(loginRes.data, null, 2));
            return;
        }
    } catch (e) {
        console.error('❌ Login Exception:', e.message);
        return;
    }

    // 4. Get Profile (Protected)
    console.log('\n4. Testing Protected Route (/me)...');
    try {
        const meRes = await client.get('/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (meRes.status === 200) {
            console.log('✅ Protected Route Passed');
            console.log('   User Email:', meRes.data.data?.email);
        } else {
            console.error('❌ Protected Route Failed:', meRes.status);
            console.error('   Error:', JSON.stringify(meRes.data, null, 2));
        }
    } catch (e) {
        console.error('❌ Protected Route Exception:', e.message);
    }

    // 5. Refresh Token
    console.log('\n5. Testing Token Refresh...');
    try {
        const refreshRes = await client.post('/refresh', {}, {
            headers: { Cookie: cookie }
        });

        if (refreshRes.status === 200) {
            console.log('✅ Refresh Token Passed');
            console.log('   New Token received:', !!refreshRes.data.data?.accessToken);
        } else {
            console.error('❌ Refresh Token Failed:', refreshRes.status);
            console.error('   Error:', JSON.stringify(refreshRes.data, null, 2));
        }
    } catch (e) {
        console.error('❌ Refresh Token Exception:', e.message);
    }

    console.log('\n✨ Verification Complete!');
}

testEndpoints();
