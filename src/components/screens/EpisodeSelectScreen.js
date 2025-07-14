import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreen } from '../../contexts/ScreenContext';
import EpisodeCard from '../ui/EpisodeCard';
import EpisodeModal from '../ui/EpisodeModal';
import { loadAllEpisodeConfigs, searchEpisodes, filterEpisodesByType } from '../../utils/episodeUtils';
import { getEpisodeSave, isEpisodeCompleted } from '../../utils/saveUtils';
import './EpisodeSelectScreen.css';

const EpisodeSelectScreen = ({ onBack }) => {
  const { navigateTo, getNavigationParams } = useScreen();
  const [episodesData, setEpisodesData] = useState(null);
  const [filteredEpisodes, setFilteredEpisodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [modalEpisode, setModalEpisode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Загружаем конфигурации эпизодов из их папок
    const loadData = async () => {
      const episodes = await loadAllEpisodeConfigs();
      if (episodes && episodes.length > 0) {
        // Добавляем информацию о завершении и сохранениях для каждого эпизода
        const episodesWithStatus = episodes.map(episode => {
          const isCompleted = isEpisodeCompleted(episode.id);
          const hasSave = getEpisodeSave(episode.id) !== null;
          
          return {
            ...episode,
            completed: isCompleted,
            hasSave: hasSave
          };
        });

        setEpisodesData({
          episodes: episodesWithStatus.reduce((acc, episode) => {
            acc[episode.id] = episode;
            return acc;
          }, {}),
          types: {
            tutorial: { name: 'Обучение', color: '#4ade80', icon: 'fas fa-graduation-cap' },
            romance: { name: 'Романтика', color: '#ec4899', icon: 'fas fa-heart' },
            mystery: { name: 'Детектив', color: '#8b5cf6', icon: 'fas fa-search' },
            detective: { name: 'Детектив', color: '#8b5cf6', icon: 'fas fa-search' }
          },
          ageRatings: {
            '0+': { name: '0+', color: '#22c55e' },
            '12+': { name: '12+', color: '#f59e0b' },
            '16+': { name: '16+', color: '#ef4444' }
          }
        });
        setFilteredEpisodes(episodesWithStatus);
      } else {
        // Fallback данные
        const fallbackEpisode = {
          id: 'tutorial',
          name: 'Обучение',
          description: 'Познакомьтесь с основами игры',
          preview: `${process.env.PUBLIC_URL}/sprites/episodes/locations/school/school_building.png`,
          type: 'tutorial',
          ageRating: '0+',
          duration: '15-20 минут',
          unlocked: true,
          completed: isEpisodeCompleted('tutorial'),
          hasSave: getEpisodeSave('tutorial') !== null
        };

        setEpisodesData({
          episodes: {
            tutorial: fallbackEpisode
          },
          types: {
            tutorial: { name: 'Обучение', color: '#4ade80', icon: 'fas fa-graduation-cap' },
            detective: { name: 'Детектив', color: '#8b5cf6', icon: 'fas fa-search' }
          },
          ageRatings: {
            '0+': { name: '0+', color: '#22c55e' }
          }
        });
        setFilteredEpisodes([fallbackEpisode]);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!episodesData) return;

    let filtered = Object.values(episodesData.episodes);

    // Поиск
    if (searchQuery.trim()) {
      filtered = searchEpisodes(filtered, searchQuery);
    }

    // Фильтр по типу
    if (selectedType !== 'all') {
      filtered = filterEpisodesByType(filtered, selectedType);
    }

    // Фильтр по возрасту
    if (selectedAge !== 'all') {
      filtered = filtered.filter(episode => episode.ageRating === selectedAge);
    }

    // Фильтр по статусу завершения
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(episode => {
        switch (selectedStatus) {
          case 'available':
            return episode.unlocked && !episode.completed;
          case 'completed':
            return episode.completed;
          case 'new':
            return episode.unlocked && !episode.completed && !episode.hasSave;
          default:
            return true;
        }
      });
    }

    setFilteredEpisodes(filtered);
  }, [episodesData, searchQuery, selectedType, selectedAge, selectedStatus]);

  const handleOpenModal = (episode) => {
    setModalEpisode(episode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalEpisode(null);
  };

  const handleStartEpisode = (episodeId, chapterId) => {
    console.log('Запуск эпизода:', episodeId, 'Глава:', chapterId);
    
    // Получаем characterId из параметров навигации
    const navigationParams = getNavigationParams();
    const characterId = navigationParams.characterId;
    
    console.log('EpisodeSelectScreen - Параметры навигации:', navigationParams);
    console.log('EpisodeSelectScreen - characterId:', characterId);
    
    // Переходим к экрану игры с параметрами эпизода и персонажа
    navigateTo('GAME', {
      episodeId: episodeId,
      chapterId: chapterId,
      characterId: characterId
    }, 'slide');
    
    handleCloseModal();
  };

  if (!episodesData) {
    return (
      <div className="episode-select-screen">
        <div className="episode-container">
          <div className="loading">Загрузка эпизодов...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="episode-select-screen">
      <div className="episode-container">
      {/* Заголовок */}
      <div className="episode-header">
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Выберите эпизод</h1>
      </div>

      {/* Поиск и фильтры */}
      <div className="episode-filters">
        {/* Поиск */}
        <div className="search-container">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Поиск эпизодов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Фильтры */}
        <div className="filter-container">
          {/* Фильтр по типу */}
          <div className="filter-group">
            <label>Тип сюжета:</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
            >
              <option value="all">Все типы</option>
              {Object.entries(episodesData.types).map(([key, type]) => (
                <option key={key} value={key}>{type.name}</option>
              ))}
            </select>
          </div>

          {/* Фильтр по возрасту */}
          <div className="filter-group">
            <label>Возраст:</label>
            <select 
              value={selectedAge} 
              onChange={(e) => setSelectedAge(e.target.value)}
              className="filter-select"
            >
              <option value="all">Все возрасты</option>
              {Object.entries(episodesData.ageRatings).map(([key, age]) => (
                <option key={key} value={key}>{age.name}</option>
              ))}
            </select>
          </div>

          {/* Фильтр по статусу */}
          <div className="filter-group">
            <label>Статус:</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Все эпизоды</option>
              <option value="new">Новые</option>
              <option value="available">Доступные</option>
              <option value="completed">Завершенные</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список эпизодов */}
      <div className="episodes-container">
        <div className="episodes-list">
          <AnimatePresence>
            {filteredEpisodes.length > 0 ? (
              filteredEpisodes.map((episode, index) => (
                <motion.div
                  key={episode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                                     <EpisodeCard
                     episode={episode}
                     episodeData={episodesData}
                     types={episodesData.types}
                     ageRatings={episodesData.ageRatings}
                     onOpenModal={handleOpenModal}
                   />
                </motion.div>
              ))
            ) : (
              <motion.div 
                className="no-episodes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <i className="fas fa-search"></i>
                <p>Эпизоды не найдены</p>
                <span>Попробуйте изменить фильтры или поисковый запрос</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Модальное окно */}
      <EpisodeModal
        episode={modalEpisode}
        episodeData={episodesData}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStartEpisode={handleStartEpisode}
      />
      </div>
    </div>
  );
};

export default EpisodeSelectScreen;
