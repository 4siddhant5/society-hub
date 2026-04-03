const fs = require('fs');
const path = require('path');

const DIRS = ['frontend/src/screens', 'frontend/src/components', 'frontend/src/layouts'];
const RN_COMPONENTS = ['View', 'Text', 'TouchableOpacity', 'Image', 'FlatList', 'ScrollView', 'TextInput', 'SafeAreaView'];

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const allFiles = [];
DIRS.forEach(dir => walkSync(dir, allFiles));

let changedFiles = [];
let outputLines = [];

allFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // --- Task 2: Fix Firebase import paths ---
    // Rule: if in src/screens/ -> ../config/firebase
    // if deeper -> e.g. ../../config/firebase
    // Calculate relative path from file's directory to frontend/src/config/firebase
    const fbTargetDir = path.resolve('frontend/src/config');
    const fileDir = path.dirname(path.resolve(file));
    let relPath = path.relative(fileDir, fbTargetDir).replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    let newFbPath = relPath + '/firebase';

    // Replace "../../config/firebase", "../../../config/firebase", etc.
    const fbImportRegex = /from\s+['"]((?:\.\.\/)+config\/firebase)['"]/g;
    
    content = content.replace(fbImportRegex, (match, p1) => {
        return `from "${newFbPath}"`;
    });

    // --- Task 1: Fix React Native imports ---
    let usedComponents = [];
    RN_COMPONENTS.forEach(comp => {
      // Look for `<Component` or `</Component` or `<Component>` or `Component.`
      const tagRegex = new RegExp(`<${comp}[\\s>\\/]`, 'g');
      if (tagRegex.test(content)) {
        usedComponents.push(comp);
      }
    });

    // Also specifically check AdminDashboard.js rule
    const isAdminDashboard = file.replace(/\\/g, '/').endsWith('src/screens/AdminDashboard.js');
    if (isAdminDashboard) {
      if (!usedComponents.includes('View')) usedComponents.push('View');
      if (!usedComponents.includes('Text')) usedComponents.push('Text');
    }

    if (usedComponents.length > 0) {
      // Find existing React Native imports
      const rnImportMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]react-native['"];?/);
      let existingImports = [];
      let rnImportFullString = '';
      
      if (rnImportMatch) {
        rnImportFullString = rnImportMatch[0];
        existingImports = rnImportMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      }

      // Special case: `import { StyleSheet, Alert, AppState, Platform } from 'react-native';`
      // We want to merge existing ones with the ones we need
      const mergedImports = [...new Set([...existingImports, ...usedComponents])];

      // Format imports nicely
      const newImportString = `import {\n  ${mergedImports.join(',\n  ')}\n} from "react-native";`;

      if (rnImportMatch) {
        // Replace existing
        content = content.replace(rnImportFullString, newImportString);
      } else {
        // Add after the very first import React ... if exists, or at top
        const reactImportMatch = content.match(/import\s+React.*?from\s+['"]react['"];?/);
        if (reactImportMatch) {
          content = content.replace(reactImportMatch[0], reactImportMatch[0] + '\n' + newImportString);
        } else {
          content = newImportString + '\n' + content;
        }
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      changedFiles.push(file);
      
      // Extract the updated import lines to display to user
      let lines = content.split('\n');
      let updatedFbLines = lines.filter(l => l.includes('/config/firebase'));
      let updatedRnMatch = content.match(/import\s+{[\s\S]*?}\s+from\s+["']react-native["'];?/);
      
      outputLines.push(`✔ ${file}`);
      if (updatedRnMatch) outputLines.push(updatedRnMatch[0]);
      updatedFbLines.forEach(l => outputLines.push(l.trim()));
      outputLines.push('');
    }
  } catch (err) {
    console.error(`Error processing ${file}: ${err.message}`);
  }
});

fs.writeFileSync('fix_output.txt', outputLines.join('\n'));
console.log('DONE. Changed ' + changedFiles.length + ' files.');
