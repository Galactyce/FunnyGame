'use strict';

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function quizUser() {
  console.log('\n📚 FunnyGame Code Understanding Quiz\n');
  console.log('Answer questions about how the game code works.\n');

  const quizzes = [
    {
      name: 'Vector2 arithmetic and normalization',
      questions: [
        {
          q: 'What is the length of a Vector2(3, 4)?',
          correct: '5',
          hint: 'Use the Pythagorean theorem: sqrt(3² + 4²)'
        },
        {
          q: 'What does normalizing a vector do?',
          correct: ['makes it length 1', 'unit vector', 'changes length to 1'],
          hint: 'A normalized vector has the same direction but length of 1'
        },
        {
          q: 'If you add Vector2(3, 4) and Vector2(1, 2), what is the result?',
          correct: '4,6',
          hint: 'Add each component separately: (3+1, 4+2)'
        }
      ]
    },
    {
      name: 'Rectangle intersection and contains logic',
      questions: [
        {
          q: 'Does a rectangle at (0,0) with size (10,10) contain point (5,5)?',
          correct: ['yes', 'true', 'y'],
          hint: 'Point (5,5) is within the bounds [0,10) x [0,10)'
        },
        {
          q: 'What does rect.intersection() return for two overlapping rectangles?',
          correct: ['the overlapping area', 'overlap', 'intersection rectangle'],
          hint: 'It returns the shared region between two rectangles'
        },
        {
          q: 'Do rectangles at (0,0,10,10) and (20,20,4,4) intersect?',
          correct: ['no', 'false', 'n'],
          hint: 'They are too far apart; no overlap'
        }
      ]
    },
    {
      name: 'GameObjectList and GameObject hierarchy',
      questions: [
        {
          q: 'When you add a GameObject to a GameObjectList, what property gets set?',
          correct: 'parent',
          hint: 'The parent property links the object back to its container'
        },
        {
          q: 'What does the find() method on GameObjectList do?',
          correct: ['searches by id', 'finds by id', 'looks up object'],
          hint: 'It searches for an object by its ID within the list'
        },
        {
          q: 'When you remove a GameObject, what happens to its parent property?',
          correct: ['set to null', 'null', 'removed'],
          hint: 'The parent link is cleared when the object is removed'
        }
      ]
    },
    {
      name: 'GameStateManager transitions',
      questions: [
        {
          q: 'What does GameStateManager.add() return?',
          correct: ['the index', 'state id', 'a number'],
          hint: 'It returns the index of the newly added state'
        },
        {
          q: 'What method switches between game states?',
          correct: 'switchTo',
          hint: 'You call switchTo(index) to change the active state'
        },
        {
          q: 'Can a GameStateManager have multiple active states at once?',
          correct: ['no', 'false', 'n'],
          hint: 'Only one state is active at a time'
        }
      ]
    },
    {
      name: 'Keyboard state management',
      questions: [
        {
          q: 'What is the difference between Keyboard.down() and Keyboard.pressed()?',
          correct: ['down is continuous, pressed is once per frame', 'down vs one frame', 'continuous vs frame'],
          hint: 'down() is true while held; pressed() is true only once when first pressed'
        },
        {
          q: 'What does Keyboard.reset() do?',
          correct: ['clears pressed state', 'resets pressed', 'clears frame input'],
          hint: 'It clears the pressed state to prepare for the next frame'
        },
        {
          q: 'What object maps key names to key codes?',
          correct: 'Keys',
          hint: 'Keys.space, Keys.left, etc. are defined here'
        }
      ]
    },
    {
      name: 'LevelDataManager setup registration',
      questions: [
        {
          q: 'What does LevelDataManager.register() do?',
          correct: ['associates a function with a level and room', 'links setup to level', 'registers room setup'],
          hint: 'It maps a level/room pair to a setup callback function'
        },
        {
          q: 'What happens if you call startLevel() for a level with no registered setup?',
          correct: ['uses default setup', 'calls default', 'fallback'],
          hint: 'The default setup function is used as a fallback'
        },
        {
          q: 'What context object is passed to a room setup function?',
          correct: ['level context', 'the level object', 'setup context'],
          hint: 'It contains the level, player, enemies, and other room data'
        }
      ]
    },
    {
      name: 'Animation frame timing',
      questions: [
        {
          q: 'What does the frameTime property control?',
          correct: ['duration per frame', 'frame duration', 'timing'],
          hint: 'frameTime is how long each animation frame displays'
        },
        {
          q: 'What does the looping property mean?',
          correct: ['animation repeats', 'loops after end', 'cycles'],
          hint: 'If true, animation restarts after the last frame'
        },
        {
          q: 'What is currentFrame used for?',
          correct: ['tracks which frame is playing', 'frame index', 'current index'],
          hint: 'It tracks which frame of the sprite sheet is active'
        }
      ]
    },
    {
      name: 'Label text sizing',
      questions: [
        {
          q: 'How does Label measure text size?',
          correct: ['creates a temporary dom element', 'dom element', 'temporary div'],
          hint: 'It creates a hidden div to measure rendered text dimensions'
        },
        {
          q: 'What does resetText() restore?',
          correct: ['original contents', 'text', 'starting text'],
          hint: 'It reverts the label text to its original value'
        },
        {
          q: 'What properties does a Label track for sizing?',
          correct: ['width and height', 'size', 'dimensions'],
          hint: 'width and height are derived from the text render size'
        }
      ]
    },
    {
      name: 'Tile hitbox generation',
      questions: [
        {
          q: 'What is the hitboxType for normal tiles?',
          correct: 'solid',
          hint: 'Normal tiles are solid obstacles'
        },
        {
          q: 'What is the hitboxType for spike tiles?',
          correct: 'hurt',
          hint: 'Spikes damage the player on contact'
        },
        {
          q: 'Why do spike tiles have smaller hitboxes?',
          correct: ['for precise collision', 'accuracy', 'finer control'],
          hint: 'Smaller hitboxes make spike collisions feel more precise'
        }
      ]
    },
    {
      name: 'Level travel points',
      questions: [
        {
          q: 'What does collectTravelPoints() do?',
          correct: ['gathers all travel points from rooms', 'collects points', 'gathers points'],
          hint: 'It iterates through rooms and collects all travel point objects'
        },
        {
          q: 'What does linkTravelPoints() do?',
          correct: ['connects points with matching ids', 'links by id', 'connects endpoints'],
          hint: 'It sets up bidirectional connections between travel points'
        },
        {
          q: 'What does getNextTravelPointId() return?',
          correct: ['next available id', 'unused id', 'new id'],
          hint: 'It returns an ID not yet used by any travel point'
        }
      ]
    },
    {
      name: 'Player wall jump mechanics',
      questions: [
        {
          q: 'What does isJumpPressed() check?',
          correct: ['if a jump key is held down', 'jump input', 'keyboard input'],
          hint: 'It checks if the space bar or another jump key is pressed'
        },
        {
          q: 'When wall jumping left, what direction does the player get pushed?',
          correct: ['right', 'away from wall', 'opposite'],
          hint: 'Wall jumping off the left side pushes you right'
        },
        {
          q: 'What does previousWallJumpDir track?',
          correct: ['which wall you jumped from', 'wall direction', 'last wall side'],
          hint: 'It remembers if you jumped off the left or right wall'
        }
      ]
    },
    {
      name: 'WorldSettings level management',
      questions: [
        {
          q: 'What does normalizeLevelData() do?',
          correct: ['converts old formats to nested rooms structure', 'standardizes data', 'canonical format'],
          hint: 'It ensures all level data follows the same modern schema with rooms[] array'
        },
        {
          q: 'What property keeps backward compatibility with legacy level code?',
          correct: 'room',
          hint: 'The room property aliases to rooms[activeRoomIndex] for old code'
        },
        {
          q: 'Where does WorldSettings store level data persistently?',
          correct: ['localStorage', 'local storage', 'browser storage'],
          hint: 'Levels are serialized to localStorage.levels'
        }
      ]
    },
    {
      name: 'WorldSettings room data',
      questions: [
        {
          q: 'What does createDefaultRoomData() include?',
          correct: ['tiles, enemies, cameraBounds, playerSpawnPos', 'room template', 'default structure'],
          hint: 'It returns a complete empty room with default values'
        },
        {
          q: 'How many rooms can a single level have?',
          correct: ['multiple', 'many', 'unlimited'],
          hint: 'Levels store an array of rooms for multi-room levels'
        },
        {
          q: 'What does syncRoomAlias() set?',
          correct: ['room property to current active room', 'aliases active room', 'room reference'],
          hint: 'It links levelData.room to levelData.rooms[activeRoomIndex]'
        }
      ]
    },
    {
      name: 'PlayingState initialization',
      questions: [
        {
          q: 'What components does PlayingState create on initialization?',
          correct: ['player, enemies, projectiles, music, buttons', 'game objects', 'gameplay entities'],
          hint: 'It sets up all the major gameplay systems'
        },
        {
          q: 'What is the tileFields property in PlayingState?',
          correct: ['list of tile grids', 'tile storage', 'tile collection'],
          hint: 'tileFields is a GameObjectList holding multiple tile layers'
        },
        {
          q: 'What does the EnemyManager do in PlayingState?',
          correct: ['tracks and manages all enemies', 'enemy collection', 'enemy handler'],
          hint: 'It provides a centralized manager for spawned enemies'
        }
      ]
    },
    {
      name: 'PlayingState room management',
      questions: [
        {
          q: 'What does syncRoomVisibility() accomplish?',
          correct: ['shows only active room, hides others', 'visibility toggle', 'show active room'],
          hint: 'It ensures only the current room is rendered'
        },
        {
          q: 'What happens in switchRoom()?',
          correct: ['loads new room, places player, recenters camera', 'room transition', 'change rooms'],
          hint: 'It performs a complete room transition including player placement'
        },
        {
          q: 'What does placeCameraAtSpawn() do?',
          correct: ['centers camera on player at spawn', 'camera positioning', 'center camera'],
          hint: 'It positions the camera to follow the player from the spawn point'
        }
      ]
    },
    {
      name: 'PlayingState travel mechanics',
      questions: [
        {
          q: 'What does findActiveTravelTileHit() return?',
          correct: ['travel tile player is touching', 'travel tile', 'overlapping tile'],
          hint: 'It detects if the player is standing on a travel-point tile'
        },
        {
          q: 'How does handleTravelTileTeleport() prevent repeated triggering?',
          correct: ['uses blockedTravelPointTileID', 'blocking flag', 'tracks tile id'],
          hint: 'It remembers the tile ID to avoid repeated triggers'
        },
        {
          q: 'What does findGroundSpawnPosition() do?',
          correct: ['searches downward for solid tile to spawn on', 'ground detection', 'snap to ground'],
          hint: 'It probes downward to place the player on solid ground after teleport'
        }
      ]
    }
  ];

  let totalScore = 0;
  let totalQuestions = 0;

  for (const quiz of quizzes) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Test: ${quiz.name}`);
    console.log(`${'='.repeat(60)}\n`);

    let quizScore = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      totalQuestions++;

      let answered = false;
      while (!answered) {
        const userAnswer = await question(`Q${i + 1}. ${q.q}\n> `);
        const normalized = userAnswer.toLowerCase().trim();

        const correctAnswers = Array.isArray(q.correct)
          ? q.correct.map(a => a.toLowerCase())
          : [q.correct.toLowerCase()];

        const isCorrect = correctAnswers.some(correct =>
          normalized === correct || normalized.includes(correct) || correct.includes(normalized)
        );

        if (isCorrect) {
          console.log('✅ Correct!\n');
          quizScore++;
          totalScore++;
          answered = true;
        } else {
          const retry = await question(`❌ Incorrect. Hint: ${q.hint}\nRetry? (yes/no): `);
          if (retry.toLowerCase() !== 'yes' && retry.toLowerCase() !== 'y') {
            console.log(`📌 Correct answer: ${Array.isArray(q.correct) ? q.correct[0] : q.correct}\n`);
            answered = true;
          }
        }
      }
    }

    console.log(`\n✓ Quiz score for this test: ${quizScore}/${quiz.questions.length}`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Final Score: ${totalScore}/${totalQuestions}`);
  const percentage = Math.round((totalScore / totalQuestions) * 100);
  console.log(`Percentage: ${percentage}%`);

  if (percentage === 100) {
    console.log('🏆 Perfect score! You understand the code really well!');
  } else if (percentage >= 80) {
    console.log('🎯 Great job! You have a solid understanding.');
  } else if (percentage >= 60) {
    console.log('📚 Good effort! Review the game code for deeper understanding.');
  } else {
    console.log('💪 Keep studying! Read through the code more carefully.');
  }

  console.log(`${'='.repeat(60)}\n`);

  rl.close();
}

quizUser().catch(console.error);
