const EMOTE_BASE_URL = 'https://serve.giovan.cn/uploads/emote';

function replaceEmotes(text, options = {}) {
  const { size = 48, style = '' } = options;
  
  if (!text) return text;
  
  const emotePattern = /\{\{([^}]+)\}\}/g;
  
  return text.replace(emotePattern, (match, emoteName) => {
    const trimmedName = emoteName.trim();
    const emoteUrl = `${EMOTE_BASE_URL}/${trimmedName}`;
    
    return `<img src="${emoteUrl}" alt="${trimmedName}" style="width: ${size}px; height: ${size}px; vertical-align: middle; display: inline-block; margin: 0 2px; ${style}" />`;
  });
}

function replaceEmotesWithPlaceholder(text) {
  if (!text) return text;
  
  const emotePattern = /\{\{([^}]+)\}\}/g;
  
  return text.replace(emotePattern, (match, emoteName) => {
    const trimmedName = emoteName.trim();
    return `[表情:${trimmedName}]`;
  });
}

function getEmoteUrl(emoteName) {
  return `${EMOTE_BASE_URL}/${emoteName.trim()}`;
}

function hasEmotes(text) {
  if (!text) return false;
  return /\{\{[^}]+\}\}/.test(text);
}

module.exports = {
  replaceEmotes,
  replaceEmotesWithPlaceholder,
  getEmoteUrl,
  hasEmotes
};
