const https = require('https');

const BASE_URL = 'https://frontend-gold-eight-78.vercel.app';

async function testLogin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@test.com',
      password: 'Test123!'
    });

    const options = {
      hostname: 'frontend-gold-eight-78.vercel.app',
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log('\n=== LOGIN TEST ===');
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', body);

        const cookies = res.headers['set-cookie'];
        resolve({ statusCode: res.statusCode, body, cookies });
      });
    });

    req.on('error', (error) => {
      console.error('Login Error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function testAdminReports(cookies) {
  return new Promise((resolve, reject) => {
    // Parse cookies to get just the auth token
    let cookieHeader = '';
    if (cookies && cookies.length > 0) {
      // Extract the sb-ofkcmmwibufljpemmdde-auth-token cookie
      const authCookie = cookies.find(c => c.includes('sb-ofkcmmwibufljpemmdde-auth-token'));
      if (authCookie) {
        // Clean up the cookie - remove path, domain, samesite attributes
        cookieHeader = authCookie.split(';')[0];
      }
    }

    console.log('\n=== Cookie being sent:', cookieHeader.substring(0, 100) + '...');

    const options = {
      hostname: 'frontend-gold-eight-78.vercel.app',
      path: '/api/admin/reports',
      method: 'GET',
      headers: {
        'Cookie': cookieHeader
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log('\n=== ADMIN REPORTS TEST ===');
        console.log('Status:', res.statusCode);
        console.log('Body:', body.substring(0, 1000));
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', (error) => {
      console.error('Admin Reports Error:', error);
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  try {
    // Test 1: Login
    const loginResult = await testLogin();

    // Test 2: Admin Reports (with session)
    await testAdminReports(loginResult.cookies);

    console.log('\n=== ALL TESTS COMPLETED ===');
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

runTests();
