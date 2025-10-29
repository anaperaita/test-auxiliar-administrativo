import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import './SequentialModeScreen.css';

export default function SequentialModeScreen() {
  const navigate = useNavigate();
  const { questions } = useQuiz();

  // Obtener bloques únicos (grouped by superblock with subblocks)
  const blockStructure = {};
  questions.forEach(q => {
    const superblock = q.superblock || q.block;
    const subblock = q.subblock;

    if (!blockStructure[superblock]) {
      blockStructure[superblock] = {
        name: superblock,
        subblocks: new Set(),
        questionCount: 0,
      };
    }

    blockStructure[superblock].questionCount += 1;

    if (subblock) {
      blockStructure[superblock].subblocks.add(subblock);
    }
  });

  // Convert to array and sort
  const superblocks = Object.values(blockStructure).map(sb => ({
    name: sb.name,
    subblocks: Array.from(sb.subblocks),
    questionCount: sb.questionCount,
  }));

  return (
    <div className="container sequential-mode-container">
      <div className="content">
        <h1 className="sequential-title">📋 Práctica en Orden</h1>
        <p className="sequential-subtitle">
          Elige qué preguntas quieres practicar en orden secuencial
        </p>

        <div className="sequential-options">
          {/* Opción: Todas las preguntas */}
          <button
            className="sequential-option-card all-questions"
            onClick={() => navigate('/review/sequential')}
          >
            <div className="option-icon">📚</div>
            <div className="option-content">
              <h3 className="option-title">Todas las Preguntas</h3>
              <p className="option-description">
                Practica las {questions.length} preguntas del módulo en orden
              </p>
            </div>
          </button>

          {/* Opción: Por bloques */}
          <div className="blocks-section">
            <h2 className="blocks-title">O selecciona un bloque:</h2>
            <div className="blocks-list">
              {superblocks.map((superblock, index) => {
                const hasSubblocks = superblock.subblocks.length > 0;

                return (
                  <div key={index} className="superblock-group">
                    <button
                      className="sequential-option-card block-card"
                      onClick={() => navigate(`/review/block/${encodeURIComponent(superblock.name)}`)}
                    >
                      <div className="option-icon">📘</div>
                      <div className="option-content">
                        <h3 className="option-title">{superblock.name}</h3>
                        <p className="option-description">
                          {superblock.questionCount} preguntas
                          {hasSubblocks && ` (${superblock.subblocks.length} tests)`}
                        </p>
                      </div>
                    </button>

                    {/* Subblocks */}
                    {hasSubblocks && (
                      <div className="subblocks-list">
                        {superblock.subblocks.map((subblock, subIndex) => {
                          const subblockQuestions = questions.filter(q => q.subblock === subblock);
                          return (
                            <button
                              key={subIndex}
                              className="sequential-option-card subblock-card"
                              onClick={() => navigate(`/review/block/${encodeURIComponent(subblock)}`)}
                            >
                              <div className="option-icon">└─</div>
                              <div className="option-content">
                                <h4 className="option-title-small">{subblock}</h4>
                                <p className="option-description">
                                  {subblockQuestions.length} preguntas
                                </p>
                              </div>
                            </button>
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

        {/* Back button */}
        <button className="back-button" onClick={() => navigate('/')}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}
