const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the project directory exists
const projectDir = path.resolve(__dirname);
if (!fs.existsSync(projectDir)) {
  fs.mkdirSync(projectDir, { recursive: true });
}

// Install dependencies
console.log('Installing dependencies...');
try {
  // Core dependencies
  execSync('npm install --save react@18.2.0 react-dom@18.2.0 react-router-dom@6.11.1 axios@1.4.0 electron-store@8.1.0', 
    { stdio: 'inherit', cwd: projectDir });
  
  // Dev dependencies
  execSync('npm install --save-dev typescript@5.0.4 electron@24.3.0 @types/react@18.2.6 @types/react-dom@18.2.4 ' +
    'webpack@5.82.1 webpack-cli@5.1.1 html-webpack-plugin@5.5.1 ts-loader@9.4.2 ' +
    'css-loader@6.7.3 style-loader@3.3.2 concurrently@8.0.1 ' +
    '@typescript-eslint/eslint-plugin@5.59.5 @typescript-eslint/parser@5.59.5 eslint@8.40.0', 
    { stdio: 'inherit', cwd: projectDir });

  console.log('Dependencies installed successfully.');
} catch (error) {
  console.error('Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create necessary directories
const directories = [
  'electron',
  'src',
  'src/components',
  'src/components/Library',
  'src/components/EmbedCreator',
  'src/services',
  'src/utils',
  'src/styles',
  'src/types',
  'assets',
  'assets/images',
  'assets/images/icons',
  'assets/images/ui',
];

console.log('Creating project structure...');
directories.forEach(dir => {
  const dirPath = path.join(projectDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

console.log('\nSetup complete!');
console.log('\nTo start the development server, run:');
console.log('npm run dev');