/**
 * Утилиты для проверки переводов через браузерные API
 * Проверка выполняется напрямую между польским и русским языками
 */

/**
 * Проверить перевод через MyMemory Translation API (прямой перевод pl↔ru)
 */
export const validateTranslationViaAPI = async (
  polish: string,
  russian: string
): Promise<{
  isValid: boolean;
  suggestedTranslation?: string;
  confidence?: number;
}> => {
  try {
    // Проверяем перевод в обе стороны для большей точности

    // 1. Проверка: польский → русский
    const responsePlToRu = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        polish
      )}&langpair=pl|ru`
    );

    if (!responsePlToRu.ok) {
      console.warn("Не удалось проверить перевод через API (pl→ru)");
      return { isValid: true }; // Если API недоступен, считаем перевод валидным
    }

    const dataPlToRu = await responsePlToRu.json();

    // 2. Проверка: русский → польский (обратная проверка)
    const responseRuToPl = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        russian
      )}&langpair=ru|pl`
    );

    if (!responseRuToPl.ok) {
      console.warn("Не удалось проверить перевод через API (ru→pl)");
      // Используем только результат первой проверки
      if (dataPlToRu.responseStatus === 200 && dataPlToRu.responseData) {
        const translatedText = dataPlToRu.responseData.translatedText
          .toLowerCase()
          .trim();
        const expectedRussian = russian.toLowerCase().trim();
        const exactMatch = translatedText === expectedRussian;

        return {
          isValid: exactMatch,
          suggestedTranslation: exactMatch
            ? undefined
            : dataPlToRu.responseData.translatedText,
          confidence: exactMatch ? 1.0 : 0.5,
        };
      }
      return { isValid: true };
    }

    const dataRuToPl = await responseRuToPl.json();

    // Проверяем результаты обеих проверок
    if (
      dataPlToRu.responseStatus === 200 &&
      dataPlToRu.responseData &&
      dataRuToPl.responseStatus === 200 &&
      dataRuToPl.responseData
    ) {
      const translatedRussian = dataPlToRu.responseData.translatedText
        .toLowerCase()
        .trim();
      const expectedRussian = russian.toLowerCase().trim();
      const translatedPolish = dataRuToPl.responseData.translatedText
        .toLowerCase()
        .trim();
      const expectedPolish = polish.toLowerCase().trim();

      // Проверяем точное совпадение в обе стороны
      const exactMatchPlToRu = translatedRussian === expectedRussian;
      const exactMatchRuToPl = translatedPolish === expectedPolish;

      // Если обе проверки совпадают - перевод валиден
      if (exactMatchPlToRu && exactMatchRuToPl) {
        return {
          isValid: true,
          confidence: 1.0,
        };
      }

      // Если одна из проверок не совпадает - предлагаем исправление
      if (!exactMatchPlToRu) {
        return {
          isValid: false,
          suggestedTranslation: dataPlToRu.responseData.translatedText,
          confidence: 0.5,
        };
      }

      // Если обратная проверка не совпадает, но прямая совпадает - возможно проблема в обратном переводе
      // В этом случае считаем перевод валидным, но с меньшей уверенностью
      return {
        isValid: true,
        confidence: 0.7,
      };
    }

    return { isValid: true }; // Если не удалось проверить, считаем валидным
  } catch (error) {
    console.error("Ошибка при проверке перевода:", error);
    return { isValid: true }; // При ошибке считаем валидным
  }
};

/**
 * Проверить перевод через несколько источников и вернуть результат
 */
export const validateTranslation = async (
  polish: string,
  russian: string
): Promise<{
  isValid: boolean;
  suggestedTranslation?: string;
  confidence?: number;
}> => {
  // Используем MyMemory API с прямой проверкой pl↔ru
  return await validateTranslationViaAPI(polish, russian);
};
