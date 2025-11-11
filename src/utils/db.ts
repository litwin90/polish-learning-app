import Dexie, { Table } from 'dexie';

import { Word } from '../types';

interface Metadata {
  id: "version";
  version: string;
}

class PolishLearningDB extends Dexie {
  words!: Table<Word, string>;
  metadata!: Table<Metadata, string>;

  constructor() {
    super("PolishLearningDB");

    this.version(1).stores({
      words:
        "id, polish, russian, category, knowsPlToRu, knowsRuToPl, needsReview, isUnsure, lastReviewed",
      metadata: "id",
    });

    // Версия 2: добавляем поддержку истории просмотров
    this.version(2)
      .stores({
        words:
          "id, polish, russian, category, knowsPlToRu, knowsRuToPl, needsReview, isUnsure, lastReviewed",
        metadata: "id",
      })
      .upgrade(async (tx) => {
        // Миграция данных: добавляем пустые массивы reviewHistory для существующих слов
        await tx
          .table("words")
          .toCollection()
          .modify((word) => {
            if (!word.reviewHistory) {
              word.reviewHistory = [];
            }
          });
      });
  }
}

export const db = new PolishLearningDB();
