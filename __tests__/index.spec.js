describe('Lambda Utils', () => {
  let mocks;

  beforeEach(async () => {
    mocks = {};
  });

  afterEach(async () => {
    // !!!!!!!!!!! below is necessary to reset jest.mock state
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('wrapLambda', () => {
    let wrapLambda;

    beforeEach(async () => {
      mocks.handlerResp = {
        statusCode: 200,
        body: {},
      };

      mocks.handler = jest.fn(() => (Promise.resolve(mocks.handlerResp)));

      mocks.req = {
        headers: {
          Authorization: 'Bearer test-wrap-lambda-authorization',
          'x-api-key': 'test-wrap-lambda-x-api-key',
        },
        query: {
          foo: 'bar',
          meow: 'dog',
        },
        body: {
          query: 'query { heathcheck }',
          variables: { bro: 'montana', points: 1 },
        },
        requestContext: {},
      };

      mocks.res = {
        status: jest.fn(),
        end: jest.fn(),
      };

      mocks.next = jest.fn();

      wrapLambda = require('../index').wrapLambda;
    });

    it('calls handler w/ proper args', async () => {
      await wrapLambda(mocks.handler)(
        mocks.req,
        mocks.res,
        mocks.next
      );

      expect(mocks.handler).toBeCalledWith({
        headers: mocks.req.headers,
        queryStringParameters: mocks.req.query,
        body: mocks.req.body,
        requestContext: mocks.req.requestContext,
      }, {});
    });

    it('writes to res', async () => {
      await wrapLambda(mocks.handler)(
        mocks.req,
        mocks.res,
        mocks.next
      );

      expect(mocks.res.status)
        .toBeCalledWith(mocks.handlerResp.statusCode);
      expect(mocks.res.end)
        .toBeCalledWith(mocks.handlerResp.body);
    });

    it('handles errors from handlers', async () => {
      const error = new Error('that shit no bueno...');
      mocks.handler = jest.fn(() => (Promise.reject(error)));

      await wrapLambda(mocks.handler)(
        mocks.req,
        mocks.res,
        mocks.next
      );

      expect(mocks.next).toBeCalledWith(error);

      expect(mocks.res.status).not.toBeCalled();
      expect(mocks.res.end).not.toBeCalled();
    });
  });

  describe('authorizer', () => {
    let authorizer;

    beforeEach(async () => {
      mocks.headers = {
        Authorization: 'Bearer test-authorizer-header',
      };

      mocks.req = {
        header: (headerName) => mocks.headers[headerName],
      };

      mocks.resSend = jest.fn();

      mocks.res = {
        setHeader: jest.fn(),
        status: jest.fn(() => ({
          send: mocks.resSend,
        })),
      };

      mocks.postSendResp = Promise.resolve({
        statusCode: 200,
        body: {
          context: {
            userId: '123123',
            placeId: '123123',
          },
        },
      });

      mocks.send = jest.fn(() => mocks.postSendResp);

      mocks.post = jest.fn(() => ({
        send: mocks.send,
      }));

      jest.mock('superagent', () => ({
        post: mocks.post,
      }));

      mocks.next = jest.fn();

      authorizer = require('../index').authorizer;
    });

    it('checks for an Authorization token', async () => {
      const opts = {
        endpoint: 'authorization-endpoint',
      };

      await authorizer(opts)(
        mocks.req,
        mocks.res,
        mocks.next
      );

      expect(mocks.post).toBeCalledWith(opts.endpoint);

      expect(mocks.send).toBeCalledWith({
        authorizationToken: mocks.headers.Authorization,
        methodArn: 'mock-aws-arn',
        type: 'TOKEN',
      });

      expect(mocks.next).toBeCalled();
    });

    it('sets requestContext', async () => {
      const context = {
        userId: '123123',
        placeId: '123123',
      };

      mocks.postSendResp = Promise.resolve({
        body: {
          context,
        },
      });

      await authorizer({})(
        mocks.req,
        mocks.res,
        mocks.next
      );

      expect(mocks.req.requestContext).toEqual({
        authorizer: context,
      });
    });

    it('checks for auth token', async () => {
      delete mocks.headers.Authorization;

      await authorizer({})(
        mocks.req,
        mocks.res,
        mocks.next
      );

      expect(mocks.res.status).toBeCalledWith(401);
      expect(mocks.resSend).toBeCalledWith({
        message: 'Unauthorized',
      });

      expect(mocks.post).not.toBeCalled();
    });

    it('handles 401 statusCode responses from authorizer', async () => {
      const error = {
        status: 401,
        message: 'Unauthorized',
      };

      mocks.postSendResp = Promise.reject(error);

      await authorizer({})(
        mocks.req,
        mocks.res,
        mocks.next
      );

      expect(mocks.next).toBeCalledWith(error);
    });

    it('handles all other errors', async () => {
      const error = {
        status: 500,
        message: 'Unauthorized',
      };

      mocks.postSendResp = Promise.reject(error);

      await authorizer({})(
        mocks.req,
        mocks.res,
        mocks.next
      );

      expect(mocks.next).toBeCalledWith(error);
    });
  });
});
