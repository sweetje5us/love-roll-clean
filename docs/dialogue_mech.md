### Структура сцены
```json
{
  "id": "scene_id",
  "chapterId": chapter_id,
  "location": "location_id",
  "background": "background_id",
  "characters": [
    {
      "id": "character_id",
      "position": "center", //right, left (если в сцене более 1 персонажа)
      "name": "character_name"
    }
  ],
  "dialogue": [
    {
      "speaker": "character_id",
      "text": "Текст диалога",
      "emotion": "emotion_id"
    },
     {
      "speaker": "character_id",
      "text": "Текст диалога",
      "emotion": "emotion_id"
    }
  ],
  "choices": [
    {
        "id": "id_choice_scene",
      "text": "Текст ответа",
      "nextScene": "scene132",
      "important": false, // true если проверяем выбор где-то в сцене
      "value": "choice_value", // если проверяем значение важного выбора
       "description": "", // описание важного выбора
      "consequences": [""], // описание важного выбора
      "effects": { // эффекты варианта, могут изменять отношения или добавлять предметы, или и то и другое
        "items": {
        },
        "relationships": {
        }
      },
      "id": "scene_id" // переход к следующей сцене
    }
  ]
}
```
###
```json
```
  
  
  ## Пример важного выбора:
  ```json
  "choices": [
    {
      "id": "id_choice_scene",
      "text": "Пойти в класс",
      "nextScene": "scene11",
      "important": true,
      "value": "choice_value",
      "description": "",
      "consequences": [""]
    
    }
  ]
 ```

## Пример проверки важного выбора
```json
"choices": [
    {
      "id": "scene152_choice1",
      "text": "",
      "nextScene": "scene153",
     "requirements": {
    "importantChoice": {
      "id_choice_scene": "choice_value"
    }
  },
      "effects": {
        "relationships": {
          "student": 3
        }
      }
    },
    {
      "id": "scene152_choice2",
      "text": "",
      "nextScene": "scene171",
     "requirements": {
    "importantChoice": {
      "choice_maria": "choice_value"
    }
  },
      "effects": {
        "relationships": {
          "student": -15
        }
      }
    },
     {
      "id": "scene152_choice3",
      "text": "Ты что-то хотела?",
      "nextScene": "scene171",
      
      "effects": {
        "relationships": {
          "npc_id": 0
        }
      }
    }
  ]
```

### Примеры изменения отношений
```json
"effects": {
        "relationships": {
          "npc_id": -15
        }
      }
"effects": {
        "relationships": {
          "npc_id": 15
        }
      }
"effects": {
        "relationships": {
          "npc_id": 0
        }
      }
```


### Пример получения предмета от NPC
```json
 "effects": {
        "items": {
          "add": [
            "item_id"
          ]
        }      
      },
```
### Эффект передачи предмета NPC
```json
"requiredItem": "item_id",
      "effects": {
        "items": {
          "remove": [
            "item_id"
          ]
        },
        "relationships": {
          "npc_id": 10
        }
      },
```
### Пример проверки характеристики [коварство]
```json
  "choices": [
    {
      "id": "scene93_choice1",
      "text": "[Коварство] Попытаться обмануть Николая",
      "diceCheck": {
        "stat": "cunning",
        "difficulty": 15,
        "description": "Попытка обмануть Николая, сказав что знаешь систему",
        "results": {
          "critical_success": "scene98",
          "success": "scene97",
          "failure": "scene100",
          "critical_failure": "scene95"
        }
      },
      "nextScene": "scene95"
    },
    {
      "id": "scene93_choice2",
      "text": "Честно признаться, что не знаешь систему",
      "nextScene": "scene96"
    }
  ]
```
### Пример использования питомца в диалоге
```json
 "dialogue": [
    {
      "speaker": "anna",
      "text": "О, это [PET_NAME]! Какой милый питомец!",
      "emotion": "happy"
    },
    {
      "speaker": "anna",
      "text": "Я [PET_REACTION] от него!",
      "emotion": "happy"
    },
    {
      "speaker": "anna",
      "text": "У него есть способность: [PET_ABILITY]",
      "emotion": "normal"
    }
  ]
```
### Проверка на питомца со способностью улучшения отношений
```json
    {
      "id": "scene133_choice3",
      "text": "Предложить Анне поиграть с питомцем",
      "nextScene": "scene134",
      "specialInteraction": "pet_play"
    }
```

