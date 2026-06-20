import { Jimp } from 'jimp';
import * as fs from 'fs';

async function processImages() {
  try {
    console.log('Starting image processing and deployment to /public...');

    // 1. Process standard 192x192 Icon
    console.log('Reading app_icon_one...');
    const iconBase = await Jimp.read('./src/assets/images/app_icon_one_1781331256514.jpg');
    
    console.log('Resizing 192x192 PNG icon...');
    const icon192 = iconBase.clone();
    icon192.resize({ w: 192, h: 192 });
    await icon192.write('./public/icon-192.png');
    console.log('Successfully wrote public/icon-192.png');

    // 2. Process standard 512x512 Icon
    console.log('Resizing 512x512 PNG icon...');
    const icon512 = iconBase.clone();
    icon512.resize({ w: 512, h: 512 });
    await icon512.write('./public/icon-512.png');
    console.log('Successfully wrote public/icon-512.png');

    // 3. Process Desktop Screenshot (1280x720)
    console.log('Reading desktop_shot...');
    const desktopBase = await Jimp.read('./src/assets/images/desktop_shot_1781331289618.jpg');
    console.log('Resizing 1280x720 JPEG...');
    desktopBase.resize({ w: 1280, h: 720 });
    await desktopBase.write('./public/screenshot-desktop.jpg');
    console.log('Successfully wrote public/screenshot-desktop.jpg');

    // 4. Process Mobile Screenshot (720x1285)
    console.log('Reading mobile_shot...');
    const mobileBase = await Jimp.read('./src/assets/images/mobile_shot_1781331306431.jpg');
    console.log('Resizing 720x1285 JPEG...');
    mobileBase.resize({ w: 720, h: 1285 });
    await mobileBase.write('./public/screenshot-mobile.jpg');
    console.log('Successfully wrote public/screenshot-mobile.jpg');

    console.log('Checking generated files exists with non-zero size...');
    const stats192 = fs.statSync('./public/icon-192.png');
    const stats512 = fs.statSync('./public/icon-512.png');
    const statsDesktop = fs.statSync('./public/screenshot-desktop.jpg');
    const statsMobile = fs.statSync('./public/screenshot-mobile.jpg');

    console.log(`icon-192.png: ${stats192.size} bytes`);
    console.log(`icon-512.png: ${stats512.size} bytes`);
    console.log(`screenshot-desktop.jpg: ${statsDesktop.size} bytes`);
    console.log(`screenshot-mobile.jpg: ${statsMobile.size} bytes`);
    
    console.log('All images correctly generated and written!');
  } catch (error) {
    console.error('Error during image processing:', error);
  }
}

processImages();
