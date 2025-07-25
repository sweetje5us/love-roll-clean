import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

const SceneTreeView = ({ selectedEpisode, selectedChapter, onSceneEdit, onSceneCreate }) => {
  const [scenes, setScenes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [treeData, setTreeData] = useState({ nodes: [], connections: [] });
  const treeContainerRef = useRef(null);

  // Функция загрузки сцен
  const loadScenesForTree = async () => {
    if (!selectedEpisode || !selectedChapter) {
      setScenes([]);
      setTreeData({ nodes: [], connections: [] });
      return;
    }

    setIsLoading(true);
    try {
      // Определяем правильный путь к главе (как в App.js)
      const chapterPath = (selectedEpisode.id === 'mansion' || selectedEpisode.id === 'tutorial')
        ? `chapter${selectedChapter.id}`
        : selectedChapter.id;
      
      // Загружаем сцены через API
      console.log(`SceneTreeView: Загружаем сцены для эпизода: ${selectedEpisode.id}, главы: ${chapterPath}`);
      const response = await fetch(`${API_BASE_URL}/episodes/${selectedEpisode.id}/chapters/${chapterPath}/scenes`);
      if (response.ok) {
        const scenesData = await response.json();
        console.log(`SceneTreeView: Получено сцен: ${scenesData.length}`);
        console.log('SceneTreeView: Первые 5 сцен:', scenesData.slice(0, 5).map(s => s.id));
        setScenes(scenesData);
        
        // Строим дерево связей
        const tree = buildSceneTree(scenesData);
        setTreeData(tree);
      } else {
        console.error('SceneTreeView: Ошибка загрузки сцен');
        setScenes([]);
        setTreeData({ nodes: [], connections: [] });
      }
    } catch (error) {
      console.error('SceneTreeView: Ошибка загрузки сцен для дерева:', error);
      setScenes([]);
      setTreeData({ nodes: [], connections: [] });
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка сцен при изменении эпизода или главы
  useEffect(() => {
    loadScenesForTree();
  }, [selectedEpisode, selectedChapter]);

  // Слушаем событие обновления дерева сцен
  useEffect(() => {
    const handleRefreshSceneTree = () => {
      console.log('SceneTreeView: Получено событие обновления дерева сцен');
      loadScenesForTree();
    };

    window.addEventListener('refreshSceneTree', handleRefreshSceneTree);
    
    return () => {
      window.removeEventListener('refreshSceneTree', handleRefreshSceneTree);
    };
  }, [selectedEpisode, selectedChapter]);

  // Функция построения дерева сцен
  const buildSceneTree = (scenesData) => {
    const sceneMap = new Map();
    const connections = [];
    const existingSceneIds = new Set(scenesData.map(scene => scene.id));
    const missingScenes = new Set();
    
    // Создаем узлы для всех существующих сцен
    scenesData.forEach((scene) => {
      sceneMap.set(scene.id, {
        id: scene.id,
        name: scene.name || scene.id,
        x: 0,
        y: 0,
        level: 0,
        choices: scene.choices || [],
        exists: true
      });
    });

    // Находим связи между сценами и собираем несуществующие сцены
    scenesData.forEach(scene => {
      if (scene.choices) {
        scene.choices.forEach(choice => {
          // Обычные переходы
          if (choice.nextScene) {
            if (existingSceneIds.has(choice.nextScene)) {
              connections.push({
                from: scene.id,
                to: choice.nextScene,
                text: choice.text || 'Выбор',
                isMissing: false
              });
            } else {
              missingScenes.add(choice.nextScene);
              connections.push({
                from: scene.id,
                to: choice.nextScene,
                text: choice.text || 'Выбор',
                isMissing: true
              });
            }
          }
          
          // Проверки характеристик с множественными исходами
          if (choice.diceCheck && choice.diceCheck.results) {
            const results = choice.diceCheck.results;
            const statName = choice.diceCheck.stat;
            
            // Критический успех
            if (results.critical_success) {
              if (existingSceneIds.has(results.critical_success)) {
                connections.push({
                  from: scene.id,
                  to: results.critical_success,
                  text: `🎯 ${choice.text} (Крит. успех)`,
                  isMissing: false
                });
              } else {
                missingScenes.add(results.critical_success);
                connections.push({
                  from: scene.id,
                  to: results.critical_success,
                  text: `🎯 ${choice.text} (Крит. успех)`,
                  isMissing: true
                });
              }
            }
            
            // Успех
            if (results.success) {
              if (existingSceneIds.has(results.success)) {
                connections.push({
                  from: scene.id,
                  to: results.success,
                  text: `✅ ${choice.text} (Успех)`,
                  isMissing: false
                });
              } else {
                missingScenes.add(results.success);
                connections.push({
                  from: scene.id,
                  to: results.success,
                  text: `✅ ${choice.text} (Успех)`,
                  isMissing: true
                });
              }
            }
            
            // Провал
            if (results.failure) {
              if (existingSceneIds.has(results.failure)) {
                connections.push({
                  from: scene.id,
                  to: results.failure,
                  text: `❌ ${choice.text} (Провал)`,
                  isMissing: false
                });
              } else {
                missingScenes.add(results.failure);
                connections.push({
                  from: scene.id,
                  to: results.failure,
                  text: `❌ ${choice.text} (Провал)`,
                  isMissing: true
                });
              }
            }
            
            // Критический провал
            if (results.critical_failure) {
              if (existingSceneIds.has(results.critical_failure)) {
                connections.push({
                  from: scene.id,
                  to: results.critical_failure,
                  text: `💥 ${choice.text} (Крит. провал)`,
                  isMissing: false
                });
              } else {
                missingScenes.add(results.critical_failure);
                connections.push({
                  from: scene.id,
                  to: results.critical_failure,
                  text: `💥 ${choice.text} (Крит. провал)`,
                  isMissing: true
                });
              }
            }
          }
        });
      }
    });

    // Добавляем узлы для несуществующих сцен
    missingScenes.forEach(sceneId => {
      sceneMap.set(sceneId, {
        id: sceneId,
        name: sceneId,
        x: 0,
        y: 0,
        level: 0,
        choices: [],
        exists: false
      });
    });

    // Определяем уровни для каждого узла (BFS)
    const visited = new Set();
    const queue = [{ id: scenesData[0]?.id, level: 0 }];
    
    while (queue.length > 0) {
      const { id, level } = queue.shift();
      if (visited.has(id)) continue;
      
      visited.add(id);
      const node = sceneMap.get(id);
      if (node) {
        node.level = level;
        
        // Добавляем связанные узлы в очередь
        connections.forEach(conn => {
          if (conn.from === id && !visited.has(conn.to)) {
            queue.push({ id: conn.to, level: level + 1 });
          }
        });
      }
    }

    // Группируем узлы по уровням
    const levels = new Map();
    sceneMap.forEach(node => {
      if (!levels.has(node.level)) {
        levels.set(node.level, []);
      }
      levels.get(node.level).push(node);
    });

    // Позиционируем узлы
    const levelSpacing = 200;
    const nodeSpacing = 150;
    
    levels.forEach((nodes, level) => {
      const levelY = level * levelSpacing + 50;
      const totalWidth = (nodes.length - 1) * nodeSpacing;
      const startX = 50;
      
      nodes.forEach((node, index) => {
        node.x = startX + index * nodeSpacing;
        node.y = levelY;
      });
    });

    // Вычисляем размеры для SVG
    const nodes = Array.from(sceneMap.values());
    let maxX = 0, maxY = 0;
    
    nodes.forEach(node => {
      maxX = Math.max(maxX, node.x + 120); // 120px - ширина узла
      maxY = Math.max(maxY, node.y + 80);  // 80px - высота узла
    });
    
    // Добавляем отступы
    const svgWidth = Math.max(maxX + 50, 800);
    const svgHeight = Math.max(maxY + 50, 400);
    
    return {
      nodes: nodes,
      connections: connections,
      svgWidth: svgWidth,
      svgHeight: svgHeight
    };
  };

  // Обработчик клика по узлу
  const handleNodeClick = (node) => {
    console.log('Клик по узлу:', node);
    console.log('Узел существует:', node.exists);
    console.log('onSceneEdit:', onSceneEdit);
    console.log('onSceneCreate:', onSceneCreate);
    
    if (node.exists) {
      // Открываем редактирование существующей сцены
      console.log('Пытаемся открыть редактирование сцены:', node.id);
      if (onSceneEdit) {
        const existingScene = scenes.find(scene => scene.id === node.id);
        console.log('Найденная сцена:', existingScene);
        if (existingScene) {
          console.log('Вызываем onSceneEdit с сценой:', existingScene);
          onSceneEdit(existingScene);
        }
      }
    } else {
      // Открываем создание новой сцены с предзаполненным ID
      console.log('Пытаемся открыть создание сцены с ID:', node.id);
      if (onSceneCreate) {
        console.log('Вызываем onSceneCreate с ID:', node.id);
        onSceneCreate(node.id);
      }
    }
  };

  if (!selectedEpisode) {
    return (
      <div className="scene-tree-view">
        <div className="no-selection">
          <h2>Древо сцен</h2>
          <p>Выберите эпизод для отображения дерева сцен</p>
        </div>
      </div>
    );
  }

  if (!selectedChapter) {
    return (
      <div className="scene-tree-view">
        <div className="no-selection">
          <h2>Древо сцен</h2>
          <p>Выберите главу для отображения дерева сцен</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scene-tree-view">
      <div className="manager-header">
        <div className="header-info">
          <h2>Древо сцен</h2>
          <p className="episode-info">Эпизод: {selectedEpisode.name}</p>
          <p className="chapter-info">Глава: {selectedChapter.name}</p>
        </div>
        <div className="tree-legend">
          <div className="legend-item">
            <div className="legend-node existing"></div>
            <span>Существующие сцены</span>
          </div>
          <div className="legend-item">
            <div className="legend-node missing"></div>
            <span>Несуществующие сцены</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка дерева сцен...</p>
        </div>
      ) : (
        <div className="scene-tree-container" ref={treeContainerRef}>
          {!treeData || !treeData.nodes || treeData.nodes.length === 0 ? (
            <div className="empty-state">
              <p>Сцены не найдены</p>
              <p>Создайте сцены для отображения дерева связей</p>
            </div>
          ) : (
            <div className="tree-svg-container">
              <svg 
                className="tree-svg" 
                width={treeData.svgWidth || 800} 
                height={treeData.svgHeight || 400}
                viewBox={`0 0 ${treeData.svgWidth || 800} ${treeData.svgHeight || 400}`}
              >
                {/* Отрисовка связей */}
                {treeData.connections.map((connection, index) => {
                  const fromNode = treeData.nodes.find(n => n.id === connection.from);
                  const toNode = treeData.nodes.find(n => n.id === connection.to);
                  
                  if (fromNode && toNode) {
                    const fromX = fromNode.x + 60; // центр узла
                    const fromY = fromNode.y + 40;
                    const toX = toNode.x + 60;
                    const toY = toNode.y + 40;
                    
                    // Создаем изогнутую линию
                    const midX = (fromX + toX) / 2;
                    const midY = (fromY + toY) / 2;
                    
                    // Определяем цвет и стиль связи в зависимости от типа
                    const isDiceCheck = connection.text.includes('🎯') || connection.text.includes('✅') || 
                                      connection.text.includes('❌') || connection.text.includes('💥');
                    const isMissing = connection.isMissing;
                    
                    let strokeColor, strokeWidth, markerId;
                    if (isMissing) {
                      strokeColor = '#ef4444'; // Красный для несуществующих сцен
                      strokeWidth = '3';
                      markerId = 'arrowhead-missing';
                    } else if (isDiceCheck) {
                      strokeColor = '#2196F3';
                      strokeWidth = '3';
                      markerId = 'arrowhead-dice';
                    } else {
                      strokeColor = '#4CAF50';
                      strokeWidth = '2';
                      markerId = 'arrowhead-normal';
                    }
                    
                    return (
                      <g key={`connection-${index}`}>
                        <path
                          d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          fill="none"
                          markerEnd={`url(#${markerId})`}
                        />
                        <text
                          x={midX}
                          y={midY - 15}
                          textAnchor="middle"
                          fill="white"
                          fontSize="10"
                          className="connection-label"
                        >
                          {connection.text.length > 15 ? connection.text.substring(0, 15) + '...' : connection.text}
                        </text>
                      </g>
                    );
                  }
                  return null;
                })}
                
                {/* Стрелки для связей */}
                <defs>
                  <marker
                    id="arrowhead-normal"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#4CAF50" />
                  </marker>
                  <marker
                    id="arrowhead-dice"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#2196F3" />
                  </marker>
                  <marker
                    id="arrowhead-missing"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                  </marker>
                </defs>
              </svg>
              
              {/* Узлы дерева */}
              <div className="tree-nodes">
                {treeData.nodes && treeData.nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`tree-node ${node.exists ? 'existing' : 'missing'}`}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`
                    }}
                    onClick={() => handleNodeClick(node)}
                    title={node.exists ? `Редактировать сцену: ${node.id}` : `Создать сцену: ${node.id}`}
                  >
                    <div className="node-content">
                      <div className="node-id">{node.id}</div>
                      <div className="node-name">{node.name}</div>
                      {node.exists && node.choices.length > 0 && (
                        <div className="node-choices">
                          {node.choices.length} выборов
                          {node.choices.some(choice => choice.diceCheck) && (
                            <span className="node-dice-check">🎲</span>
                          )}
                        </div>
                      )}
                      {!node.exists && (
                        <div className="node-missing">
                          <span className="missing-icon">⚠️</span>
                          Не создана
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SceneTreeView; 