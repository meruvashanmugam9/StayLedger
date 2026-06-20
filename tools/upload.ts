import * as fs from 'fs';
import * as path from 'path';

async function uploadToTmpfiles(filePath: string): Promise<string> {
  const url = 'https://tmpfiles.org/api/v1/upload';
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  
  const fileBlob = new Blob([fileBuffer], { type: fileName.endsWith('.jpg') ? 'image/jpeg' : 'image/png' });
  
  const formData = new FormData();
  formData.append('file', fileBlob, fileName);
  
  console.log(`Uploading ${fileName} (${fileBuffer.length} bytes) to tmpfiles.org...`);
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`tmpfiles.org failed with status ${response.status}: ${await response.text()}`);
  }
  
  const data: any = await response.json();
  if (data.status === 'success' && data.data && data.data.url) {
    // TmpFiles returns url as e.g. https://tmpfiles.org/123456/name.png
    // To make it directly downloadable, we replace the domain with the dl path: https://tmpfiles.org/dl/123456/name.png
    const directUrl = data.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
    console.log(`Successfully uploaded to tmpfiles.org: ${directUrl}`);
    return directUrl;
  }
  throw new Error(`Invalid response layout from tmpfiles.org: ${JSON.stringify(data)}`);
}

async function run() {
  try {
    const assets = [
      './public/icon-192.png',
      './public/icon-512.png',
      './public/screenshot-desktop.jpg',
      './public/screenshot-mobile.jpg'
    ];
    
    console.log('Uploading all assets using TmpFiles...');
    const urls: Record<string, string> = {};
    for (const asset of assets) {
      if (fs.existsSync(asset)) {
        urls[path.basename(asset)] = await uploadToTmpfiles(asset);
      } else {
        console.warn(`Asset not found: ${asset}`);
      }
    }
    
    console.log('\n--- UPLOADED ASSETS REPORT ---');
    console.log(JSON.stringify(urls, null, 2));
    
  } catch (error) {
    console.error('Error during upload script execution:', error);
  }
}

run();
