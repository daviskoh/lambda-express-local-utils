const request = require('superagent');

module.exports.wrapLambda = (handler) => {
  const cb = (res, next) => {
    return (err, resp) => {
      if (err) return next(err);

      res.status(resp.statusCode);
      res.end(resp.body);

    };
  };

  return (req, res, next) => {
    // keep ctrl of what is passed through
    const lambdaEvent = {
      headers: {
        Authorization: req.headers.authorization,
      },
      body: JSON.stringify(req.body),
      requestContext: req.requestContext,
    };

    handler(lambdaEvent, {}, cb(res, next));
  };
};

module.exports.authorizer = (opts) => {
  return (req, res, next) => {
    const authToken = req.header('Authorization');

    res.setHeader('Content-Type', 'application/json');

    if (!authToken) {
      return res.status(401).send({'message': 'Unauthorized'});
    }

    console.log(`Authorization token: ${authToken}`);

    const body = {
      authorizationToken: authToken,
      methodArn: 'mock-aws-arn',
      type: 'TOKEN',
    };

    request
      .post(opts.endpoint)
      .send(body)
      .end((err, resp) => {
        if (err) {
          console.error(err)
          res.status(401).send({'message': 'Unauthorized'})
        };

        req.requestContext = {
          authorizer: resp.body.context,
        };

        next();
      });
  };
};

