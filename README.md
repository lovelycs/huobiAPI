# huobiAPI

## Steps
1. 申请 accessKey 和 secretKey: https://huobiapi.github.io/docs/spot/v1/cn/#25e54147de
2. Huobi API: https://huobiapi.github.io/docs/spot/v1/cn/#185368440e
3. 如下 调用

## Examples

```typescript
import { HuobiRestAPI } from 'huobi-api';

const accessKey = 'your accessKey';
const secretKey = 'your secretKey';

// 假如需要代理
// proxy: {
//   host: 'http://127.0.0.1',
//   port: 1080
// }
const myHuobiRestAPI = new HuobiRestAPI({
  accessKey, secretKey
});

async function getAccounts() {
  const res: any = await myHuobiRestAPI.get('/v1/account/accounts');
  const accounts = res.data || [];

  return accounts;
}

async function getMarketDetailMerged() {
  const res = await myHuobiRestAPI.get('/market/detail/merged', { symbol });
  const closePrice = res.tick.close;
}

async function plageOrder() {
  const result: any = await myHuobiRestAPI.post('/v1/order/orders/place', {
    symbol: 'ethusdt',
    type: 'buy-limit',
    amount: '0.01',
    price: '100.01'
    'account-id': accountId
  });
  return result;
}
```
