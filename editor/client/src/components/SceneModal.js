import React, { useState, useEffect } from 'react';
import './SceneManager.css';

const API_BASE_URL = 'http://localhost:3001/api';

const SceneModal = ({ 
  scene, 
  episodeId, 
  chapterId, 
  initialSceneId, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    id: '',
    chapterId: chapterId || '',
    name: '',
    background: '',
    characters: [],
    dialogue: [],
    choices: []
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [episodeCharacters, setEpisodeCharacters] = useState([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);

  // Загружаем персонажей эпизода
  useEffect(() => {
    if (episodeId) {
      loadEpisodeCharacters();
    }
  }, [episodeId]);

  const loadEpisodeCharacters = async () => {
    if (!episodeId) return;
    
    try {
      setLoadingCharacters(true);
      const response = await fetch(`${API_BASE_URL}/episodes/${episodeId}/characters`);
      if (response.ok) {
        const characters = await response.json();
        setEpisodeCharacters(characters);
      } else {
        console.error('Ошибка загрузки персонажей эпизода');
        setEpisodeCharacters([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки персонажей эпизода:', error);
      setEpisodeCharacters([]);
    } finally {
      setLoadingCharacters(false);
    }
  };

  // Обновляем данные формы при изменении сцены
  useEffect(() => {
    if (scene) {
      // Извлекаем только имя файла из полного пути к фону
      let backgroundName = scene.background || '';
      if (backgroundName.startsWith('sprites/episodes/locations/')) {
        const parts = backgroundName.split('/');
        backgroundName = parts[parts.length - 1]; // Берем последнюю часть пути (имя файла)
      }
      
      const newFormData = {
        id: scene.id || '',
        chapterId: scene.chapterId || chapterId || '',
        name: scene.name || '',
        background: backgroundName,
        characters: scene.characters || [],
        dialogue: scene.dialogue || [],
        choices: scene.choices || []
      };
      setFormData(newFormData);
    } else {
      const newFormData = {
        id: initialSceneId || '',
        chapterId: chapterId || '',
        name: '',
        background: '',
        characters: [],
        dialogue: [],
        choices: []
      };
      setFormData(newFormData);
    }
  }, [scene, chapterId, initialSceneId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = cleanDataForSave(formData, episodeId);
    onSave(cleanedData);
  };

  // Функции для работы с персонажами
  const addCharacter = () => {
    if (formData.characters.length < 3) {
      const newCharacter = { id: '', position: 'center', name: '' };
      setFormData(prev => ({
        ...prev,
        characters: [...prev.characters, newCharacter]
      }));
    }
  };

  const removeCharacter = (index) => {
    setFormData({
      ...formData,
      characters: formData.characters.filter((_, i) => i !== index)
    });
  };

  const updateCharacter = (index, field, value) => {
    setFormData(prev => {
      const newCharacters = [...prev.characters];
      newCharacters[index] = { ...newCharacters[index], [field]: value };
      return { ...prev, characters: newCharacters };
    });
  };

  // Функции для работы с диалогами
  const addDialogue = () => {
    setFormData(prev => ({
      ...prev,
      dialogue: [...prev.dialogue, { speaker: 'narrator', text: '', emotion: 'normal' }]
    }));
  };

  const removeDialogue = (index) => {
    setFormData({
      ...formData,
      dialogue: formData.dialogue.filter((_, i) => i !== index)
    });
  };

  const updateDialogue = (index, field, value) => {
    setFormData(prev => {
      const newDialogue = [...prev.dialogue];
      newDialogue[index] = { ...newDialogue[index], [field]: value };
      return { ...prev, dialogue: newDialogue };
    });
  };

  // Функции для работы с вариантами выбора
  const addChoice = () => {
    setFormData(prev => {
      const choiceIndex = prev.choices.length + 1;
      const choiceId = formData.id ? `${formData.id}_choice${choiceIndex}` : `choice${choiceIndex}`;
      
      return {
        ...prev,
        choices: [...prev.choices, {
          id: choiceId,
          text: '',
          nextScene: '',
          important: false,
          value: '',
          description: '',
          consequences: [''],
          effects: { items: {}, relationships: {} },
          diceCheck: null,
          specialInteraction: '',
          requiredItem: '',
          conditions: {},
          requirements: {
            importantChoice: {},
            relationship: {},
            item: ''
          }
        }]
      };
    });
  };

  const removeChoice = (index) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index)
    }));
  };

  const updateChoice = (index, field, value) => {
    setFormData(prev => {
      const newChoices = [...prev.choices];
      newChoices[index] = { ...newChoices[index], [field]: value };
      return { ...prev, choices: newChoices };
    });
  };

  const updateDiceCheck = (choiceIndex, field, value) => {
    setFormData(prev => {
      const newChoices = [...prev.choices];
      if (!newChoices[choiceIndex].diceCheck) {
        newChoices[choiceIndex].diceCheck = {
          stat: '',
          difficulty: 0,
          results: {}
        };
      }
      newChoices[choiceIndex].diceCheck[field] = value;
      return { ...prev, choices: newChoices };
    });
  };

  const updateEffects = (choiceIndex, type, target, value) => {
    setFormData(prev => {
      const newChoices = [...prev.choices];
      if (!newChoices[choiceIndex].effects) {
        newChoices[choiceIndex].effects = { items: {}, relationships: {} };
      }
      if (!newChoices[choiceIndex].effects[type]) {
        newChoices[choiceIndex].effects[type] = {};
      }
      newChoices[choiceIndex].effects[type][target] = value;
      return { ...prev, choices: newChoices };
    });
  };

  const updateRequirements = (choiceIndex, type, field, value) => {
    setFormData(prev => {
      const newChoices = [...prev.choices];
      if (!newChoices[choiceIndex].requirements) {
        newChoices[choiceIndex].requirements = {
          importantChoice: {},
          relationship: {},
          item: ''
        };
      }
      if (type === 'importantChoice') {
        // Если значение null или пустая строка, устанавливаем null
        newChoices[choiceIndex].requirements.importantChoice[field] = (value === null || value === '') ? null : value;
      } else if (type === 'relationship') {
        if (!newChoices[choiceIndex].requirements.relationship[field]) {
          newChoices[choiceIndex].requirements.relationship[field] = {};
        }
        newChoices[choiceIndex].requirements.relationship[field] = value;
      } else {
        newChoices[choiceIndex].requirements[type] = value;
      }
      return { ...prev, choices: newChoices };
    });
  };

  // Функция для очистки данных перед сохранением
  const cleanDataForSave = (data, episodeId) => {
    const cleaned = { ...data };
    
    // Автоматически формируем путь к фону
    if (cleaned.background && cleaned.background.trim() !== '') {
      // Если путь уже полный (содержит sprites/), оставляем как есть
      if (!cleaned.background.startsWith('sprites/')) {
        // Иначе формируем полный путь для эпизода
        cleaned.background = `sprites/episodes/locations/${episodeId}/${cleaned.background}`;
      }
    }
    
    // Очищаем пустые диалоги
    if (cleaned.dialogue) {
      cleaned.dialogue = cleaned.dialogue.filter(d => d.text.trim() !== '');
    }
    
    // Очищаем пустые выборы
    if (cleaned.choices) {
      cleaned.choices = cleaned.choices.filter(c => c.text.trim() !== '');
      
      // Генерируем ID для выборов, если они пустые
      cleaned.choices = cleaned.choices.map((choice, index) => {
        const updatedChoice = { ...choice };
        if (!updatedChoice.id || updatedChoice.id.trim() === '') {
          updatedChoice.id = data.id ? `${data.id}_choice${index + 1}` : `choice${index + 1}`;
        }
        
        // Очищаем пустые требования
        if (updatedChoice.requirements) {
          // Для важных выборов сохраняем записи с null значениями (они нужны для логики "использовать один раз")
          if (updatedChoice.requirements.importantChoice && Object.keys(updatedChoice.requirements.importantChoice).length === 0) {
            delete updatedChoice.requirements.importantChoice;
          }
          if (Object.keys(updatedChoice.requirements.relationship || {}).length === 0) {
            delete updatedChoice.requirements.relationship;
          }
          if (!updatedChoice.requirements.item || updatedChoice.requirements.item.trim() === '') {
            delete updatedChoice.requirements.item;
          }
          if (Object.keys(updatedChoice.requirements).length === 0) {
            delete updatedChoice.requirements;
          }
        }
        
        // Очищаем пустые эффекты
        if (updatedChoice.effects) {
          if (Object.keys(updatedChoice.effects.items || {}).length === 0) {
            delete updatedChoice.effects.items;
          }
          if (Object.keys(updatedChoice.effects.relationships || {}).length === 0) {
            delete updatedChoice.effects.relationships;
          }
          if (Object.keys(updatedChoice.effects).length === 0) {
            delete updatedChoice.effects;
          }
        }
        
        return updatedChoice;
      });
    }
    
    return cleaned;
  };

  return (
    <div className="modal-overlay">
      <div className="modal large-modal">
        <div className="modal-header">
          <h2>{scene ? 'Редактирование сцены' : 'Создание новой сцены'}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-tabs">
            <button
              type="button"
              className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              Основное
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`}
              onClick={() => setActiveTab('characters')}
            >
              Персонажи
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'dialogue' ? 'active' : ''}`}
              onClick={() => setActiveTab('dialogue')}
            >
              Диалоги
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'choices' ? 'active' : ''}`}
              onClick={() => setActiveTab('choices')}
            >
              Выборы
            </button>
          </div>

          {activeTab === 'basic' && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label>ID сцены:</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="scene1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Название:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Название сцены"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Фон:</label>
                <input
                  type="text"
                  value={formData.background}
                  onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                  placeholder="mansion_inside.png (только имя файла)"
                />
                {formData.background && (
                  <small className="form-help">
                    Полный путь: sprites/episodes/locations/{episodeId}/{formData.background}
                  </small>
                )}
                {formData.background && !formData.background.match(/\.(png|jpg|jpeg|gif|webp)$/i) && (
                  <small className="form-help" style={{ color: '#ef4444' }}>
                    Рекомендуется указать расширение файла (.png, .jpg, .jpeg, .gif, .webp)
                  </small>
                )}
              </div>
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="form-section">
              <h3>Персонажи в сцене (максимум 3)</h3>
              
              {loadingCharacters && (
                <div className="loading-message">
                  <p>Загрузка персонажей эпизода...</p>
                </div>
              )}
              
              {formData.characters.map((character, index) => (
                <div key={index} className="character-item">
                  <div className="character-header">
                    <h4>Персонаж {index + 1}</h4>
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeCharacter(index)}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Персонаж:</label>
                      <select
                        value={character.id}
                        onChange={(e) => {
                          const selectedCharacter = episodeCharacters.find(c => c.id === e.target.value);
                          updateCharacter(index, 'id', e.target.value);
                          updateCharacter(index, 'name', selectedCharacter ? selectedCharacter.name : '');
                        }}
                        disabled={loadingCharacters}
                      >
                        <option value="">{loadingCharacters ? 'Загрузка...' : 'Выберите персонажа'}</option>
                        {episodeCharacters.map(char => (
                          <option key={char.id} value={char.id}>
                            {char.name} ({char.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Позиция:</label>
                      <select
                        value={character.position}
                        onChange={(e) => updateCharacter(index, 'position', e.target.value)}
                      >
                        <option value="left">Слева</option>
                        <option value="center">По центру</option>
                        <option value="right">Справа</option>
                      </select>
                    </div>
                  </div>
                  
                  {character.id && (
                    <div className="character-info">
                      {episodeCharacters.find(c => c.id === character.id) && (
                        <>
                          <p><strong>Имя:</strong> {episodeCharacters.find(c => c.id === character.id).name}</p>
                          <p><strong>Роль:</strong> {episodeCharacters.find(c => c.id === character.id).role || 'Не указана'}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {formData.characters.length < 3 && (
                <button type="button" className="button secondary" onClick={addCharacter}>
                  Добавить персонажа
                </button>
              )}
            </div>
          )}

          {activeTab === 'dialogue' && (
            <div className="form-section">
              <h3>Диалоги</h3>
              
              {formData.dialogue.map((dialogue, index) => (
                <div key={index} className="dialogue-item">
                  <div className="dialogue-header">
                    <h4>Диалог {index + 1}</h4>
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeDialogue(index)}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Говорящий:</label>
                      <select
                        value={dialogue.speaker}
                        onChange={(e) => updateDialogue(index, 'speaker', e.target.value)}
                      >
                        <option value="narrator">Рассказчик</option>
                        <option value="player">Игрок</option>
                        {episodeCharacters.map(char => (
                          <option key={char.id} value={char.id}>
                            {char.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Эмоция:</label>
                      <select
                        value={dialogue.emotion}
                        onChange={(e) => updateDialogue(index, 'emotion', e.target.value)}
                      >
                        <option value="normal">Обычная</option>
                        <option value="happy">Радость</option>
                        <option value="sad">Грусть</option>
                        <option value="angry">Гнев</option>
                        <option value="surprised">Удивление</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Текст:</label>
                    <textarea
                      value={dialogue.text}
                      onChange={(e) => updateDialogue(index, 'text', e.target.value)}
                      placeholder="Текст диалога"
                      rows="3"
                    />
                  </div>
                </div>
              ))}
              
              <button type="button" className="button secondary" onClick={addDialogue}>
                Добавить диалог
              </button>
            </div>
          )}

          {activeTab === 'choices' && (
            <div className="form-section">
              <h3>Варианты выбора</h3>
              
              {formData.choices.map((choice, index) => (
                <div key={index} className="choice-item">
                  <div className="choice-header">
                    <h4>Выбор {index + 1}</h4>
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeChoice(index)}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>ID выбора:</label>
                      <input
                        type="text"
                        value={choice.id}
                        onChange={(e) => updateChoice(index, 'id', e.target.value)}
                        placeholder="choice1"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Следующая сцена:</label>
                      <input
                        type="text"
                        value={choice.nextScene}
                        onChange={(e) => updateChoice(index, 'nextScene', e.target.value)}
                        placeholder="scene2"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Текст выбора:</label>
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) => updateChoice(index, 'text', e.target.value)}
                      placeholder="Текст варианта выбора"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={choice.important}
                          onChange={(e) => updateChoice(index, 'important', e.target.checked)}
                        />
                        Важный выбор
                      </label>
                    </div>
                  </div>
                  
                  {choice.important && (
                    <div className="form-row">
                      <div className="form-group">
                        <label>Значение:</label>
                        <input
                          type="text"
                          value={choice.value}
                          onChange={(e) => updateChoice(index, 'value', e.target.value)}
                          placeholder="choice_value"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Описание:</label>
                        <input
                          type="text"
                          value={choice.description}
                          onChange={(e) => updateChoice(index, 'description', e.target.value)}
                          placeholder="Описание важного выбора"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="mechanics-section">
                    <h5>Проверка костей</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Характеристика:</label>
                        <select
                          value={choice.diceCheck?.stat || ''}
                          onChange={(e) => updateDiceCheck(index, 'stat', e.target.value)}
                        >
                          <option value="">Нет проверки</option>
                          <option value="charisma">Харизма</option>
                          <option value="coldness">Холод</option>
                          <option value="sensitivity">Чувствительность</option>
                          <option value="determination">Решительность</option>
                          <option value="cunning">Коварство</option>
                          <option value="intelligence">Интеллект</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Сложность:</label>
                        <input
                          type="number"
                          value={choice.diceCheck?.difficulty || 0}
                          onChange={(e) => updateDiceCheck(index, 'difficulty', parseInt(e.target.value))}
                          min="0"
                          max="20"
                        />
                      </div>
                    </div>
                    
                    {choice.diceCheck?.stat && (
                      <div className="dice-results">
                        <h6>Результаты проверки:</h6>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Критический успех:</label>
                            <input
                              type="text"
                              value={choice.diceCheck.results?.critical_success || ''}
                              onChange={(e) => updateDiceCheck(index, 'results', {
                                ...choice.diceCheck.results,
                                critical_success: e.target.value
                              })}
                              placeholder="ID сцены"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Успех:</label>
                            <input
                              type="text"
                              value={choice.diceCheck.results?.success || ''}
                              onChange={(e) => updateDiceCheck(index, 'results', {
                                ...choice.diceCheck.results,
                                success: e.target.value
                              })}
                              placeholder="ID сцены"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Провал:</label>
                            <input
                              type="text"
                              value={choice.diceCheck.results?.failure || ''}
                              onChange={(e) => updateDiceCheck(index, 'results', {
                                ...choice.diceCheck.results,
                                failure: e.target.value
                              })}
                              placeholder="ID сцены"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Критический провал:</label>
                            <input
                              type="text"
                              value={choice.diceCheck.results?.critical_failure || ''}
                              onChange={(e) => updateDiceCheck(index, 'results', {
                                ...choice.diceCheck.results,
                                critical_failure: e.target.value
                              })}
                              placeholder="ID сцены"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mechanics-section">
                    <h5>Требования доступности</h5>
                    
                    <div className="requirements-section">
                      <h6>Важный выбор</h6>
                      <small className="form-help">
                        Оставьте поле "Значение" пустым для установки null (вариант доступен только один раз)
                      </small>
                      
                      {(choice.requirements?.importantChoice ? Object.entries(choice.requirements.importantChoice) : []).map(([choiceId, choiceValue], reqIndex) => (
                        <div key={reqIndex} className="important-choice-item">
                          <div className="form-row">
                            <div className="form-group">
                              <label>ID выбора:</label>
                              <input
                                type="text"
                                placeholder="id_choice_scene"
                                value={choiceId}
                                onChange={(e) => {
                                  const newChoiceId = e.target.value.trim();
                                  if (newChoiceId) {
                                    // Обновляем ключ, сохраняя значение
                                    const newImportantChoice = { ...choice.requirements.importantChoice };
                                    delete newImportantChoice[choiceId];
                                    newImportantChoice[newChoiceId] = choiceValue;
                                    setFormData(prev => {
                                      const newChoices = [...prev.choices];
                                      newChoices[index] = {
                                        ...newChoices[index],
                                        requirements: {
                                          ...newChoices[index].requirements,
                                          importantChoice: newImportantChoice
                                        }
                                      };
                                      return { ...prev, choices: newChoices };
                                    });
                                  }
                                }}
                              />
                            </div>
                            
                            <div className="form-group">
                              <label>Значение:</label>
                              <input
                                type="text"
                                placeholder="choice_value (оставьте пустым для null)"
                                value={choiceValue === null ? '' : choiceValue}
                                onChange={(e) => {
                                  const value = e.target.value.trim() === '' ? null : e.target.value;
                                  updateRequirements(index, 'importantChoice', choiceId, value);
                                }}
                              />
                            </div>
                            
                            <div className="form-group">
                              <button
                                type="button"
                                className="remove-button small"
                                onClick={() => {
                                  const newImportantChoice = { ...choice.requirements.importantChoice };
                                  delete newImportantChoice[choiceId];
                                  setFormData(prev => {
                                    const newChoices = [...prev.choices];
                                    newChoices[index] = {
                                      ...newChoices[index],
                                      requirements: {
                                        ...newChoices[index].requirements,
                                        importantChoice: newImportantChoice
                                      }
                                    };
                                    return { ...prev, choices: newChoices };
                                  });
                                }}
                                title="Удалить условие"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(!choice.requirements?.importantChoice || Object.keys(choice.requirements.importantChoice).length < 5) && (
                        <button
                          type="button"
                          className="button secondary small"
                          onClick={() => {
                            const newImportantChoice = { ...choice.requirements?.importantChoice } || {};
                            const newChoiceId = `choice_${Object.keys(newImportantChoice).length + 1}`;
                            newImportantChoice[newChoiceId] = null;
                            setFormData(prev => {
                              const newChoices = [...prev.choices];
                              newChoices[index] = {
                                ...newChoices[index],
                                requirements: {
                                  ...newChoices[index].requirements,
                                  importantChoice: newImportantChoice
                                }
                              };
                              return { ...prev, choices: newChoices };
                            });
                          }}
                        >
                          + Добавить условие важного выбора
                        </button>
                      )}
                    </div>
                    
                    <div className="requirements-section">
                      <h6>Уровень отношений</h6>
                      <div className="form-row">
                        <div className="form-group">
                          <label>ID персонажа:</label>
                          <select
                            value={Object.keys(choice.requirements?.relationship || {}).join(',')}
                            onChange={(e) => {
                              const characterId = e.target.value;
                              if (characterId) {
                                updateRequirements(index, 'relationship', characterId, { min: 0, max: 0 });
                              }
                            }}
                          >
                            <option value="">Выберите персонажа</option>
                            {episodeCharacters.map(char => (
                              <option key={char.id} value={char.id}>
                                {char.name} ({char.id})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label>Минимум:</label>
                          <input
                            type="number"
                            placeholder="-100"
                            value={Object.values(choice.requirements?.relationship || {}).map(r => r.min).join(',')}
                            onChange={(e) => {
                              const characterId = Object.keys(choice.requirements?.relationship || {})[0];
                              if (characterId) {
                                const current = choice.requirements.relationship[characterId] || {};
                                updateRequirements(index, 'relationship', characterId, {
                                  ...current,
                                  min: parseInt(e.target.value) || 0
                                });
                              }
                            }}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Максимум:</label>
                          <input
                            type="number"
                            placeholder="100"
                            value={Object.values(choice.requirements?.relationship || {}).map(r => r.max).join(',')}
                            onChange={(e) => {
                              const characterId = Object.keys(choice.requirements?.relationship || {})[0];
                              if (characterId) {
                                const current = choice.requirements.relationship[characterId] || {};
                                updateRequirements(index, 'relationship', characterId, {
                                  ...current,
                                  max: parseInt(e.target.value) || 0
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="requirements-section">
                      <h6>Требуемый предмет</h6>
                      <div className="form-group">
                        <label>ID предмета:</label>
                        <input
                          type="text"
                          value={choice.requirements?.item || ''}
                          onChange={(e) => updateRequirements(index, 'item', '', e.target.value)}
                          placeholder="apple"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mechanics-section">
                    <h5>Эффекты</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Предметы:</label>
                        <input
                          type="text"
                          placeholder="ID предмета: количество"
                          onChange={(e) => {
                            const [itemId, amount] = e.target.value.split(':');
                            if (itemId && amount) {
                              updateEffects(index, 'items', itemId, parseInt(amount));
                            }
                          }}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Отношения:</label>
                        <input
                          type="text"
                          placeholder="ID персонажа: изменение"
                          onChange={(e) => {
                            const [characterId, change] = e.target.value.split(':');
                            if (characterId && change) {
                              updateEffects(index, 'relationships', characterId, parseInt(change));
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button type="button" className="button secondary" onClick={addChoice}>
                Добавить выбор
              </button>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className="button">
              {scene ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SceneModal; 