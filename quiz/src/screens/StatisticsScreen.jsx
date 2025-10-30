import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { useToast } from '../hooks/useToast';
import { calculateAccuracyString } from '../utils/calculations';
import Toast from '../components/Toast';
import './StatisticsScreen.css';

export default function StatisticsScreen() {
  const navigate = useNavigate();
  const { questions, stats, resetStats, getGlobalStats } = useQuiz();
  const { toast, showWarning, hideToast } = useToast();
  const [expandedBlocks, setExpandedBlocks] = useState({});

  const globalStats = getGlobalStats();

  // Toggle expand/collapse for a superblock
  const toggleBlock = (superblock) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [superblock]: !prev[superblock]
    }));
  };

  // Import statsService to calculate block stats with new structure
  const statsService = { calculateBlockStats: (questions, stats) => {
    const blockStats = {};

    questions.forEach(q => {
      const superblock = q.superblock || q.block;
      const subblock = q.subblock || null;

      if (!blockStats[superblock]) {
        blockStats[superblock] = {
          total: 0,
          answered: 0,
          correct: 0,
          incorrect: 0,
          subblocks: {},
        };
      }

      blockStats[superblock].total += 1;

      const questionStats = stats[q.id];
      if (questionStats) {
        blockStats[superblock].answered += 1;
        blockStats[superblock].correct += questionStats.correct;
        blockStats[superblock].incorrect += questionStats.incorrect;
      }

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
  }};

  const blockStats = statsService.calculateBlockStats(questions, stats);

  const handleReset = () => {
    showWarning(
      '¿Estás seguro de que quieres resetear todas las estadísticas? Haz clic de nuevo en 3 segundos para confirmar.',
      3000
    );
    setTimeout(() => {
      const confirmReset = window.confirm('¿Confirmas el reseteo de todas las estadísticas?');
      if (confirmReset) {
        resetStats();
      }
    }, 100);
  };

  return (
    <div className="container stats-container">
      {toast && <Toast {...toast} onClose={hideToast} />}
      <div className="content">
        <h1 className="stats-title">Estadísticas</h1>

        {/* Dashboard Layout */}
        <div className="stats-dashboard">
          {/* Left Panel - Global Stats */}
          <div className="stats-left-panel">
            <div className="card global-stats-card">
              <h2 className="card-title">Resumen Global</h2>

              <div className="global-stat-item">
                <span className="stat-icon-large">📊</span>
                <div className="stat-details">
                  <p className="stat-value-large">{globalStats.answeredQuestions}/{globalStats.totalQuestions}</p>
                  <p className="stat-label-small">Respondidas</p>
                </div>
              </div>

              <div className="global-stat-item">
                <span className="stat-icon-large">✅</span>
                <div className="stat-details">
                  <p className="stat-value-large success">{globalStats.totalCorrect}</p>
                  <p className="stat-label-small">Correctas</p>
                </div>
              </div>

              <div className="global-stat-item">
                <span className="stat-icon-large">❌</span>
                <div className="stat-details">
                  <p className="stat-value-large error">{globalStats.totalIncorrect}</p>
                  <p className="stat-label-small">Incorrectas</p>
                </div>
              </div>

              <div className="global-stat-item highlight">
                <span className="stat-icon-large">🎯</span>
                <div className="stat-details">
                  <p className="stat-value-large accuracy">{globalStats.accuracy}%</p>
                  <p className="stat-label-small">Precisión</p>
                </div>
              </div>

              <div className="global-stat-item">
                <span className="stat-icon-large">🔢</span>
                <div className="stat-details">
                  <p className="stat-value-large">{globalStats.totalAttempts}</p>
                  <p className="stat-label-small">Total Intentos</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <button className="reset-button" onClick={handleReset}>
              🔄 Resetear Estadísticas
            </button>
            <button className="back-button" onClick={() => navigate('/')}>
              ← Volver al inicio
            </button>
          </div>

          {/* Right Panel - Block Stats */}
          <div className="stats-right-panel">
            <h2 className="panel-title">Bloques</h2>
            <div className="blocks-grid">
              {Object.entries(blockStats).map(([superblock, superblockData]) => {
                const totalAttempts = superblockData.correct + superblockData.incorrect;
                const accuracy = calculateAccuracyString(superblockData.correct, superblockData.incorrect, 1);
                const hasSubblocks = Object.keys(superblockData.subblocks || {}).length > 0;

                const isExpanded = expandedBlocks[superblock];

                return (
                  <div key={superblock} className="block-card-container">
                    <div className="block-card">
                      {/* Clickable header to expand/collapse */}
                      <div
                        className="block-card-header clickable"
                        onClick={() => hasSubblocks && toggleBlock(superblock)}
                      >
                        <div className="block-card-header-content">
                          <h3 className="block-card-name">
                            📘 {superblock}
                            {hasSubblocks && (
                              <span className="expand-indicator">
                                {isExpanded ? ' ▼' : ' ▶'}
                              </span>
                            )}
                          </h3>
                          <div className="block-card-progress">
                            <div className="progress-bar-large">
                              <div
                                className="progress-fill-large"
                                style={{ width: accuracy }}
                              ></div>
                            </div>
                            <p className="block-percentage">{accuracy}</p>
                          </div>
                          <div className="block-card-stats">
                            <span>{superblockData.answered}/{superblockData.total} respondidas</span>
                            <span>•</span>
                            <span>{totalAttempts} intentos</span>
                          </div>
                        </div>
                      </div>

                      {/* Action button */}
                      <button
                        className="block-review-button"
                        onClick={() => navigate(`/review/block/${encodeURIComponent(superblock)}`)}
                      >
                        Repasar →
                      </button>
                    </div>

                    {/* Subblocks */}
                    {hasSubblocks && isExpanded && (
                      <div className="subblocks-container">
                        {Object.entries(superblockData.subblocks).map(([subblock, subblockData]) => {
                          const subTotalAttempts = subblockData.correct + subblockData.incorrect;
                          const subAccuracy = calculateAccuracyString(subblockData.correct, subblockData.incorrect, 1);

                          return (
                            <div
                              key={subblock}
                              className="subblock-card clickable"
                              onClick={() => navigate(`/review/block/${encodeURIComponent(subblock)}`)}
                            >
                              <h4 className="subblock-card-name">└─ {subblock}</h4>
                              <div className="subblock-card-stats">
                                <span>{subblockData.answered}/{subblockData.total}</span>
                                <span>•</span>
                                <span>{subAccuracy}</span>
                                <span>•</span>
                                <span>{subTotalAttempts} intentos</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
