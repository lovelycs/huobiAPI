import  axios from 'axios';
import * as moment from 'moment';
import * as CryptoJS from 'crypto-js';
import * as HmacSHA256 from 'crypto-js/hmac-sha256';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json;charset=utf-8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
};

enum STATUS {
  'OK' = 'ok',
  'ERROR' = 'error'
}

export class HuobiRestAPI {
  private accessKey: string;
  private secretKey: string;
  private httpsConfig: Object;

  hostname: string;
  protocol: string;
  proxy: {
    host: string,
    port: number
  } | false;

  constructor({ accessKey, secretKey, proxy = false, hostname = 'api.huobi.pro', timeout = 30000 }: {
    accessKey: string,
    secretKey: string,
    proxy: {
      host: string,
      port: number
    } | false,
    timeout?: number
    hostname?: string
  }) {
    if (!accessKey || !secretKey) {
        throw 'Params Missing: accessKey or secretKey';
    }

    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.hostname = hostname;
    this.protocol = 'https';
    this.proxy = proxy;

    this.httpsConfig = {
      timeout,
      headers: DEFAULT_HEADERS
    };
  }

  get host() {
    return `${this.protocol}://${this.hostname}`;
  }

  get(path: string, params?: Object) {
    return this.request('GET', path, params);
  }

  post(path: string, params?: Object) {
    return this.request('POST', path, params);
  }

  request(method: 'GET' | 'POST', path: string, params?: Object) {
    if (method !== 'GET' && method !== 'POST') {
      throw 'method only be GET or POST';
    }

    path = this.foramtPath(path);

    const { paramsStr, originalParams } = this.signParams({
      path,
      method,
      params
    });

    if (method === 'GET') {
      return this.fetch(`${path}?${paramsStr}`, {
        method
      });
    }

    return this.fetch(`${path}?${paramsStr}`, {
      method,
      data: originalParams
    });
  }

  private signParams({
    method, path, params
  }: {
    method: 'GET' | 'POST';
    path: String;
    params?: Object;
  }): {
    originalParams: Object,
    paramsStr: string,
    signature: string
  } {
    if (!path.startsWith('/')) {
      throw 'path must starts with \/';
    }

    const needSignature = !path.startsWith('/market');

    let originalParams;
    if (needSignature) {
      originalParams = {
        AccessKeyId: this.accessKey,
        SignatureMethod: 'HmacSHA256',
        SignatureVersion: '2',
        Timestamp: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
        ...params
      };
    } else {
      originalParams = { ...params };
    }

    const paramsArr = [];
    for (const item in originalParams) {
      paramsArr.push(`${item}=${encodeURIComponent(originalParams[item])}`);
    }
    const pStr = paramsArr.sort().join('&');

    if (!needSignature) {
      return {
        originalParams,
        signature: '',
        paramsStr: pStr
      };
    }

    const meta = [method, this.hostname, path, pStr].join('\n');
    const hash = HmacSHA256(meta, this.secretKey);
    const signature = encodeURIComponent(CryptoJS.enc.Base64.stringify(hash));

    return {
      signature,
      originalParams,
      paramsStr: `${pStr}&Signature=${signature}`
    };
  }

  private foramtPath(path: string): string {
    path = path.trim();
    if (!path.startsWith('/')) {
      path = `/${ path }`;
    }
    if (path.endsWith('/')) {
      path = path.substring(0, path.length - 1);
    }
    return path;
  }

  private fetch(path, options: Object) {
    const url = `${this.host}${path}`;

    return axios({
      url,
      ...options,
      ...this.httpsConfig,
      proxy: this.proxy
    }).then((res) => {
      if (res.status !== 200) {
          throw res;
      }
      return res.data;
    }).then((data) => {
      const status: string = data.status.toLowerCase();
      if (status !== STATUS.OK) {
          throw data;
      }
      return data;
    });
  }
}
