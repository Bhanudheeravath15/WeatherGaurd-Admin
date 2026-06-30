async function runSimulation() {
  console.log('🏁 Starting WeatherGuard Full Pipeline Automation (Native Fetch)...');
  const baseUrl = 'http://localhost:3050/api'; // Wait! Let's check the port of the server - it is 3000! So let's make it 3000.
  // ... let's write it with http://localhost:3000/api
  const serverUrl = 'http://localhost:3000/api';

  try {
    // Step 1: Bootstrapping the Admin Account (double-hit triggers sandbox admin upgrade)
    console.log('\nStep 1: Registering Admin account (admin@example.com)...');
    await fetch(`${serverUrl}/auth/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        name: 'System Admin'
      })
    });
    
    // Second call triggers sandbox upgrade on existing account
    const adminRes = await fetch(`${serverUrl}/auth/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        name: 'System Admin'
      })
    });
    const adminData = await adminRes.json();
    if (!adminRes.ok) throw new Error(JSON.stringify(adminData));
    
    const adminToken = adminData.token;
    const adminId = adminData.user._id;
    console.log(`✅ Admin registered and promoted! ID: ${adminId}, Role: ${adminData.user.role}`);

    // Step 2: Registering a Pending User (user@example.com)...
    console.log('\nStep 2: Registering a new Pending User (user@example.com)...');
    const userRes = await fetch(`${serverUrl}/auth/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@example.com',
        name: 'Mock User'
      })
    });
    const userData = await userRes.json();
    if (!userRes.ok) throw new Error(JSON.stringify(userData));
    
    const userToken = userData.token;
    const userId = userData.user._id;
    console.log(`✅ User registered successfully! ID: ${userId}, Status: ${userData.user.status}`);

    // Step 3: Simulating Telegram Bot Linkage (@tester_bot) for User
    console.log('\nStep 3: Simulating Telegram Bot Linkage (@tester_bot) for User...');
    const linkRes = await fetch(`${serverUrl}/telegram/simulate-link`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ username: 'tester_bot' })
    });
    const linkData = await linkRes.json();
    if (!linkRes.ok) throw new Error(JSON.stringify(linkData));
    console.log(`✅ Telegram linked! Username: @${linkData.user.telegramUsername}, Chat ID: ${linkData.user.telegramChatId}`);

    // Step 4: Admin Vetting & Approval
    console.log('\nStep 4: Admin approving Pending User access request...');
    const approveRes = await fetch(`${serverUrl}/admin/users/${userId}/approve`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok) throw new Error(JSON.stringify(approveData));
    console.log(`✅ User account approved! New Status: ${approveData.status}`);

    // Step 5: Triggering Alerts Dispatch
    console.log('\nStep 5: Admin triggering manual weather alert dispatches to all approved users...');
    const alertRes = await fetch(`${serverUrl}/scheduler/trigger-alerts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const alertData = await alertRes.json();
    if (!alertRes.ok) throw new Error(JSON.stringify(alertData));
    
    const report = alertData.report;
    console.log('\n📊 Pipeline Dispatch Report:');
    console.log(`-----------------------------------`);
    console.log(`Total Users Processed : ${report.total}`);
    console.log(`Successful Dispatches : ${report.successCount}`);
    console.log(`Failed Dispatches     : ${report.failCount}`);
    console.log(`-----------------------------------`);
    
    console.log('\n🎉 WeatherGuard End-to-End Pipeline simulation completed successfully!');
  } catch (err) {
    console.error('❌ Simulation Error:', err.message);
  }
}

runSimulation();
