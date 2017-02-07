# lambda-express-local-utils

Simple utils for local AWS Lambda dev setups that use Express as the server.

## TODOs

- [ ] Tests
- [ ] Babel build-time transpiling (or other futurish JS setup)
- [ ] CI & automated releases

## Lambda handler wrapper

Crudely "adapts" lambda handlers as express handlers.

```js
import { wrapLambda } from 'lambda-express-local-utils';

app.get('/say-meow', wrapLambda((event, context, callback) => {
  callback(null, 'meow!');
}));
```

## local AWS API Gateway Authorizer imitator

Uses a local endpoint of your choice to simulate API Gateway behavior.

```js
import { authorizer } from 'lambda-express-local-utils';

app.use(authorizer({
  endpoint: 'endpoint-that-exposes-custom-authorizer',
}));
```

**NOTE**: you will need to expose your custom authorizer locally via an open endpoint.

