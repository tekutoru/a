// SHA-256でハッシュを生成する関数
async function sha256(str) {
  const encoder = new TextEncoder('utf-8');
  const strBuffer = encoder.encode(str);

  // WebCrypto APIを使用してSHA-256のダイジェストを生成
  const hashBuffer = await crypto.subtle.digest('SHA-256', strBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // 16進数に変換して、1桁なら0埋め。全部繋いで文字列にする
  const hashHex = hashArray.map((value) => value.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// charactersのstartIndexからendIndexまでの文字を頭文字とするフレーズを生成する関数
// 再帰的に実行するのでlengthがあまり長いとスタックオーバーフローになるので注意
function* generatePhrase(characters, startIndex, endIndex, length) {
  // 長さが1未満のときは終了する
  if(length < 1) {
    yield '';
    return '';
  }

  // それより長いときは再帰的に実行して文字をつなげる
  for(let i = startIndex; i <= endIndex; i++) {
    // 二文字目以降は全文字（0からcharcters.length - 1）の中から選ぶ
    for(const part of generatePhrase(characters, 0, characters.length - 1, length - 1)) {
      yield characters[i] + part;
    }
  }
}

// パスワードを生成する関数
function* generatePassword(characters, startIndex, endIndex, maxLength) {
  for(let length = 1; length <= maxLength; length++) {
    for(const phrase of generatePhrase(characters, startIndex, endIndex, length)) {
      yield phrase;
    }
  }
}

// メインスレッドからパラメータを渡されたら処理を開始する
self.addEventListener('message', async (message) => {
    const hashList = message.data.passwordHashList;
    const characters = message.data.characters;
    const startIndex = message.data.startCharacterIndex;
    const endIndex = message.data.endCharacterIndex;
    const maxLength = message.data.maxLength;

    // 生成した各パスワードごとにハッシュを計算して
    // リストに一致するものがあればメインスレッドに送る
    for(const phrase of generatePassword(characters, startIndex, endIndex, maxLength)) {
      const shaHash = await sha256(phrase);
      if(hashList.includes(shaHash)) {
        self.postMessage({
          hash: shaHash,
          password: phrase
        });
      }
    }
});
