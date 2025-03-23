/**
 * Mock AI validation service for charity proposals
 */

/**
 * Validate a charity proposal
 * @param {Object} proposal - The proposal to validate
 * @returns {Object} - Validation result
 */
const validateProposal = async (proposal) => {
	// This is a mock implementation
	// In a real application, this would call an actual AI service

	// Generate random score between 60 and 100
	const score = Math.floor(Math.random() * 41) + 60;

	// Generate feedback based on score
	let feedback;

	if (score >= 90) {
		feedback = "Excellent proposal. Clear goals, transparent budget allocation, and strong impact metrics.";
	} else if (score >= 80) {
		feedback = "Good proposal. Goals are well-defined and the budget seems reasonable. Could improve on impact measurement.";
	} else if (score >= 70) {
		feedback = "Acceptable proposal. The goals are clear but budget details and impact metrics need more detail.";
	} else {
		feedback = "Proposal needs improvement. Please provide more details about project goals, budget breakdown, and how impact will be measured.";
	}

	// Simulate AI processing time
	await new Promise(resolve => setTimeout(resolve, 1500));

	return {
		score,
		feedback,
		isAcceptable: score >= 70, // Consider scores 70+ as acceptable
		timestamp: new Date().toISOString()
	};
};

module.exports = {
	validateProposal
};
