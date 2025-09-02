#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Performance budget thresholds
const PERFORMANCE_BUDGET = {
  // Lighthouse scores (0-1)
  performance: 0.7,
  accessibility: 0.9,
  bestPractices: 0.9,
  seo: 0.9,
  
  // Core Web Vitals (milliseconds)
  firstContentfulPaint: 2000,
  largestContentfulPaint: 2500,
  totalBlockingTime: 200,
  speedIndex: 3000,
  interactive: 3000,
  
  // Layout shift (score)
  cumulativeLayoutShift: 0.1,
  
  // Resource budgets (bytes)
  totalSize: 2000000, // 2MB
  scriptSize: 400000,  // 400KB
  stylesheetSize: 100000, // 100KB
  imageSize: 1000000,  // 1MB
  
  // Resource counts
  scriptCount: 10,
  stylesheetCount: 5,
  imageCount: 20
};

function checkPerformanceBudget() {
  console.log('🔍 Checking Performance Budget...');
  
  const reportsDir = './lighthouse-reports';
  
  if (!fs.existsSync(reportsDir)) {
    console.error('❌ Lighthouse reports directory not found');
    process.exit(1);
  }
  
  const files = fs.readdirSync(reportsDir);
  const manifestFile = files.find(f => f.includes('manifest.json'));
  
  if (!manifestFile) {
    console.error('❌ Lighthouse manifest file not found');
    process.exit(1);
  }
  
  const manifest = JSON.parse(fs.readFileSync(path.join(reportsDir, manifestFile), 'utf8'));
  
  let budgetPassed = true;
  const results = [];
  
  manifest.forEach((result, index) => {
    const url = result.url;
    const summary = result.summary;
    const jsonPath = result.jsonPath;
    
    console.log(`\n📊 Analyzing: ${url}`);
    
    // Read detailed report
    let detailedReport = null;
    if (jsonPath && fs.existsSync(path.join(reportsDir, jsonPath))) {
      detailedReport = JSON.parse(fs.readFileSync(path.join(reportsDir, jsonPath), 'utf8'));
    }
    
    const pageResult = {
      url,
      passed: true,
      issues: []
    };
    
    // Check Lighthouse scores
    const scores = {
      performance: summary.performance,
      accessibility: summary.accessibility,
      bestPractices: summary['best-practices'],
      seo: summary.seo
    };
    
    Object.entries(scores).forEach(([category, score]) => {
      const threshold = PERFORMANCE_BUDGET[category];
      const percentage = Math.round(score * 100);
      
      if (score < threshold) {
        const issue = `${category}: ${percentage}% < ${Math.round(threshold * 100)}%`;
        console.log(`❌ ${issue}`);
        pageResult.issues.push(issue);
        pageResult.passed = false;
        budgetPassed = false;
      } else {
        console.log(`✅ ${category}: ${percentage}%`);
      }
    });
    
    // Check Core Web Vitals if detailed report is available
    if (detailedReport && detailedReport.audits) {
      const audits = detailedReport.audits;
      
      const webVitals = {
        'first-contentful-paint': { value: audits['first-contentful-paint']?.numericValue, threshold: PERFORMANCE_BUDGET.firstContentfulPaint, unit: 'ms' },
        'largest-contentful-paint': { value: audits['largest-contentful-paint']?.numericValue, threshold: PERFORMANCE_BUDGET.largestContentfulPaint, unit: 'ms' },
        'total-blocking-time': { value: audits['total-blocking-time']?.numericValue, threshold: PERFORMANCE_BUDGET.totalBlockingTime, unit: 'ms' },
        'cumulative-layout-shift': { value: audits['cumulative-layout-shift']?.numericValue, threshold: PERFORMANCE_BUDGET.cumulativeLayoutShift, unit: '' },
        'speed-index': { value: audits['speed-index']?.numericValue, threshold: PERFORMANCE_BUDGET.speedIndex, unit: 'ms' },
        'interactive': { value: audits['interactive']?.numericValue, threshold: PERFORMANCE_BUDGET.interactive, unit: 'ms' }
      };
      
      Object.entries(webVitals).forEach(([metric, { value, threshold, unit }]) => {
        if (value !== undefined) {
          const displayValue = unit === 'ms' ? Math.round(value) : value.toFixed(3);
          const displayThreshold = unit === 'ms' ? threshold : threshold.toFixed(1);
          
          if (value > threshold) {
            const issue = `${metric}: ${displayValue}${unit} > ${displayThreshold}${unit}`;
            console.log(`❌ ${issue}`);
            pageResult.issues.push(issue);
            pageResult.passed = false;
            budgetPassed = false;
          } else {
            console.log(`✅ ${metric}: ${displayValue}${unit}`);
          }
        }
      });
      
      // Check resource budgets
      const resourceSummary = audits['resource-summary'];
      if (resourceSummary && resourceSummary.details && resourceSummary.details.items) {
        const resources = resourceSummary.details.items;
        
        resources.forEach(resource => {
          const { resourceType, size, count } = resource;
          
          // Check size budgets
          const sizeBudgets = {
            'script': PERFORMANCE_BUDGET.scriptSize,
            'stylesheet': PERFORMANCE_BUDGET.stylesheetSize,
            'image': PERFORMANCE_BUDGET.imageSize,
            'total': PERFORMANCE_BUDGET.totalSize
          };
          
          if (sizeBudgets[resourceType] && size > sizeBudgets[resourceType]) {
            const issue = `${resourceType} size: ${Math.round(size/1000)}KB > ${Math.round(sizeBudgets[resourceType]/1000)}KB`;
            console.log(`❌ ${issue}`);
            pageResult.issues.push(issue);
            pageResult.passed = false;
            budgetPassed = false;
          }
          
          // Check count budgets
          const countBudgets = {
            'script': PERFORMANCE_BUDGET.scriptCount,
            'stylesheet': PERFORMANCE_BUDGET.stylesheetCount,
            'image': PERFORMANCE_BUDGET.imageCount
          };
          
          if (countBudgets[resourceType] && count > countBudgets[resourceType]) {
            const issue = `${resourceType} count: ${count} > ${countBudgets[resourceType]}`;
            console.log(`❌ ${issue}`);
            pageResult.issues.push(issue);
            pageResult.passed = false;
            budgetPassed = false;
          }
        });
      }
    }
    
    results.push(pageResult);
  });
  
  // Summary
  console.log('\n📈 Performance Budget Summary:');
  console.log('=' .repeat(50));
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status}: ${result.url}`);
    
    if (!result.passed) {
      result.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
  });
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log(`\n📊 Results: ${passedCount}/${totalCount} pages passed`);
  
  if (budgetPassed) {
    console.log('\n🎉 All performance budgets passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Performance budget check failed!');
    console.log('\n💡 Tips to improve performance:');
    console.log('  - Optimize images (use WebP, proper sizing)');
    console.log('  - Minimize JavaScript bundles');
    console.log('  - Enable compression (gzip/brotli)');
    console.log('  - Use CDN for static assets');
    console.log('  - Implement code splitting');
    console.log('  - Optimize CSS delivery');
    process.exit(1);
  }
}

if (require.main === module) {
  checkPerformanceBudget();
}

module.exports = { checkPerformanceBudget, PERFORMANCE_BUDGET };