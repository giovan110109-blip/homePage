const sensitiveWords = [
  '傻逼', '煞笔', '沙比', '煞逼', '沙逼', 'sb', 'SB', 'Sb', 'sB',
  '操你妈', '草你妈', '肏你妈', '干你妈', '他妈的', 'TMD', 'tmd',
  '操', '草', '肏', '日', '靠', '艹',
  '妈的', '妈逼', '妈比', 'MB', 'mb',
  '傻叉', '煞叉', '沙叉', 'sc', 'SC', 'Sc',
  '王八蛋', '王八', '乌龟', '绿帽', '绿帽子',
  '滚蛋', '滚开', '滚犊子', '滚粗', '滚',
  '贱人', '贱货', '婊子', '表子', '婊',
  '狗日', '狗娘养的', '狗东西', '狗屁',
  '屁眼', '屁事', '放屁',
  '脑残', '脑瘫', '弱智', '智障', '白痴', '傻子', '呆子',
  '去死', '死全家', '全家死', '不得好死',
  '强奸', '强暴', '轮奸', '迷奸',
  '卖淫', '嫖娼', '鸡', '鸭', '小姐', '援交',
  '毒品', '吸毒', '贩毒', '冰毒', '海洛因', '摇头丸',
  '赌博', '赌钱', '赌场', '博彩',
  '法轮功', '法轮', 'falun', 'FLG', 'flg',
  '共产党', '共党', '反共', '反华', '台独', '藏独', '疆独',
  '习近平', '江泽民', '胡锦涛', '温家宝', '李克强',
  '六四', '64', '8964', '天安门', 'tiananmen',
  'fuck', 'FUCK', 'Fuck', 'shit', 'SHIT', 'Shit',
  'asshole', 'ASSHOLE', 'bitch', 'BITCH', 'Bitch',
  'nigger', 'NIGGER', 'nigga',
];

let wordSet = null;
let wordPattern = null;

const getWordSet = () => {
  if (!wordSet) {
    wordSet = new Set(sensitiveWords.map(w => w.toLowerCase()));
  }
  return wordSet;
};

const getWordPattern = () => {
  if (!wordPattern) {
    const escaped = sensitiveWords
      .filter(w => w.length > 1)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    wordPattern = new RegExp(escaped, 'gi');
  }
  return wordPattern;
};

const containsSensitiveWords = (text) => {
  if (!text) return { hasSensitive: false, words: [] };
  
  const lowerText = text.toLowerCase();
  const words = getWordSet();
  const found = [];
  
  for (const word of words) {
    if (lowerText.includes(word)) {
      found.push(word);
    }
  }
  
  return {
    hasSensitive: found.length > 0,
    words: [...new Set(found)]
  };
};

const findSensitiveWords = (text) => {
  if (!text) return [];
  
  const found = [];
  const lowerText = text.toLowerCase();
  const words = getWordSet();
  
  for (const word of words) {
    if (lowerText.includes(word)) {
      found.push(word);
    }
  }
  
  return [...new Set(found)];
};

const filterSensitiveWords = (text, replacement) => {
  if (!text) return text;
  replacement = replacement || '*';
  
  const pattern = getWordPattern();
  return text.replace(pattern, (match) => replacement.repeat(match.length));
};

const maskSensitiveWords = (text) => {
  const words = findSensitiveWords(text);
  const hasSensitive = words.length > 0;
  const filteredText = hasSensitive ? filterSensitiveWords(text) : text;
  
  return {
    text: filteredText,
    hasSensitive,
    words
  };
};

const addSensitiveWords = (words) => {
  words.forEach(word => {
    if (!sensitiveWords.includes(word)) {
      sensitiveWords.push(word);
    }
  });
  wordSet = null;
  wordPattern = null;
};

const removeSensitiveWords = (words) => {
  words.forEach(word => {
    const index = sensitiveWords.indexOf(word);
    if (index > -1) {
      sensitiveWords.splice(index, 1);
    }
  });
  wordSet = null;
  wordPattern = null;
};

const getSensitiveWordCount = () => {
  return sensitiveWords.length;
};

module.exports = {
  containsSensitiveWords,
  findSensitiveWords,
  filterSensitiveWords,
  maskSensitiveWords,
  addSensitiveWords,
  removeSensitiveWords,
  getSensitiveWordCount
};
