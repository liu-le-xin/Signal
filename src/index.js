/**
 * Cloudflare Signal - Workers AI Feedback Analysis
 * 
 * This worker uses Cloudflare Workers AI to analyze customer feedback texts.
 * 
 * Endpoints:
 * - POST /api/analyze - Analyze a single feedback text
 * - POST /api/analyze-batch - Analyze multiple feedback texts
 * 
 * Learn more at https://developers.cloudflare.com/workers-ai/
 */

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		
		// Enable CORS for React app
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// Route handling
		if (url.pathname === '/api/analyze' && request.method === 'POST') {
			return handleAnalyze(request, env, corsHeaders);
		}

		if (url.pathname === '/api/analyze-batch' && request.method === 'POST') {
			return handleAnalyzeBatch(request, env, corsHeaders);
		}

		if (url.pathname === '/api/aggregate-themes' && request.method === 'POST') {
			return handleAggregateThemes(request, env, corsHeaders);
		}

		if (url.pathname === '/api/feedbacks' && request.method === 'GET') {
			return handleGetFeedbacks(request, env, corsHeaders);
		}

		if (url.pathname === '/api/feedbacks/download' && request.method === 'GET') {
			return handleDownloadFeedbacks(request, env, corsHeaders);
		}

		// Health check
		if (url.pathname === '/health') {
			return new Response(JSON.stringify({ status: 'ok', service: 'Cloudflare Signal AI' }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Default response
		return new Response(
			JSON.stringify({ 
				message: 'Cloudflare Signal AI Worker',
				endpoints: ['/api/analyze', '/api/analyze-batch', '/health']
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	},
};

/**
 * Analyze a single feedback text
 */
async function handleAnalyze(request, env, corsHeaders) {
	try {
		const { text, title } = await request.json();

		if (!text && !title) {
			return new Response(
				JSON.stringify({ error: 'Missing required field: text or title' }),
				{ 
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		const feedbackText = title ? `${title}. ${text || ''}` : text;
		
		// Create comprehensive analysis prompt
		const analysisPrompt = `Analyze the following customer feedback message and provide a detailed classification.

CRITICAL CLASSIFICATION RULES:

1. TYPE CLASSIFICATION: Determine if this is a "bug" or "feedback"
   - Bug: System is broken, not working, error, crash, outage, failure, blocking functionality
   - Feedback: Feature request, improvement suggestion, enhancement, new capability request

2. THEME: Identify the main theme/category (e.g., performance, UI/UX, security, reliability, feature, integration, mobile, API, dashboard, storage, networking)

3. IF BUG - Assign SEVERITY (P0, P1, P2, P3):
   - P0 (Critical): Total Outage. Core service is down (e.g., WAF dropping all traffic). No workaround exists.
   - P1 (Major): Degraded Performance. Key feature broken for specific segment (e.g., R2 uploads failing for Enterprise users).
   - P2 (Minor): Annoyance/UI Glitch. System works but difficult to use (e.g., Dashboard chart doesn't render in Safari).
   - P3 (Cosmetic): Low Impact. Typos, alignment issues, "nice to have" polish.

4. IF FEEDBACK - Assign PRIORITY based on:
   a) User Tier (if mentioned or inferable): Enterprise = 1.0, Business = 0.7, Free = 0.1
   b) Impact vs Effort:
      - High Impact / Low Effort: Priority = "high"
      - High Impact / High Effort: Priority = "medium-high" (crucial for Enterprise)
      - Low Impact: Priority = "low"

Customer Feedback:
"${feedbackText}"

Provide your analysis in JSON format with these EXACT fields:
{
  "type": "bug" or "feedback",
  "theme": "theme name",
  "severity": "P0" or "P1" or "P2" or "P3" (only if type is bug, otherwise null),
  "priority": "high" or "medium-high" or "medium" or "low" (only if type is feedback, otherwise null),
  "userTier": "Enterprise" or "Business" or "Free" or "Unknown" (if inferable),
  "sentiment": "positive" or "negative" or "neutral",
  "keyPoints": ["point1", "point2"],
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "summary": "brief summary"
}`;

		// Use Workers AI to analyze
		const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
			prompt: analysisPrompt,
			max_tokens: 500,
		});

		// Parse the AI response
		let analysis;
		try {
			// Try to extract JSON from the response
			const responseText = response.response || JSON.stringify(response);
			const jsonMatch = responseText.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				analysis = JSON.parse(jsonMatch[0]);
			} else {
				// Fallback: create structured response from text
				analysis = parseAnalysisFromText(responseText);
			}
		} catch (error) {
			// Fallback parsing
			analysis = parseAnalysisFromText(JSON.stringify(response));
		}

		// Ensure required fields with new structure
		const isBug = analysis.type === 'bug' || analysis.type?.toLowerCase() === 'bug';
		
		analysis = {
			type: analysis.type || (isBug ? 'bug' : 'feedback'),
			theme: analysis.theme || 'general',
			severity: isBug ? (analysis.severity || 'P2') : null, // P0, P1, P2, P3 for bugs
			priority: !isBug ? (analysis.priority || 'medium') : null, // For feedback
			userTier: analysis.userTier || 'Unknown',
			sentiment: analysis.sentiment || 'neutral',
			keyPoints: analysis.keyPoints || [],
			suggestedTags: analysis.suggestedTags || [],
			summary: analysis.summary || 'Analysis completed',
			rawResponse: response,
		};

		// Store in D1 database if available
		if (env.DB) {
			try {
				const feedbackData = {
					title: title || text?.substring(0, 100) || 'Untitled',
					description: text || title || '',
					author: 'system',
					timestamp: new Date().toISOString(),
					tags: analysis.suggestedTags || [],
					status: 'new',
					priority: title ? 'medium' : 'low',
					type: analysis.type,
					theme: analysis.theme,
					severity: analysis.severity,
					priority: analysis.priority, // This will be used for feedback_priority
					userTier: analysis.userTier,
					sentiment: analysis.sentiment,
					keyPoints: analysis.keyPoints,
					suggestedTags: analysis.suggestedTags,
					summary: analysis.summary,
				};
				await storeFeedbackInD1(env.DB, feedbackData);
			} catch (dbError) {
				console.error('Failed to store feedback in D1:', dbError);
				// Continue even if DB storage fails
			}
		}

		return new Response(
			JSON.stringify(analysis),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Analysis error:', error);
		return new Response(
			JSON.stringify({ 
				error: 'Failed to analyze feedback',
				message: error.message 
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	}
}

/**
 * Analyze multiple feedback texts in batch
 */
async function handleAnalyzeBatch(request, env, corsHeaders) {
	try {
		const { feedbacks } = await request.json();

		if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
			return new Response(
				JSON.stringify({ error: 'Missing or empty feedbacks array' }),
				{ 
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		// Analyze each feedback (in parallel for better performance)
		const analyses = await Promise.all(
			feedbacks.map(async (feedback) => {
				try {
					const response = await handleAnalyze(
						new Request('http://localhost/api/analyze', {
							method: 'POST',
							body: JSON.stringify(feedback),
						}),
						env,
						corsHeaders
					);
					const result = await response.json();
					return {
						id: feedback.id,
						...result,
					};
				} catch (error) {
					return {
						id: feedback.id,
						error: error.message,
					};
				}
			})
		);

		return new Response(
			JSON.stringify({ analyses }),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Batch analysis error:', error);
		return new Response(
			JSON.stringify({ 
				error: 'Failed to analyze feedback batch',
				message: error.message 
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	}
}

/**
 * Aggregate feedback by themes and calculate theme-level severity/priority
 */
async function handleAggregateThemes(request, env, corsHeaders) {
	try {
		const { analyses } = await request.json();

		if (!Array.isArray(analyses) || analyses.length === 0) {
			return new Response(
				JSON.stringify({ error: 'Missing or empty analyses array' }),
				{ 
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		// Group by theme
		const themeMap = new Map();

		analyses.forEach((analysis) => {
			if (analysis.error) return; // Skip failed analyses
			
			const theme = analysis.theme || 'Uncategorized';
			const type = analysis.type || 'feedback';
			
			if (!themeMap.has(theme)) {
				themeMap.set(theme, {
					theme,
					bugs: [],
					feedback: [],
				});
			}

			const themeData = themeMap.get(theme);
			if (type === 'bug') {
				themeData.bugs.push(analysis);
			} else {
				themeData.feedback.push(analysis);
			}
		});

		// Calculate aggregated severity/priority for each theme
		const aggregatedThemes = Array.from(themeMap.values()).map(themeData => {
			// For bugs: find highest severity (P0 > P1 > P2 > P3)
			let aggregatedSeverity = null;
			if (themeData.bugs.length > 0) {
				const severities = themeData.bugs.map(b => b.severity).filter(s => s);
				if (severities.includes('P0')) aggregatedSeverity = 'P0';
				else if (severities.includes('P1')) aggregatedSeverity = 'P1';
				else if (severities.includes('P2')) aggregatedSeverity = 'P2';
				else if (severities.includes('P3')) aggregatedSeverity = 'P3';
			}

			// For feedback: calculate weighted priority based on user tiers and impact
			let aggregatedPriority = null;
			if (themeData.feedback.length > 0) {
				let totalWeight = 0;
				let weightedSum = 0;

				themeData.feedback.forEach(f => {
					// User tier weights
					const tierWeights = {
						'Enterprise': 1.0,
						'Business': 0.7,
						'Free': 0.1,
						'Unknown': 0.5
					};
					const tierWeight = tierWeights[f.userTier] || 0.5;
					
					// Priority weights
					const priorityWeights = {
						'high': 4,
						'medium-high': 3,
						'medium': 2,
						'low': 1
					};
					const priorityWeight = priorityWeights[f.priority] || 2;
					
					const combinedWeight = tierWeight * priorityWeight;
					weightedSum += combinedWeight;
					totalWeight += tierWeight;
				});

				const avgWeight = totalWeight > 0 ? weightedSum / totalWeight : 0;
				
				if (avgWeight >= 3.5) aggregatedPriority = 'high';
				else if (avgWeight >= 2.5) aggregatedPriority = 'medium-high';
				else if (avgWeight >= 1.5) aggregatedPriority = 'medium';
				else aggregatedPriority = 'low';
			}

			// Determine traffic light color
			let trafficLight = 'green'; // Default
			if (aggregatedSeverity === 'P0' || aggregatedPriority === 'high') {
				trafficLight = 'red';
			} else if (aggregatedSeverity === 'P1' || aggregatedPriority === 'medium-high') {
				trafficLight = 'yellow';
			} else if (aggregatedSeverity === 'P2' || aggregatedPriority === 'medium') {
				trafficLight = 'yellow';
			} else {
				trafficLight = 'green';
			}

			return {
				...themeData,
				aggregatedSeverity,
				aggregatedPriority,
				trafficLight,
				totalCount: themeData.bugs.length + themeData.feedback.length,
			};
		});

		// Sort by traffic light (red first, then yellow, then green), then by total count
		aggregatedThemes.sort((a, b) => {
			const lightOrder = { 'red': 0, 'yellow': 1, 'green': 2 };
			const aOrder = lightOrder[a.trafficLight] || 2;
			const bOrder = lightOrder[b.trafficLight] || 2;
			if (aOrder !== bOrder) return aOrder - bOrder;
			return b.totalCount - a.totalCount;
		});

		return new Response(
			JSON.stringify({ themes: aggregatedThemes }),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Aggregation error:', error);
		return new Response(
			JSON.stringify({ 
				error: 'Failed to aggregate themes',
				message: error.message 
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	}
}

/**
 * Fallback parser for AI responses that aren't in JSON format
 */
function parseAnalysisFromText(text) {
	const lowerText = text.toLowerCase();
	
	// Determine type (bug vs feedback)
	const bugKeywords = ['bug', 'error', 'crash', 'broken', 'not working', 'failing', 'outage', 'down', '500', '404'];
	const isBug = bugKeywords.some(keyword => lowerText.includes(keyword));
	
	// Extract sentiment
	let sentiment = 'neutral';
	if (lowerText.includes('positive') || lowerText.includes('satisfied') || lowerText.includes('good') || lowerText.includes('love')) {
		sentiment = 'positive';
	} else if (lowerText.includes('negative') || lowerText.includes('problem') || lowerText.includes('issue')) {
		sentiment = 'negative';
	}

	// Extract theme
	let theme = 'general';
	const themes = ['performance', 'ui', 'ux', 'feature', 'bug', 'security', 'mobile', 'integration', 'api', 'dashboard', 'storage', 'networking', 'reliability'];
	for (const t of themes) {
		if (lowerText.includes(t)) {
			theme = t;
			break;
		}
	}

	// Extract severity for bugs
	let severity = 'P2';
	if (isBug) {
		if (lowerText.includes('outage') || lowerText.includes('down') || lowerText.includes('critical') || lowerText.includes('blocking all')) {
			severity = 'P0';
		} else if (lowerText.includes('degraded') || lowerText.includes('major') || lowerText.includes('enterprise') || lowerText.includes('failing')) {
			severity = 'P1';
		} else if (lowerText.includes('cosmetic') || lowerText.includes('typo') || lowerText.includes('alignment')) {
			severity = 'P3';
		}
	}

	// Extract priority for feedback
	let priority = 'medium';
	let userTier = 'Unknown';
	if (!isBug) {
		if (lowerText.includes('enterprise')) {
			userTier = 'Enterprise';
			priority = 'high';
		} else if (lowerText.includes('business')) {
			userTier = 'Business';
			priority = 'medium-high';
		} else if (lowerText.includes('free') || lowerText.includes('tier')) {
			userTier = 'Free';
			priority = 'low';
		}
		
		if (lowerText.includes('high impact') || lowerText.includes('crucial')) {
			priority = priority === 'low' ? 'medium' : 'high';
		}
	}

	return {
		type: isBug ? 'bug' : 'feedback',
		sentiment,
		theme,
		severity: isBug ? severity : null,
		priority: !isBug ? priority : null,
		userTier,
		keyPoints: [],
		suggestedTags: [],
		summary: text.substring(0, 200),
	};
}

/**
 * Store feedback in D1 database
 */
async function storeFeedbackInD1(db, feedback) {
	const stmt = db.prepare(`
		INSERT INTO feedbacks (
			title, description, author, timestamp, tags, status, priority,
			type, theme, severity, feedback_priority, user_tier, sentiment,
			key_points, suggested_tags, summary
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	await stmt.bind(
		feedback.title,
		feedback.description,
		feedback.author || 'system',
		feedback.timestamp || new Date().toISOString(),
		typeof feedback.tags === 'string' ? feedback.tags : JSON.stringify(feedback.tags || []),
		feedback.status || 'new',
		feedback.priority || null,
		feedback.type,
		feedback.theme,
		feedback.severity || null,
		feedback.priority || null, // This is feedback_priority
		feedback.userTier || 'Unknown',
		feedback.sentiment || 'neutral',
		JSON.stringify(feedback.keyPoints || []),
		JSON.stringify(feedback.suggestedTags || []),
		feedback.summary || ''
	).run();
}

/**
 * Get all feedbacks from D1
 */
async function handleGetFeedbacks(request, env, corsHeaders) {
	try {
		if (!env.DB) {
			return new Response(
				JSON.stringify({ error: 'D1 database not configured' }),
				{ 
					status: 503,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		const url = new URL(request.url);
		const theme = url.searchParams.get('theme');
		const type = url.searchParams.get('type'); // 'bug' or 'feedback'
		const limit = parseInt(url.searchParams.get('limit') || '1000');

		let query = 'SELECT * FROM feedbacks WHERE 1=1';
		const params = [];

		if (theme) {
			query += ' AND theme = ?';
			params.push(theme);
		}

		if (type) {
			query += ' AND type = ?';
			params.push(type);
		}

		query += ' ORDER BY created_at DESC LIMIT ?';
		params.push(limit);

		// Build prepared statement with bound parameters
		let stmt = env.DB.prepare(query);
		// Bind all parameters at once
		if (params.length > 0) {
			stmt = stmt.bind(...params);
		}

		const result = await stmt.all();
		
		// Transform results to match expected format
		const feedbacks = result.results.map(row => ({
			id: row.id,
			title: row.title,
			description: row.description,
			author: row.author,
			timestamp: row.timestamp,
			tags: JSON.parse(row.tags || '[]'),
			status: row.status,
			priority: row.priority,
			analysis: {
				type: row.type,
				theme: row.theme,
				severity: row.severity,
				priority: row.feedback_priority,
				userTier: row.user_tier,
				sentiment: row.sentiment,
				keyPoints: JSON.parse(row.key_points || '[]'),
				suggestedTags: JSON.parse(row.suggested_tags || '[]'),
				summary: row.summary,
			},
			created_at: row.created_at,
		}));

		return new Response(
			JSON.stringify({ feedbacks }),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Get feedbacks error:', error);
		return new Response(
			JSON.stringify({ 
				error: 'Failed to fetch feedbacks',
				message: error.message 
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	}
}

/**
 * Download feedbacks as TXT file
 */
async function handleDownloadFeedbacks(request, env, corsHeaders) {
	try {
		if (!env.DB) {
			return new Response(
				JSON.stringify({ error: 'D1 database not configured' }),
				{ 
					status: 503,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		const url = new URL(request.url);
		const theme = url.searchParams.get('theme');
		const type = url.searchParams.get('type');

		let query = 'SELECT * FROM feedbacks WHERE 1=1';
		const params = [];

		if (theme) {
			query += ' AND theme = ?';
			params.push(theme);
		}

		if (type) {
			query += ' AND type = ?';
			params.push(type);
		}

		query += ' ORDER BY created_at DESC';

		// Build prepared statement with bound parameters
		let stmt = env.DB.prepare(query);
		// Bind all parameters at once
		if (params.length > 0) {
			stmt = stmt.bind(...params);
		}

		const result = await stmt.all();
		
		// Format as TXT
		let txtContent = `Cloudflare Signal - Feedback Export\n`;
		txtContent += `Generated: ${new Date().toISOString()}\n`;
		if (theme) txtContent += `Theme: ${theme}\n`;
		if (type) txtContent += `Type: ${type}\n`;
		txtContent += `Total: ${result.results.length} feedbacks\n\n`;
		txtContent += '='.repeat(80) + '\n\n';

		result.results.forEach((row, index) => {
			txtContent += `Feedback #${index + 1}\n`;
			txtContent += `-`.repeat(80) + '\n';
			txtContent += `ID: ${row.id}\n`;
			txtContent += `Title: ${row.title}\n`;
			txtContent += `Description: ${row.description}\n`;
			txtContent += `Author: ${row.author || 'N/A'}\n`;
			txtContent += `Timestamp: ${row.timestamp}\n`;
			txtContent += `Type: ${row.type}\n`;
			txtContent += `Theme: ${row.theme}\n`;
			if (row.severity) txtContent += `Severity: ${row.severity}\n`;
			if (row.feedback_priority) txtContent += `Priority: ${row.feedback_priority}\n`;
			if (row.user_tier) txtContent += `User Tier: ${row.user_tier}\n`;
			txtContent += `Sentiment: ${row.sentiment}\n`;
			if (row.summary) txtContent += `Summary: ${row.summary}\n`;
			txtContent += `Created: ${row.created_at}\n`;
			txtContent += '\n' + '='.repeat(80) + '\n\n';
		});

		const filename = `feedbacks_${theme || 'all'}_${type || 'all'}_${Date.now()}.txt`;

		return new Response(txtContent, {
			headers: {
				...corsHeaders,
				'Content-Type': 'text/plain',
				'Content-Disposition': `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error('Download feedbacks error:', error);
		return new Response(
			JSON.stringify({ 
				error: 'Failed to download feedbacks',
				message: error.message 
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	}
}
