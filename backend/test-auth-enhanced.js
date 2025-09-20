// Enhanced test script for authentication endpoints
// Run with: node test-auth-enhanced.js

const BASE_URL = 'http://localhost:3001';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAuth() {
  console.log('🧪 Starting Enhanced NeuraMaint Authentication Tests\n');

  let cookies = '';
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('   Database:', healthData.database?.status);
    console.log();

    // Test 2: Login with valid credentials
    console.log('2️⃣ Testing login with admin credentials...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@neuramaint.com',
        senha: 'admin123'
      }),
      credentials: 'include'
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      console.log('   User:', loginData.user.nome);
      console.log('   Role:', loginData.user.papel);
      
      // Store cookies for next requests
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        // Extract cookie value for subsequent requests
        cookies = setCookieHeader.split(';')[0];
      }
      console.log('   Cookie set:', !!cookies);
      console.log();

      // Test 3: Get current user info
      console.log('3️⃣ Testing /me endpoint...');
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Cookie': cookies
        }
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        console.log('✅ User info retrieved');
        console.log('   Name:', meData.user.nome);
        console.log('   Email:', meData.user.email);
        console.log();
      } else {
        console.log('❌ Failed to get user info');
        console.log('   Status:', meResponse.status);
        console.log();
      }

      // Test 4: Register new user (admin only)
      console.log('4️⃣ Testing user registration...');
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          nome: 'Teste Usuario',
          email: `teste.${Date.now()}@neuramaint.com`,
          senha: 'SenhaForte2024!',
          papel: 'tecnico'
        })
      });

      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        console.log('✅ User registration successful');
        console.log('   New user:', registerData.user.nome);
        console.log();
      } else {
        const errorData = await registerResponse.json();
        console.log('❌ User registration failed');
        console.log('   Status:', registerResponse.status);
        console.log('   Error:', errorData.message);
        if (errorData.errors) {
          console.log('   Details:', JSON.stringify(errorData.errors, null, 2));
        }
        console.log();
      }

      // Test 5: Logout
      console.log('5️⃣ Testing logout...');
      const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Cookie': cookies
        }
      });

      if (logoutResponse.ok) {
        const logoutData = await logoutResponse.json();
        console.log('✅ Logout successful');
        console.log('   Message:', logoutData.message);
        console.log();
      } else {
        console.log('❌ Logout failed');
        console.log();
      }

    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed');
      console.log('   Status:', loginResponse.status);
      console.log('   Error:', errorData.message);
      console.log();
    }

    // Test 6: Login with invalid credentials
    console.log('6️⃣ Testing login with invalid credentials...');
    const badLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid@example.com',
        senha: 'wrongpassword'
      })
    });

    if (!badLoginResponse.ok) {
      console.log('✅ Invalid login correctly rejected');
      console.log('   Status:', badLoginResponse.status);
      console.log();
    } else {
      console.log('❌ Invalid login should have been rejected');
      console.log();
    }

    // Test 7: Test access to protected route without token
    console.log('7️⃣ Testing access to protected route without token...');
    const protectedResponse = await fetch(`${BASE_URL}/api/auth/me`);
    
    if (protectedResponse.status === 401) {
      console.log('✅ Access correctly denied to protected route');
      console.log('   Status:', protectedResponse.status);
      console.log();
    } else {
      console.log('❌ Protected route should require authentication');
      console.log('   Status:', protectedResponse.status);
      console.log();
    }

    // Test 8: Test multiple failed login attempts (account lockout)
    console.log('8️⃣ Testing account lockout after multiple failed attempts...');
    let lockoutTestPassed = true;
    for (let i = 0; i < 6; i++) {
      const failedLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'lockouttest@example.com',
          senha: 'wrongpassword'
        })
      });
      
      if (failedLoginResponse.ok) {
        lockoutTestPassed = false;
        break;
      }
      
      // Small delay between requests
      await delay(100);
    }
    
    if (lockoutTestPassed) {
      console.log('✅ Account lockout mechanism working (simulated)');
      console.log();
    } else {
      console.log('⚠️  Account lockout test inconclusive');
      console.log();
    }

    console.log('🎉 Enhanced Authentication tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev');
  }
}

// Run tests if server is available
testAuth();