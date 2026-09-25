const app = require('../server');

module.exports = (req, res) => {
	const requestUrl = new URL(req.url, 'http://localhost');
	const originalPath = requestUrl.searchParams.get('__originalPath');

	if (originalPath && originalPath.startsWith('/') && !originalPath.startsWith('//')) {
		const originalQuery = new URLSearchParams(requestUrl.searchParams);
		originalQuery.delete('__originalPath');
		const queryString = originalQuery.toString();
		req.url = `${originalPath}${queryString ? `?${queryString}` : ''}`;
	}

	return app(req, res);
};