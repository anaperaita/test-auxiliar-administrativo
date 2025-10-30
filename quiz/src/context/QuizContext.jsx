import React, { createContext, useState, useEffect } from 'react';
import modulesConfig from '../data/modules.config.json';
import * as storage from '../services/storage';
import * as questionService from '../services/questionService';
import * as statsService from '../services/statsService';

// eslint-disable-next-line react-refresh/only-export-components
export const QuizContext = createContext();

/**
 * Get lazy module loaders
 * Uses Vite's glob import for lazy loading - only loads modules when needed
 * Returns a function map for dynamic imports
 */
const getModuleLoaders = () => {
  // Vite's glob import - lazy loading (no eager flag)
  return import.meta.glob('../data/*.json');
};

export const QuizProvider = ({ children }) => {
  const [availableModules, setAvailableModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loadedModules, setLoadedModules] = useState({}); // Cache for loaded module data
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true); // Initial app loading
  const [moduleLoading, setModuleLoading] = useState(false); // Module data loading

  // Load available modules metadata on startup
  useEffect(() => {
    // Just set available modules from config (no data loading yet)
    setAvailableModules(modulesConfig.modules);

    // Set default module to first available
    if (modulesConfig.modules.length > 0) {
      setSelectedModule(modulesConfig.modules[0].id);
    }

    loadData();
  }, []);

  // Load module data when selectedModule changes
  useEffect(() => {
    const loadModuleData = async () => {
      if (!selectedModule) return;

      // Check if module is already loaded in cache
      if (loadedModules[selectedModule]) {
        setQuestions(loadedModules[selectedModule].questions);
        return;
      }

      // Load module data dynamically
      setModuleLoading(true);
      try {
        const moduleLoaders = getModuleLoaders();
        const moduleInfo = availableModules.find(m => m.id === selectedModule);

        if (!moduleInfo) {
          console.error(`Module not found: ${selectedModule}`);
          setModuleLoading(false);
          return;
        }

        const modulePath = `../data/${moduleInfo.file}`;
        const loader = moduleLoaders[modulePath];

        if (!loader) {
          console.error(`Module file not found: ${moduleInfo.file}`);
          setModuleLoading(false);
          return;
        }

        // Dynamically import the module
        const moduleData = await loader();
        const questions = moduleData.default.questions;

        // Cache the loaded module
        setLoadedModules(prev => ({
          ...prev,
          [selectedModule]: { questions }
        }));

        setQuestions(questions);
      } catch (error) {
        console.error(`Error loading module ${selectedModule}:`, error);
      } finally {
        setModuleLoading(false);
      }
    };

    loadModuleData();
  }, [selectedModule, availableModules, loadedModules]);

  const loadData = () => {
    try {
      const savedStats = storage.getStats();
      const savedBookmarks = storage.getBookmarks();

      if (savedStats) {
        setStats(savedStats);
      }
      if (savedBookmarks) {
        setBookmarks(savedBookmarks);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveStatsToStorage = (newStats) => {
    const success = storage.saveStats(newStats);
    if (success) {
      setStats(newStats);
    }
  };

  const saveBookmarksToStorage = (newBookmarks) => {
    const success = storage.saveBookmarks(newBookmarks);
    if (success) {
      setBookmarks(newBookmarks);
    }
  };

  // Registrar respuesta de una pregunta
  const recordAnswer = (questionId, isCorrect) => {
    const newStats = statsService.recordAnswer(stats, questionId, isCorrect);
    saveStatsToStorage(newStats);
  };

  // Toggle bookmark
  const toggleBookmark = (questionId) => {
    let newBookmarks;
    if (bookmarks.includes(questionId)) {
      newBookmarks = bookmarks.filter(id => id !== questionId);
    } else {
      newBookmarks = [...bookmarks, questionId];
    }
    saveBookmarksToStorage(newBookmarks);
  };

  // Obtener preguntas con peso según fallos y frecuencia
  const getWeightedRandomQuestion = (excludeIds = []) => {
    return questionService.getWeightedRandomQuestion(questions, stats, excludeIds);
  };

  // Obtener preguntas incorrectas
  const getIncorrectQuestions = () => {
    return questionService.getIncorrectQuestions(questions, stats);
  };

  // Obtener preguntas marcadas
  const getBookmarkedQuestions = () => {
    return questionService.getBookmarkedQuestions(questions, bookmarks);
  };

  // Obtener preguntas por bloque (backward compatible)
  const getQuestionsByBlock = (blockName) => {
    return questionService.getQuestionsByBlock(questions, blockName);
  };

  // Obtener preguntas por superbloque
  const getQuestionsBySuperblock = (superblockName) => {
    return questionService.getQuestionsBySuperblock(questions, superblockName);
  };

  // Obtener preguntas por subbloque
  const getQuestionsBySubblock = (subblockName) => {
    return questionService.getQuestionsBySubblock(questions, subblockName);
  };

  // Calcular estadísticas globales (solo para el módulo actual)
  const getGlobalStats = () => {
    return statsService.calculateGlobalStats(questions, stats);
  };

  // Resetear estadísticas
  const resetStats = () => {
    const success = storage.resetAllData();
    if (success) {
      setStats({});
      setBookmarks([]);
    }
  };

  const value = {
    questions,
    stats,
    bookmarks,
    loading,
    moduleLoading, // New: indicates when module data is being loaded
    selectedModule,
    setSelectedModule,
    availableModules,
    recordAnswer,
    toggleBookmark,
    getWeightedRandomQuestion,
    getIncorrectQuestions,
    getBookmarkedQuestions,
    getQuestionsByBlock,
    getQuestionsBySuperblock,
    getQuestionsBySubblock,
    getGlobalStats,
    resetStats,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};
