const program = require('commander');
const { Remote, Transaction } = require("swtc-lib");
const localSign = require("swtc-transaction/src/local_sign");
const Wallet = require("swtc-factory").Wallet
const Serializer = require("swtc-serializer").Serializer

program
  .usage('[options] <file ...>')
  .option('-A, --address <path>', '转出钱包地址')
  .option('-S, --secret <path>', '转出钱包秘钥')
  .option('-c, --currency <path>', 'token名称')
  .option('-s, --sequence <path>', '交易序列号')
  .option('-a, --amount <path>', '转账数量')
  .option('-t, --to <path>', '转入钱包地址')
  .option('-m, --memo <path>', '备注')
  .option('-i, --issuer <path>', 'token发行方地址')
  .parse(process.argv);

const serializePayment = (address, amount, to, token, memo, issuer = "jGa9J9TkqtBcUoHe2zqhVFFbgUVED6o9or") => {
  let _amount;
  if (token.toUpperCase() === "SWT") {
    _amount = amount;
  } else {
    _amount = {
      currency: token.toUpperCase(),
      issuer,
      value: amount
    };
  }

  let memos;

  if (typeof memo === "string") {
    memos = [{
      Memo: {
        MemoData: memo,
        MemoType: "string"
      }
    }];
  } else {
    memos = memo;
  }

  const tx = {
    Account: address,
    Amount: _amount,
    Destination: to,
    Fee: 10 / 1000000,
    Flags: 0,
    Memos: memos,
    TransactionType: "Payment"
  };

  return tx;
};

const getTransactionHash = (in_tx, in_v) => {
  const wt = new Wallet(in_v.seed)
  in_tx.SigningPubKey = wt.getPublicKey()
  const prefix = 0x54584E00
  const hash = Serializer.from_json(in_tx).hash(prefix)
  return hash;
}

const transfer = () => {
  return new Promise((resolve, reject) => {
    const { address, secret, amount, currency, memo, to, issuer, sequence } = program;
    const remote = new Remote({ server: "wss://c04.jingtum.com:5020" });
    remote.connectPromise()
      .then(() => {
        // 序列化转账数据
        const tx = serializePayment(address, amount, to, currency, memo, issuer);

        // 设置sequence, sequence需从链上获取
        tx.Sequence = Number(sequence);
        console.log("交易数据: ", JSON.stringify(tx, null, 2));

        let signedData;
        let transactionHash;
        try {
          // 本地签名
          signedData = localSign(tx, { seed: secret });
          console.log("签名数据: ", signedData);

          // 获取交易hash
          transactionHash = getTransactionHash(tx, { seed: secret });
          console.log("交易hash: ", transactionHash);

        } catch (error) {
          remote.disconnect()
          return reject(error);
        }

        const transaction = new Transaction(remote);
        // 设置blob
        transaction.parseJson({
          blob: signedData
        });

        // 将签名后的数据直接发送到链上
        transaction.submit((error, res) => {
          remote.disconnect()
          if (error) {
            return reject(error)
          }
          return resolve(res);
        })
      })
      .catch((error) => reject(error));
  })
}

transfer().then(res => {
  console.log("转账结果：", JSON.stringify(res, null, 2));
}).catch(error => {
  console.log("转账失败：", error);
})