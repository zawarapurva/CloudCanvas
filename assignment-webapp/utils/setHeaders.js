const setCustomHeaders = response => {
    response.setHeader('Cache-control', 'no-cache');
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin');
    response.setHeader('Access-Control-Allow-Methods', '*');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/json;charsetHeader=utf-8');
    response.setHeader('Date', new Date().toUTCString());
    response.setHeader('ETag', 'W/"a9-N/X4JXf/69QQSQ1CLHMNPzj473I"');
    response.setHeader('Expires', '-1');
}

module.exports = { setCustomHeaders }