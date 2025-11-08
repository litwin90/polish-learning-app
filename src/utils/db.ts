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
  }
}

export const db = new PolishLearningDB();
