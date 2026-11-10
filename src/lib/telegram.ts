export const openTelegramSupport = (text?: string) => {
  const queryText = (text || '').trim();
  const encoded = encodeURIComponent(queryText);
  const tgProtocol = `tg://resolve?domain=AladdinAISupport${encoded ? `&text=${encoded}` : ''}`;
  const tgDogUrl = `https://telegram.dog/AladdinAISupport${encoded ? `?text=${encoded}` : ''}`;
  const tmeUrl = `https://t.me/AladdinAISupport${encoded ? `?text=${encoded}` : ''}`;

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isMobile = isAndroid || isIOS;

  if (isMobile) {
    // 1. Try launching the native Telegram app
    window.location.href = tgProtocol;

    // 2. Fallback to the unblocked telegram.dog mirror if app isn't installed
    setTimeout(() => {
      window.location.href = tgDogUrl;
    }, 1200);
  } else {
    // Desktop: Open unblocked telegram.dog in a new tab so user stays on the app
    window.open(tgDogUrl, '_blank', 'noopener,noreferrer');
  }
};

export const openSaifyKhanTelegram = (text?: string) => {
  const queryText = (text || '').trim();
  const encoded = encodeURIComponent(queryText);
  const tgProtocol = `tg://resolve?domain=AladdinAISupport${encoded ? `&text=${encoded}` : ''}`;
  const tgDogUrl = `https://telegram.dog/AladdinAISupport${encoded ? `?text=${encoded}` : ''}`;
  const tmeUrl = `https://t.me/AladdinAISupport${encoded ? `?text=${encoded}` : ''}`;

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isMobile = isAndroid || isIOS;

  if (isMobile) {
    try {
      window.location.href = tgProtocol;
    } catch {}
    setTimeout(() => {
      window.location.href = tgDogUrl;
    }, 1200);
  } else {
    window.open(tmeUrl, '_blank', 'noopener,noreferrer');
  }
};

