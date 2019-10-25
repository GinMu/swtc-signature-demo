<!-- markdownlint-disable MD014 -->

# swtc-signature-demo

swtc signature demo SWTC本地签名转账demo

## 转账demo

``` bash

$ npm i

swtcAddress: 转出钱包地址
swtcSecret: 转出钱包秘钥
currency: token名称
sequence: 交易序列号（需从链上获取）
amount: 转账数量
destination: 转入钱包地址
memo: 转账备注
issuer: token发行方地址

$ node index.js -A $swtcAddress -S $swtcSecret -t $destination -c $currency -a $amount -m $memo -s $sequence -i $issuer
```
