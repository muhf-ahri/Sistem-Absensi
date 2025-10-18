const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const createAdminAccount = async (adminData = {}) => {
  // Default admin data
  const defaultAdmin = {
    name: 'System Administrator',
    email: 'admin@company.com',
    password: 'admin123',
    position: 'System Administrator',
    role: 'admin'
  };

  // Merge default with custom data
  const admin = { ...defaultAdmin, ...adminData };
  
  const usersFile = path.join(__dirname, 'data/users.json');
  
  // Ensure data directory exists
  const dataDir = path.dirname(usersFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Read or initialize users
  let users = [];
  if (fs.existsSync(usersFile)) {
    try {
      users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    } catch (error) {
      console.log('⚠️  Creating new users file...');
      users = [];
    }
  }

  // Check if email exists
  const existingUser = users.find(user => user.email === admin.email);
  if (existingUser) {
    console.log('❌ Email already registered:', admin.email);
    console.log('💡 If you want to update, delete the user first');
    return false;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(admin.password, 10);

  // Create admin user
  const newAdmin = {
    id: uuidv4(),
    name: admin.name,
    email: admin.email,
    password: hashedPassword,
    position: admin.position,
    role: admin.role,
    createdAt: new Date().toISOString()
  };

  users.push(newAdmin);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  
  console.log('🎉 ADMIN ACCOUNT CREATED SUCCESSFULLY!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Name:', admin.name);
  console.log('📧 Email:', admin.email);
  console.log('🔑 Password:', admin.password);
  console.log('💼 Position:', admin.position);
  console.log('🎯 Role:', admin.role);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  Please change password after first login!');
  console.log('🌐 Login URL: http://localhost:5173/login');
  
  return true;
};

// Handle command line arguments
const getCommandLineArgs = () => {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--email' && process.argv[i + 1]) {
      args.email = process.argv[++i];
    } else if (arg === '--password' && process.argv[i + 1]) {
      args.password = process.argv[++i];
    } else if (arg === '--name' && process.argv[i + 1]) {
      args.name = process.argv[++i];
    } else if (arg === '--position' && process.argv[i + 1]) {
      args.position = process.argv[++i];
    }
  }
  return args;
};

// Main execution
const main = async () => {
  console.log('🚀 Creating Admin Account...\n');
  
  const customData = getCommandLineArgs();
  
  try {
    await createAdminAccount(customData);
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = createAdminAccount;