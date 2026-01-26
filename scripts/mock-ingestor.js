/**
 * Mock Ingestor Script
 * Generates and sends 100 customer feedback messages to the Cloudflare Worker API
 * 
 * Usage: node scripts/mock-ingestor.js
 */

const API_URL = process.env.WORKER_URL || "http://localhost:8787/api/analyze";

const FEEDBACK_TEMPLATES = [
  // Performance Issues
  "The {product} dashboard is incredibly slow today. I can't even load my logs.",
  "Page load times have increased significantly over the past week. Users are complaining.",
  "The API response time for {product} is over 5 seconds. This is unacceptable.",
  "Experiencing severe latency issues with {product}. Requests are timing out.",
  "The {product} service is completely unresponsive. Is there an outage?",
  
  // Feature Requests
  "Is it possible to add {feature} support to Workers? We really need this for our enterprise stack.",
  "Does Cloudflare plan to support {feature} in the near future? Our team is currently looking at AWS because of this.",
  "Would love to see {feature} integration. This would solve a major pain point for us.",
  "Feature request: Please add {feature} support. It's the only thing preventing us from fully migrating.",
  "Can you implement {feature}? We've been waiting for this for months.",
  
  // Bug Reports
  "Received a 500 error when trying to deploy my {product} script. Is there an outage?",
  "Urgent: My {product} rules are blocking valid traffic from my primary API.",
  "The {product} console crashes when I try to view analytics. This happens every time.",
  "Found a bug: The save button doesn't work in the {product} dashboard on Safari.",
  "Critical bug: Deployments are failing silently. No error messages shown.",
  "The {product} API is returning incorrect data. The timestamps are all wrong.",
  "Bug report: Can't delete resources in {product}. Getting permission denied errors.",
  
  // UI/UX Issues
  "I love the new {product} UI, but the 'Save' button is hidden on mobile screens.",
  "The {product} interface is confusing. Can't find where to configure settings.",
  "The dark mode in {product} has poor contrast. Hard to read text.",
  "Mobile experience for {product} is terrible. Everything is too small.",
  "The navigation menu in {product} is cluttered. Needs better organization.",
  
  // Integration Issues
  "Having trouble integrating {product} with our CI/CD pipeline. Documentation is unclear.",
  "The {product} webhook isn't firing. Our monitoring system isn't receiving events.",
  "Can't connect {product} to our database. Getting connection timeout errors.",
  "Integration with {feature} is broken. Getting 401 unauthorized errors.",
  
  // Security Concerns
  "Security concern: The {product} API keys are visible in the browser console.",
  "Is {product} data encrypted at rest? We need this for compliance.",
  "The authentication flow for {product} seems insecure. No 2FA support?",
  "Received suspicious emails claiming to be from Cloudflare {product}. Is this a phishing attempt?",
  
  // Positive Feedback
  "The new {product} features are amazing! Great work team.",
  "Love the improvements to {product}. The performance is much better now.",
  "The {product} documentation is excellent. Made integration super easy.",
  "Thank you for adding {feature} to {product}. This is exactly what we needed.",
  "The {product} support team was incredibly helpful. Resolved our issue quickly.",
  
  // General Questions
  "How do I migrate from {product} to the new version? Need step-by-step guide.",
  "What's the difference between {product} and {feature}? Which should I use?",
  "Is there a way to bulk export data from {product}? We need to migrate.",
  "Can I use {product} with {feature}? Looking for compatibility information.",
  
  // Billing/Account Issues
  "My {product} usage shows incorrect numbers. Billing seems wrong.",
  "Can't upgrade my {product} plan. Payment keeps failing.",
  "The pricing for {product} is unclear. Need more transparency.",
  "How do I cancel my {product} subscription? Can't find the option.",
  
  // Reliability Issues
  "The {product} service went down yesterday. What happened?",
  "Experiencing intermittent failures with {product}. Very unreliable.",
  "The {product} status page doesn't reflect actual outages. Very frustrating.",
  "Need better uptime guarantees for {product}. Current SLA isn't sufficient.",
  
  // Documentation/Support
  "The {product} documentation is outdated. Examples don't work.",
  "Can't find documentation for {feature} in {product}. Where is it?",
  "The {product} API reference is missing important details.",
  "Need better examples in the {product} docs. Current ones are too basic.",
  
  // Configuration Issues
  "Can't configure {product} settings. The UI keeps resetting my changes.",
  "The {product} configuration is too complex. Needs simplification.",
  "Missing configuration options in {product}. Need more granular control.",
  "The {product} settings don't save properly. Losing changes on refresh.",
  
  // Data/Storage Issues
  "The {product} storage is filling up too quickly. Need more space.",
  "Can't retrieve old data from {product}. Archive feature not working.",
  "The {product} backup system is unreliable. Lost important data.",
  "Need better data retention policies for {product}. Current limits are too restrictive.",
  
  // Performance Optimization
  "How can I optimize {product} performance? Current setup is slow.",
  "The {product} caching isn't working as expected. Need help tuning.",
  "Looking for best practices to improve {product} response times.",
  "The {product} CDN isn't caching properly. Getting cache misses.",
  
  // Monitoring/Observability
  "The {product} metrics dashboard is missing key data points.",
  "Can't set up alerts for {product}. The notification system is broken.",
  "The {product} logs are incomplete. Missing critical error messages.",
  "Need better monitoring tools for {product}. Current ones are insufficient.",
  
  // Scaling Issues
  "The {product} service doesn't scale well. Performance degrades under load.",
  "Hitting rate limits on {product} too quickly. Need higher limits.",
  "The {product} auto-scaling isn't working. Manual intervention required.",
  "Can't scale {product} resources. Getting quota exceeded errors.",
  
  // Migration/Onboarding
  "Migrating to {product} is too complicated. Need better migration tools.",
  "The onboarding process for {product} is confusing. Too many steps.",
  "Can't import existing data into {product}. Migration tool is broken.",
  "Need help migrating from competitor to {product}. No clear guide available.",
  
  // API Issues
  "The {product} API rate limits are too restrictive. Need higher limits.",
  "The {product} API documentation doesn't match actual behavior.",
  "Getting inconsistent responses from {product} API. Same request, different results.",
  "The {product} API authentication is too complex. Need simpler method.",
  
  // Feature Gaps
  "The {product} service is missing critical features compared to competitors.",
  "Need {feature} in {product}. It's a standard feature elsewhere.",
  "The {product} feature set is too limited. Need more functionality.",
  "Can't accomplish our use case with {product}. Missing key features.",
  
  // Cost Concerns
  "The {product} pricing is too high. Can't justify the cost.",
  "Unexpected charges on {product} bill. Need explanation.",
  "The {product} free tier is too limited. Need more generous limits.",
  "Cost of {product} increased without notice. Very frustrating.",
];

const PRODUCTS = ["Workers", "R2", "WAF", "Pages", "D1", "KV", "Durable Objects", "Stream", "Images", "Analytics"];
const FEATURES = ["PostgreSQL", "Python", "Websockets", "Custom Headers", "GraphQL", "gRPC", "Server-Sent Events", "WebAssembly"];
const AUTHORS = [
  "john.doe@example.com",
  "sarah.smith@example.com",
  "mike.jones@example.com",
  "emily.brown@example.com",
  "david.wilson@example.com",
  "lisa.anderson@example.com",
  "chris.taylor@example.com",
  "jessica.martinez@example.com",
  "robert.thomas@example.com",
  "amanda.jackson@example.com",
];

function generateRandomTimestamp() {
  const now = Date.now();
  const daysAgo = Math.floor(Math.random() * 30); // Random days ago (0-30)
  const hoursAgo = Math.floor(Math.random() * 24);
  const timestamp = now - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000);
  
  if (daysAgo === 0) {
    if (hoursAgo === 0) return "Just now";
    if (hoursAgo === 1) return "1 hour ago";
    return `${hoursAgo} hours ago`;
  }
  if (daysAgo === 1) return "1 day ago";
  return `${daysAgo} days ago`;
}

function generateFeedback() {
  const template = FEEDBACK_TEMPLATES[Math.floor(Math.random() * FEEDBACK_TEMPLATES.length)];
  const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
  const feature = FEATURES[Math.floor(Math.random() * FEATURES.length)];
  
  let text = template.replace(/{product}/g, product).replace(/{feature}/g, feature);
  
  // Sometimes add more context
  if (Math.random() > 0.7) {
    text += " This is affecting our production environment and needs urgent attention.";
  }
  
  const title = text.length > 80 ? text.substring(0, 77) + "..." : text;
  const description = text.length > 80 ? text : "";
  
  return {
    title: title.length > 100 ? title.substring(0, 97) + "..." : title,
    text: description || title,
    author: AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
    timestamp: generateRandomTimestamp(),
  };
}

async function sendFeedback(feedback, index) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text: feedback.text, 
        title: feedback.title 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log(`[${index + 1}/100] ✅ Analyzed: "${feedback.title.substring(0, 60)}..."`);
    console.log(`   └─ Sentiment: ${data.sentiment || 'N/A'}, Theme: ${data.theme || 'N/A'}, Priority: ${data.priority || 'N/A'}`);
    
    return { success: true, feedback, analysis: data };
  } catch (err) {
    console.error(`[${index + 1}/100] ❌ Failed: "${feedback.title.substring(0, 60)}..."`);
    console.error(`   └─ Error: ${err.message}`);
    return { success: false, feedback, error: err.message };
  }
}

async function runMockIngestor() {
  console.log("🚀 Starting Mock Ingestor: Generating 100 feedback messages...\n");
  console.log(`📡 API URL: ${API_URL}\n`);

  const feedbacks = [];
  for (let i = 0; i < 100; i++) {
    feedbacks.push(generateFeedback());
  }

  console.log("📝 Generated 100 feedback messages. Starting analysis...\n");

  const results = [];
  const batchSize = 5; // Process 5 at a time to avoid overwhelming the API

  for (let i = 0; i < feedbacks.length; i += batchSize) {
    const batch = feedbacks.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((feedback, idx) => sendFeedback(feedback, i + idx))
    );
    results.push(...batchResults);
    
    // Small delay between batches to be nice to the API
    if (i + batchSize < feedbacks.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Done! Successfully analyzed ${successful} feedback messages`);
  if (failed > 0) {
    console.log(`❌ Failed to analyze ${failed} feedback messages`);
  }
  console.log("=".repeat(60));
  console.log("\n💡 Note: These are mock feedbacks sent to your Worker API.");
  console.log("   The analysis results are stored in the Worker's response.");
  console.log("   You can view them in your React dashboard by calling the API.\n");
}

// Run the ingestor
runMockIngestor().catch(console.error);

