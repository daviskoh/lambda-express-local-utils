import request from 'superagent';

export wrapLambda (handler) => {
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
      body: JSON.stringify(req.body),
      requestContext: req.requestContext,
    };

    handler(lambdaEvent, {}, cb(res, next));
  };
};

export authorizer = (opts) => {
  return (req, res, next) => {
    const authToken = req.header('Authorization');
    if (!authToken) return res.end('Unathorized');

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
          res.end('Unauthorized');
        };

        req.requestContext = {
          authorizer: resp.body.context,
        };

        next();
      });
  };
};

