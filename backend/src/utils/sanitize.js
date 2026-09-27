const sanitize = (text) => {
  if (typeof text !== 'string') return text;
  return text.trim().replace(/[<>]/g, '');
};

module.exports = sanitize;
