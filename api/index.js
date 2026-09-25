const app = require('../server');

module.exports = (req, res) => {
	const requestUrl = new URL(req.url, 'http://localhost');
	const originalPath = requestUrl.searchParams.get('__originalPath');

	if (originalPath && originalPath.startsWith('/') && !originalPath.startsWith('//')) {
		req.url = `${originalPath}${requestUrl.searchParams.has('query') ? `?${requestUrl.searchParams.get('query')}` : ''}`;
	}

	return app(req, res);
};