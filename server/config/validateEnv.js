/**
 * Environment Variable Validation (Section 2.2)
 * 
 * Validates that all required environment variables are set before server starts.
 * Prevents runtime errors and security issues from missing configuration.
 */

/**
 * Validates required environment variables
 * @throws {Error} If any required variables are missing
 */
function validateRequiredEnvVars() {
  const required = [
    'JWT_SECRET',
    'DB_NAME',
    'DB_USER',
    'PAYMONGO_TEST_SECRET_KEY',
    'PAYMONGO_WEBHOOK_SECRET',
    'FRONTEND_URL'
  ];

  const missing = [];

  // Check each required variable
  required.forEach(varName => {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missing.push(varName);
    }
  });

  // If any are missing, log and exit
  if (missing.length > 0) {
    console.error('❌ CRITICAL ERROR: Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please set these variables in your .env file before starting the server.');
    console.error('Example .env file:');
    console.error('JWT_SECRET=your-secret-key-here');
    console.error('DB_NAME=balai_almeda_db');
    console.error('DB_USER=root');
    console.error('PAYMONGO_TEST_SECRET_KEY=sk_test_...');
    console.error('FRONTEND_URL=http://localhost:5173');
    console.error('\n🛑 Server cannot start without these variables.\n');
    
    process.exit(1); // Kill the server
  }

  // Success - all variables present
  console.log('✅ Environment variables validated successfully');
}

module.exports = validateRequiredEnvVars;
