// src/elge/utils/BrowserDetection.ts
function detectOptimalBrowser(): BrowserRecommendation {
  const caps = detectCapabilities();
  
  if (caps.gpu.isBlacklisted && !caps.firefox) {
    return {
      recommended: 'Firefox',
      reason: 'Firefox has better compatibility with your GPU',
      downloadUrl: 'https://www.mozilla.org/firefox/'
    };
  }
  
  return { recommended: 'current', reason: 'Your browser is optimal' };
}
