const { execSync } = require('child_process');

console.log('Installing Babel dependencies...');

try {
  execSync(
    'npm install --save-dev @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript babel-loader @babel/plugin-transform-runtime',
    { stdio: 'inherit' }
  );
  
  execSync(
    'npm install --save @babel/runtime',
    { stdio: 'inherit' }
  );
  
  console.log('Successfully installed Babel dependencies.');
} catch (error) {
  console.error('Failed to install Babel dependencies:', error.message);
  process.exit(1);
}