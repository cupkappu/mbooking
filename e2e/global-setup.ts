/**
 * Global setup for E2E tests
 * This runs once before all tests to initialize the system with a test admin user.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8067';
const INIT_SECRET = process.env.INIT_SECRET || 'init_secret';
const TEST_EMAIL = 'admin@test.com';
const TEST_PASSWORD = 'AdminTest123!';
const TEST_NAME = 'Test Admin';

export default async () => {
  console.log('\n🔧 E2E Global Setup: Initializing test environment...\n');

  try {
    // Check if system is already initialized
    const statusResponse = await fetch(`${BACKEND_URL}/api/v1/setup/status`);
    const status = await statusResponse.json() as { initialized: boolean };

    if (status.initialized) {
      console.log('✅ System already initialized, skipping setup.');
      return;
    }

    console.log('📝 System not initialized, creating admin user...');

    // Initialize the system
    const initResponse = await fetch(`${BACKEND_URL}/api/v1/setup/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-init-secret': INIT_SECRET,
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
        organizationName: 'Test Organization',
      }),
    });

    if (!initResponse.ok) {
      const error = await initResponse.text();
      throw new Error(`Failed to initialize system: ${error}`);
    }

    const result = await initResponse.json() as { success: boolean; user?: { id: string; email: string; name: string } };
    console.log(`✅ Admin user created successfully!`);
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   User ID: ${result.user?.id || 'N/A'}`);

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    // Don't throw - let tests run and fail naturally if setup fails
    // This makes debugging easier
  }
};
