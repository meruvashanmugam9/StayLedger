/**
 * EasyStay - Offline PWA Android APK & AAB Compilation Tool
 * -------------------------------------------------------------
 * This script is an automated local compilation utility. 
 * Since the online PWABuilder service is frequently overloaded (leading to 
 * "Timed out waiting for Google Play packaging job to complete" errors) and 
 * sandbox/private URLs cannot be reached by their crawler, this tool allows you
 * to compile your PWA into a fully-functional Android App packages (.apk and .aab)
 * completely locally using Google's official command-line tool standard: Bubblewrap.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'manifest.json');

console.log('\x1b[36m%s\x1b[0m', '==================================================================');
console.log('\x1b[36m%s\x1b[0m', '   EASYSTAY PWA COMPILATION PROGRAM - BYPASS PWABUILDER TIMEOUTS   ');
console.log('\x1b[36m%s\x1b[0m', '==================================================================');

function checkPrerequisites() {
  console.log('\n\x1b[33m%s\x1b[0m', '🔍 [Step 1] Verifying manifest and local assets...');
  
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: public/manifest.json not found!');
    process.exit(1);
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    console.log(`✅ manifest.json loaded successfully ("${manifest.name}")`);
    
    // Check key requirements for Google Play
    const icons = manifest.icons || [];
    const has192 = icons.some(i => i.sizes === '192x192');
    const has512 = icons.some(i => i.sizes === '512x512');
    const hasMaskable = icons.some(i => i.purpose && i.purpose.includes('maskable'));
    
    if (has192 && has512) {
      console.log('✅ Required icons (192x192 and 512x512) are present.');
    } else {
      console.warn('⚠️ Warning: Some Google Play store-compliant icons are missing.');
    }
    
    if (hasMaskable) {
      console.log('✅ Maskable icon configuration found.');
    } else {
      console.warn('⚠️ Warning: Maskable icons are missing. Adaptive launcher icons may look flat.');
    }
    
    if (manifest.screenshots && manifest.screenshots.length >= 2) {
      console.log(`✅ Store Screenshots configured (${manifest.screenshots.length} found).`);
    } else {
      console.warn('⚠️ Warning: At least two screenshots (desktop and mobile) are highly recommended.');
    }
  } catch (e) {
    console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: manifest.json is invalid JSON!', e);
    process.exit(1);
  }
}

function printInstructions() {
  console.log('\n\x1b[32m%s\x1b[0m', '🚀 DIRECT COMPILATION TOOL (BUBBLEWRAP) GUIDE');
  console.log('------------------------------------------------------------------');
  console.log('PWABuilder relies on Google\'s Bubblewrap library. When the online');
  console.log('queue times out, or when compiling a private development URL,');
  console.log('you can compile your Android app directly on your local device for free.');
  console.log('This bypasses all server wait queues and gives you instant builds.');
  console.log('\n\x1b[1m%s\x1b[0m', '🛠️  Prerequisites for your local machine:');
  console.log(' 1. Install Node.js (v16+) and NPM');
  console.log(' 2. Install Java Development Kit (JDK) 17 or higher');
  console.log(' 3. Android CLI Tools / SDK (Standard installation)');
  
  console.log('\n\x1b[1m%s\x1b[0m', '📟  How to build your APK right now in 4 simple commands:');
  console.log('\x1b[35m%s\x1b[0m', '  # Step 1: Install Google\'s official PWA compilation cli globally');
  console.log('  npm install -g @bubblewrap/cli');
  
  console.log('\n\x1b[35m%s\x1b[0m', '  # Step 2: Initialize your Android project from your Web Manifest');
  console.log('  # Replace the URL with your live published domain or keep localhost for local testing');
  console.log('  bubblewrap init --manifest=./public/manifest.json');
  
  console.log('\n\x1b[35m%s\x1b[0m', '  # Step 3: Compile your project to generate signable APK and AAB packages');
  console.log('  bubblewrap build');
  
  console.log('\n\x1b[1m%s\x1b[0m', '💎 What gets generated?');
  console.log(' • app-release-signed.apk: Directly installable on your Android device for testing.');
  console.log(' • app-release.aab: Ready to upload to Google Play Developer Console.');
  console.log(' • assetlinks.json: Place in your public/.well-known/ directory to remove address bar.');
  console.log('------------------------------------------------------------------');
}

checkPrerequisites();
printInstructions();
