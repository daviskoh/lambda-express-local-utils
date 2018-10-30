const request = require('superagent');

module.exports.wrapLambda = (handler) => (async (req, res, next) => {
  // keep ctrl of what is passed through
  const lambdaEvent = {
    headers: req.headers,
    queryStringParameters: req.query,
    body: req.body,
    requestContext: req.requestContext,
  };

  try {
    const resp = await handler(lambdaEvent, {});
    res.status(resp.statusCode);
    res.end(resp.body);
  } catch (err) {
    next(err);
  }
});

module.exports.authorizer = (opts) => (async (req, res, next) => {
  const authToken = req.header('Authorization');

  res.setHeader('Content-Type', 'application/json');

  if (!authToken) {
    return res.status(401).send({ message: 'Unauthorized' });
  }

  console.log(`Authorization token: ${authToken}`);

  const body = {
    authorizationToken: authToken,
    methodArn: 'mock-aws-arn',
    type: 'TOKEN',
  };

  try {
    const resp = await request.post(opts.endpoint).send(body);

    req.requestContext = {
      authorizer: resp.body.context,
    };

    next();
  } catch (err) {
    next(err);
  }
});
