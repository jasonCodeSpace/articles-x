#!/usr/bin/env node

/**
 * Script to validate sitemap.xml structure and content
 */

const https = require('https');

const SITEMAP_URL = 'https://www.xarticle.news/sitemap.xml';

async function fetchSitemap() {
  return new Promise((resolve, reject) => {
    https.get(SITEMAP_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function validateSitemap() {
  try {
    console.log('Fetching sitemap from:', SITEMAP_URL);
    const xmlData = await fetchSitemap();
    
    // Basic XML validation using regex patterns
    console.log('✅ XML fetched successfully');
    
    // Check basic XML structure
    if (!xmlData.includes('<?xml version="1.0"')) {
      throw new Error('Missing XML declaration');
    }
    
    if (!xmlData.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
      throw new Error('Missing or invalid urlset element');
    }
    
    if (!xmlData.includes('</urlset>')) {
      throw new Error('Missing closing urlset tag');
    }
    
    console.log('✅ Basic XML structure is valid');
    
    // Count URLs
    const urlMatches = xmlData.match(/<url>/g);
    const urlCount = urlMatches ? urlMatches.length : 0;
    console.log(`✅ Found ${urlCount} URLs`);
    
    // Check for common XML errors
    const locOpenTags = (xmlData.match(/<loc>/g) || []).length;
    const locCloseTags = (xmlData.match(/<\/loc>/g) || []).length;
    
    if (locOpenTags !== locCloseTags) {
      throw new Error(`Mismatched <loc> tags: ${locOpenTags} opening, ${locCloseTags} closing`);
    }
    
    console.log(`✅ All ${locOpenTags} <loc> tags are properly paired`);
    
    // Check for unescaped XML characters
    const unescapedAmp = xmlData.match(/&(?![a-zA-Z]+;)/g);
    if (unescapedAmp) {
      console.log(`⚠️  Found ${unescapedAmp.length} potentially unescaped & characters`);
    }
    
    // Validate URLs
    const locPattern = /<loc>(.*?)<\/loc>/g;
    let match;
    let validUrls = 0;
    let invalidUrls = 0;
    const errors = [];
    
    while ((match = locPattern.exec(xmlData)) !== null) {
      const url = match[1];
      
      if (!url.startsWith('https://www.xarticle.news')) {
        errors.push(`Invalid base URL: ${url}`);
        invalidUrls++;
      } else if (url.includes('<') || url.includes('>') || url.includes('"')) {
        errors.push(`URL contains unescaped XML characters: ${url}`);
        invalidUrls++;
      } else {
        validUrls++;
      }
    }
    
    console.log(`✅ Valid URLs: ${validUrls}`);
    
    if (invalidUrls > 0) {
      console.log(`❌ Invalid URLs: ${invalidUrls}`);
      console.log('First 5 errors:');
      errors.slice(0, 5).forEach(error => console.log(`  - ${error}`));
    }
    
    // Check file size
    const sizeKB = Math.round(Buffer.byteLength(xmlData, 'utf8') / 1024);
    console.log(`📊 Sitemap size: ${sizeKB}KB`);
    
    if (sizeKB > 50 * 1024) {
      console.log('⚠️  Warning: Sitemap exceeds 50MB limit');
    }
    
    if (urlCount > 50000) {
      console.log('⚠️  Warning: Sitemap exceeds 50,000 URL limit');
    }
    
    console.log('✅ Sitemap validation completed successfully');
    
  } catch (error) {
    console.error('❌ Error validating sitemap:', error.message);
    process.exit(1);
  }
}

// Run validation
validateSitemap();
