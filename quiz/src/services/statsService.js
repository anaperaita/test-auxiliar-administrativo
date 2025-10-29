/**
 * Statistics Service
 * Handles statistics calculations and aggregations
 */

/**
 * Record an answer for a question
 * @param {Object} stats - Current statistics object
 * @param {string} questionId - Question ID
 * @param {boolean} isCorrect - Whether answer was correct
 * @returns {Object} Updated statistics object
 */
export const recordAnswer = (stats, questionId, isCorrect) => {
  const newStats = { ...stats };

  if (!newStats[questionId]) {
    newStats[questionId] = {
      correct: 0,
      incorrect: 0,
      lastAttempt: null,
    };
  } else {
    // Deep clone the existing question stats to avoid mutation
    newStats[questionId] = { ...newStats[questionId] };
  }

  if (isCorrect) {
    newStats[questionId].correct += 1;
  } else {
    newStats[questionId].incorrect += 1;
  }

  newStats[questionId].lastAttempt = new Date().toISOString();
  return newStats;
};

/**
 * Calculate global statistics for current module
 * @param {Array} questions - Questions in current module
 * @param {Object} stats - Statistics object
 * @returns {Object} Global statistics
 */
export const calculateGlobalStats = (questions, stats) => {
  const totalQuestions = questions.length;

  // Filter only current module question stats
  const currentModuleQuestionIds = questions.map(q => q.id);
  const currentModuleStats = Object.entries(stats)
    .filter(([questionId]) => currentModuleQuestionIds.includes(questionId));

  const answeredQuestions = currentModuleStats.length;
  let totalCorrect = 0;
  let totalIncorrect = 0;

  currentModuleStats.forEach(([, s]) => {
    totalCorrect += s.correct;
    totalIncorrect += s.incorrect;
  });

  const totalAttempts = totalCorrect + totalIncorrect;
  const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts * 100).toFixed(1) : 0;

  return {
    totalQuestions,
    answeredQuestions,
    totalCorrect,
    totalIncorrect,
    totalAttempts,
    accuracy,
  };
};

/**
 * Calculate statistics grouped by superblock and subblock
 * @param {Array} questions - All questions
 * @param {Object} stats - Statistics object
 * @returns {Object} Statistics grouped by superblock, then subblock
 */
export const calculateBlockStats = (questions, stats) => {
  const blockStats = {};

  questions.forEach(q => {
    // Use superblock and subblock structure, fallback to old block for backward compatibility
    const superblock = q.superblock || q.block;
    const subblock = q.subblock || null;

    // Initialize superblock if it doesn't exist
    if (!blockStats[superblock]) {
      blockStats[superblock] = {
        total: 0,
        answered: 0,
        correct: 0,
        incorrect: 0,
        subblocks: {},
      };
    }

    // Add to superblock totals
    blockStats[superblock].total += 1;

    const questionStats = stats[q.id];
    if (questionStats) {
      blockStats[superblock].answered += 1;
      blockStats[superblock].correct += questionStats.correct;
      blockStats[superblock].incorrect += questionStats.incorrect;
    }

    // If subblock exists, track it separately
    if (subblock) {
      if (!blockStats[superblock].subblocks[subblock]) {
        blockStats[superblock].subblocks[subblock] = {
          total: 0,
          answered: 0,
          correct: 0,
          incorrect: 0,
        };
      }

      blockStats[superblock].subblocks[subblock].total += 1;

      if (questionStats) {
        blockStats[superblock].subblocks[subblock].answered += 1;
        blockStats[superblock].subblocks[subblock].correct += questionStats.correct;
        blockStats[superblock].subblocks[subblock].incorrect += questionStats.incorrect;
      }
    }
  });

  return blockStats;
};

/**
 * Calculate accuracy percentage
 * @param {number} correct - Number of correct answers
 * @param {number} incorrect - Number of incorrect answers
 * @returns {string} Accuracy percentage with 1 decimal
 */
export const calculateAccuracy = (correct, incorrect) => {
  const total = correct + incorrect;
  return total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0';
};

export default {
  recordAnswer,
  calculateGlobalStats,
  calculateBlockStats,
  calculateAccuracy,
};
