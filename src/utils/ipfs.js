const { create } = require('ipfs-http-client');

// Configure IPFS client to use local IPFS node
const ipfs = create({
	host: 'localhost', // Local IPFS node hostname
	port: 5001,        // Default IPFS API port
	protocol: 'http'   // HTTP protocol for local connections
});

/**
 * Upload content to IPFS
 * @param {Object|Buffer|string} content - Content to upload
 * @returns {Promise<string>} - IPFS hash
 */
const uploadToIPFS = async (content) => {
	try {
		// If content is an object, convert to JSON string
		if (typeof content === 'object' && !Buffer.isBuffer(content)) {
			content = JSON.stringify(content);
		}

		const result = await ipfs.add(content);
		return result.path;
	} catch (error) {
		console.error('IPFS upload error:', error);
		throw new Error('Failed to upload to IPFS');
	}
};

/**
 * Get content from IPFS
 * @param {string} hash - IPFS hash
 * @returns {Promise<Object>} - Content from IPFS
 */
const getFromIPFS = async (hash) => {
	try {
		const stream = ipfs.cat(hash);
		let data = '';

		for await (const chunk of stream) {
			data += chunk.toString();
		}

		try {
			// Try to parse as JSON
			return JSON.parse(data);
		} catch (e) {
			// Return as string if not JSON
			return data;
		}
	} catch (error) {
		console.error('IPFS download error:', error);
		throw new Error('Failed to download from IPFS');
	}
};

module.exports = {
	uploadToIPFS,
	getFromIPFS
};
