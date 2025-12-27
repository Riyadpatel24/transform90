
const { useState, useEffect } = React;

window.storage = {
  get: async (key) => {
    const val = localStorage.getItem(key);
    return val ? { key, value: val } : null;
  },
  set: async (key, value) => {
    localStorage.setItem(key, value);
    return { key, value };
  }
};

const MainApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    if (!AuthSystem.hasPIN() || AuthSystem.hasValidSession()) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return <App />;
};

const App = () => {

  const [currentDay, setCurrentDay] = useState(1);
  const [level, setLevel] = useState(1);
  const [dailyTasks, setDailyTasks] = useState({
    workout: false, gameDev: false, sleep: false, vanTime: false,
    reading: false, waterIntake: false, earlyWake: false, meditation: false,
    skillLearning: false, socialSkills: false
  });
  const [gameDevTask, setGameDevTask] = useState('');
  const [vanActivity, setVanActivity] = useState('');
  const [currentBook, setCurrentBook] = useState('Atomic Habits');
  const [bookProgress, setBookProgress] = useState({
    'Atomic Habits': 0, 'Ikigai': 0, 'The Art of Being Alone': 0,
    'The Psychology of Money': 0, 'Rich Dad Poor Dad': 0,
    'Ego is the Enemy': 0, 'Zero to One': 0
  });
  const [reflection, setReflection] = useState({ win: '', improve: '' });
  const [weeklyData, setWeeklyData] = useState([]);
  const [streak, setStreak] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showBookComplete, setShowBookComplete] = useState(false);
  const [perfectDaysAtLevel, setPerfectDaysAtLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const books = ['Atomic Habits', 'Ikigai', 'The Art of Being Alone', 
                 'The Psychology of Money', 'Rich Dad Poor Dad', 
                 'Ego is the Enemy', 'Zero to One'];

  const levels = {
    1: {
      name: "FOUNDATION", wakeTime: "5:30 AM",
      tasks: { weekday: ['workout', 'vanTime', 'gameDev', 'sleep'],
               weekend: ['workout', 'reading', 'gameDev', 'sleep'] },
      requirements: "7 perfect days", unlockAt: 7,
      description: "Build the basics. Prove you can show up.",
      workout: "10 push-ups • 20 squats • 30s plank", newHabits: []
    },
    2: {
      name: "MOMENTUM", wakeTime: "5:30 AM",
      tasks: { weekday: ['workout', 'vanTime', 'gameDev', 'sleep', 'reading', 'waterIntake'],
               weekend: ['workout', 'reading', 'gameDev', 'sleep', 'waterIntake'] },
      requirements: "10 perfect days", unlockAt: 10,
      description: "Mental + physical health habits.",
      workout: "15 push-ups • 30 squats • 45s plank • 20 lunges",
      newHabits: [
        { name: "Daily Reading", icon: "📚", detail: "15min from your books" },
        { name: "2L Water", icon: "💧", detail: "Track daily" }
      ]
    },
    3: {
      name: "DISCIPLINE", wakeTime: "4:45 AM",
      tasks: { weekday: ['earlyWake', 'workout', 'vanTime', 'gameDev', 'sleep', 'reading', 'waterIntake', 'meditation'],
               weekend: ['earlyWake', 'workout', 'reading', 'gameDev', 'sleep', 'waterIntake', 'meditation'] },
      requirements: "14 perfect days", unlockAt: 14,
      description: "Early riser. Mental clarity.",
      workout: "20 push-ups • 40 squats • 60s plank • 30 lunges • 15 burpees",
      newHabits: [
        { name: "4:45 AM Wake", icon: "⏰", detail: "No snooze" },
        { name: "10min Meditation", icon: "🧘", detail: "Mental clarity" }
      ]
    },
    4: {
      name: "UNSTOPPABLE", wakeTime: "4:45 AM",
      tasks: { weekday: ['earlyWake', 'workout', 'vanTime', 'gameDev', 'sleep', 'reading', 'waterIntake', 'meditation', 'skillLearning', 'socialSkills'],
               weekend: ['earlyWake', 'workout', 'reading', 'gameDev', 'sleep', 'waterIntake', 'meditation', 'skillLearning', 'socialSkills'] },
      requirements: "Maintain for 90 days", unlockAt: null,
      description: "Full transformation.",
      workout: "3 sets: 15 push-ups • 30 squats • 60s plank",
      newHabits: [
        { name: "Extra Skill", icon: "💻", detail: "2nd learning block" },
        { name: "Social Practice", icon: "💬", detail: "Conversation" }
      ]
    }
  };

  const messages = [
    "Discipline is doing it even when you don't feel like it.",
    "Your future self is watching. Make her proud.",
    "Small daily wins = massive transformation.",
    "You said you wouldn't quit. Prove it.",
    "Consistency over perfection. Show up today.",
    "The body you want is built in days like this.",
    "One focused hour at a time.",
    "Your vision requires daily action.",
    "Doubt kills more dreams than failure ever will.",
    "You're becoming her. One day at a time."
  ];

  const getDailyMessage = () => messages[currentDay % messages.length];
  const isWeekday = () => new Date().getDay() >= 1 && new Date().getDay() <= 4;
  const getActiveTasks = () => levels[level].tasks[isWeekday() ? 'weekday' : 'weekend'];

  const checkLevelUp = () => {
    const currentLevel = levels[level];
    if (currentLevel.unlockAt && perfectDaysAtLevel >= currentLevel.unlockAt) {
      setShowLevelUp(true);
      setLevel(prev => prev + 1);
      setPerfectDaysAtLevel(0);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      const allData = {
        currentDay, level, streak, weeklyData, consecutiveMisses,
        perfectDaysAtLevel, currentBook, bookProgress
      };
      SyncSystem.autoSync(allData);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentDay, level, streak, weeklyData, consecutiveMisses, perfectDaysAtLevel, currentBook, bookProgress]);

  const loadData = async () => {
    try {
      const data = await window.storage.get('tracker-data');
      if (data) {
        const p = JSON.parse(data.value);
        setCurrentDay(p.currentDay || 1);
        setLevel(p.level || 1);
        setStreak(p.streak || 0);
        setWeeklyData(p.weeklyData || []);
        setConsecutiveMisses(p.consecutiveMisses || 0);
        setPerfectDaysAtLevel(p.perfectDaysAtLevel || 0);
        setCurrentBook(p.currentBook || 'Atomic Habits');
        setBookProgress(p.bookProgress || bookProgress);
      }
    } catch (e) { console.log('First time'); }
  };

  const saveData = async (data) => {
    try { 
      await window.storage.set('tracker-data', JSON.stringify(data));
      SyncSystem.autoSync(data);
    }
    catch (e) { console.error('Save failed'); }
  };

  const toggleTask = (task) => setDailyTasks(prev => ({ ...prev, [task]: !prev[task] }));

  const completeDay = async () => {
    const activeTasks = getActiveTasks();
    const allDone = activeTasks.every(task => dailyTasks[task]);
    const newStreak = allDone ? streak + 1 : 0;
    const newMisses = allDone ? 0 : consecutiveMisses + 1;
    const newPerfectDays = allDone ? perfectDaysAtLevel + 1 : perfectDaysAtLevel;
    
    if (dailyTasks.reading) {
      const newProgress = { ...bookProgress };
      newProgress[currentBook] += 1;
      if (newProgress[currentBook] >= 100) {
        newProgress[currentBook] = 100;
        setShowBookComplete(true);
      }
      setBookProgress(newProgress);
    }
    
    const newWeeklyData = [...weeklyData, {
      day: currentDay, level, date: new Date().toLocaleDateString(),
      completed: allDone, tasks: { ...dailyTasks }, gameDevTask, vanActivity, reflection
    }];
    
    const newData = {
      currentDay: currentDay + 1, level, streak: newStreak, weeklyData: newWeeklyData,
      consecutiveMisses: newMisses, perfectDaysAtLevel: newPerfectDays, currentBook, bookProgress
    };
    
    await saveData(newData);
    
    setCurrentDay(prev => prev + 1);
    setStreak(newStreak);
    setWeeklyData(newWeeklyData);
    setConsecutiveMisses(newMisses);
    setPerfectDaysAtLevel(newPerfectDays);
    
    const reset = {};
    Object.keys(dailyTasks).forEach(k => reset[k] = false);
    setDailyTasks(reset);
    setGameDevTask('');
    setVanActivity('');
    setReflection({ win: '', improve: '' });

    setTimeout(() => { if (allDone) checkLevelUp(); }, 500);
    if (currentDay % 7 === 0) setTimeout(() => setShowWeeklyReview(true), 1000);
  };

  const handleDataRestore = async (restoredData) => {
    setCurrentDay(restoredData.currentDay || 1);
    setLevel(restoredData.level || 1);
    setStreak(restoredData.streak || 0);
    setWeeklyData(restoredData.weeklyData || []);
    setConsecutiveMisses(restoredData.consecutiveMisses || 0);
    setPerfectDaysAtLevel(restoredData.perfectDaysAtLevel || 0);
    setCurrentBook(restoredData.currentBook || 'Atomic Habits');
    setBookProgress(restoredData.bookProgress || bookProgress);
    
    await saveData(restoredData);
  };

  const getDaysThisWeek = () => weeklyData.slice(-7);
  const getCompletionRate = () => weeklyData.length === 0 ? 0 : Math.round((weeklyData.filter(d => d.completed).length / weeklyData.length) * 100);
  const getWeeklyStats = () => {
    const w = getDaysThisWeek();
    return {
      completed: w.filter(d => d.completed).length,
      workouts: w.filter(d => d.tasks.workout).length,
      gameDevDays: w.filter(d => d.tasks.gameDev).length
    };
  };
  const getWarningLevel = () => consecutiveMisses >= 2 ? 'danger' : consecutiveMisses === 1 ? 'warning' : streak >= 7 ? 'fire' : 'normal';

  const warningLevel = getWarningLevel();
  const currentLevel = levels[level];
  const activeTasks = getActiveTasks();
  const todayIsWeekday = isWeekday();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-2 sm:p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        
        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-6 max-w-md w-full border-2 border-purple-400 my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">⚙️ Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-white/70 hover:text-white text-2xl">
                  ✕
                </button>
              </div>
              
              <SyncSettings 
                currentData={{
                  currentDay, level, streak, weeklyData, consecutiveMisses,
                  perfectDaysAtLevel, currentBook, bookProgress
                }}
                onDataRestore={handleDataRestore}
              />

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to logout?')) {
                      AuthSystem.logout();
                      window.location.reload();
                    }
                  }}
                  className="w-full bg-red-500/20 border border-red-500 text-red-200 font-semibold py-3 rounded-xl hover:bg-red-500/30 transition-all"
                >
                  🔒 Logout
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('This will delete ALL your data. Are you absolutely sure?')) {
                      if (confirm('Last chance! This cannot be undone!')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }
                  }}
                  className="w-full bg-white/5 border border-white/20 text-white/60 text-sm py-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  🗑️ Reset All Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalytics && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-6 max-w-2xl w-full border-2 border-purple-400 my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">📊 Analytics</h2>
                <button onClick={() => setShowAnalytics(false)} className="text-white/70 hover:text-white text-2xl">
                  ✕
                </button>
              </div>
              
              <AnalyticsDashboard 
                weeklyData={weeklyData}
                currentDay={currentDay}
                level={level}
                perfectDaysAtLevel={perfectDaysAtLevel}
                levels={levels}
              />
            </div>
          </div>
        )}

        {/* Book Complete Modal */}
        {showBookComplete && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 max-w-md border-4 border-green-400 animate-bounce">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-3xl font-bold text-white mb-2">BOOK COMPLETE!</h2>
                <p className="text-xl text-green-200 font-bold">{currentBook}</p>
                <p className="text-white/80 text-sm mt-3">
                  You finished an entire book! That's knowledge most people will never have.
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <label className="text-white text-sm font-semibold">Choose your next book:</label>
                <select 
                  value={currentBook}
                  onChange={(e) => setCurrentBook(e.target.value)}
                  className="w-full bg-white/20 border border-white/40 rounded-lg px-4 py-3 text-white font-semibold"
                >
                  {books.map(book => (
                    <option key={book} value={book} className="bg-gray-900">{book}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => setShowBookComplete(false)}
                className="w-full bg-white text-green-600 font-bold py-4 rounded-xl hover:shadow-lg transition-all">
                Continue Reading Journey 📚
              </button>
            </div>
          </div>
        )}

        {/* Level Up Modal */}
        {showLevelUp && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600 rounded-3xl p-8 max-w-md border-4 border-yellow-400 animate-pulse">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-bounce">⭐</div>
                <h2 className="text-4xl font-bold text-white mb-2">LEVEL UP!</h2>
                <p className="text-2xl text-yellow-200 font-bold">LEVEL {level}: {levels[level].name}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 mb-6">
                <h3 className="text-white font-bold mb-3 text-lg">🎉 You Unlocked:</h3>
                {levels[level].newHabits.map((h, i) => (
                  <div key={i} className="text-white mb-3 flex items-start gap-2">
                    <span className="text-2xl">{h.icon}</span>
                    <div>
                      <p className="font-semibold">{h.name}</p>
                      <p className="text-white/80 text-sm">{h.detail}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-yellow-200 font-bold mb-1">⏰ New Wake Time: {levels[level].wakeTime}</p>
                  <p className="text-white/90 text-sm">💪 New Workout: {levels[level].workout}</p>
                </div>
              </div>
              <button onClick={() => setShowLevelUp(false)}
                className="w-full bg-white text-orange-600 font-bold py-4 rounded-xl hover:shadow-lg transition-all text-lg">
                LET'S GO! 🔥
              </button>
            </div>
          </div>
        )}

        {/* Weekly Review Modal */}
        {showWeeklyReview && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-md border-2 border-purple-400">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-white mb-2">Week {Math.floor(currentDay / 7)} Complete!</h2>
                <p className="text-purple-200 text-sm">Time for honest reflection</p>
              </div>
              <div className="space-y-4 mb-6">
                <div className="bg-white/10 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-2 text-sm">This Week:</h3>
                  <p className="text-white/80 text-xs">✅ {getWeeklyStats().completed} perfect days</p>
                  <p className="text-white/80 text-xs">💪 {getWeeklyStats().workouts} workouts</p>
                  <p className="text-white/80 text-xs">🎮 {getWeeklyStats().gameDevDays} game dev</p>
                  <p className="text-white/80 text-xs">⭐ Level {level}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-2 text-sm">Ask yourself:</h3>
                  <ul className="text-white/80 text-xs space-y-1">
                    <li>• Did I give my best?</li>
                    <li>• What held me back?</li>
                    <li>• What will I improve?</li>
                    <li>• Am I closer to my vision?</li>
                  </ul>
                </div>
              </div>
              <button onClick={() => setShowWeeklyReview(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl">
                Week {Math.floor(currentDay / 7) + 1} - Let's Go
              </button>
            </div>
          </div>
        )}

        {/* Warning Banners */}
        {warningLevel === 'danger' && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-2xl p-4 mb-6 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-red-400 font-bold text-lg">EMERGENCY: {consecutiveMisses} Days Missed</h3>
                <p className="text-white/90 text-sm">You said you wouldn't quit. Prove it TODAY.</p>
              </div>
            </div>
          </div>
        )}

        {warningLevel === 'warning' && (
          <div className="bg-orange-500/20 border-2 border-orange-500 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-orange-400 font-bold">Warning: 1 Day Missed</h3>
                <p className="text-white/90 text-sm">Get back on track now.</p>
              </div>
            </div>
          </div>
        )}

        {warningLevel === 'fire' && (
          <div className="bg-green-500/20 border-2 border-green-500 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <h3 className="text-green-400 font-bold text-lg">{streak} Day Streak!</h3>
                <p className="text-white/90 text-sm">Unstoppable momentum. Keep going!</p>
              </div>
            </div>
          </div>
        )}


        {/* Top Navigation */}
        <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
                Transform90
            </h1>

            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/80">
                v1.0 • Stable
            </span>
        </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAnalytics(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all font-semibold text-sm"
            >
              📊
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all font-semibold text-sm"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full font-bold text-xs">
                LEVEL {level}
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                todayIsWeekday ? 'bg-blue-500/30 text-blue-200' : 'bg-green-500/30 text-green-200'
              }`}>
                {todayIsWeekday ? '🎒 College' : '🏖️ Free'}
              </div>
            </div>
            <div className="flex items-center gap-2 text-orange-400">
              <span className="text-xl">🔥</span>
              <span className="text-xl font-bold">{streak}</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Day {currentDay}/90</h1>
          <p className="text-purple-200 text-xs mb-4">{currentLevel.name} • {currentLevel.wakeTime}</p>
          
          <div className="bg-white/5 rounded-xl p-3 mb-3">
            <div className="flex justify-between text-xs mb-2">
            <span className="text-white/70">Level Progress</span>
            <span className="text-white font-semibold">
                {perfectDaysAtLevel}/{currentLevel.unlockAt || '∞'}
                <p className="text-xs text-white/60 mt-2">
                System Status: Active • Sync OK
                </p>
            </span>
            </div>

            {currentLevel.unlockAt && (
              <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${(perfectDaysAtLevel / currentLevel.unlockAt) * 100}%` }}></div>
              </div>
            )}
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/70">Overall</span>
              <span className="text-white">{getCompletionRate()}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${(currentDay / 90) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30">
            <p className="text-white text-center text-xs italic">{getDailyMessage()}</p>
          </div>
        </div>

        {/* Current Book */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-5 mb-4 sm:mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <div>
                <h3 className="text-white font-bold text-sm">Reading</h3>
                <p className="text-white/60 text-xs">{currentBook}</p>
              </div>
            </div>
            <button onClick={() => setCurrentBook(books[(books.indexOf(currentBook) + 1) % books.length])}
              className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded-lg transition-all">
              Switch
            </button>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/70">Progress</span>
              <span className="text-white font-semibold">{bookProgress[currentBook]}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${bookProgress[currentBook]}%` }}></div>
            </div>
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-5 mb-4 sm:mb-6 border border-white/20">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            🎯 Today's Tasks <span className="text-xs text-white/50">(Core Module)</span>
            </h2>

          <p className="text-white/60 text-xs mb-4">{currentLevel.description}</p>
          
          <div className="space-y-3">
            {activeTasks.map(task => {
              const taskInfo = {
                earlyWake: { emoji: '⏰', title: '4:45 AM Wake', desc: 'No snooze', border: 'border-orange-500/50' },
                workout: { emoji: '💪', title: 'Workout', desc: currentLevel.workout },
                vanTime: { emoji: '🚐', title: 'Van Time', desc: '6:50-8:00 - TED/Study', border: 'border-cyan-500/50', hasInput: true, inputValue: vanActivity, inputChange: setVanActivity, inputPlaceholder: 'What did you do?' },
                gameDev: { emoji: '🎮', title: 'Game Dev', desc: '1 hour focused', hasInput: true, inputValue: gameDevTask, inputChange: setGameDevTask, inputPlaceholder: "Today's task?" },
                reading: { emoji: '📚', title: '15min Reading', desc: currentBook, border: 'border-blue-500/50' },
                waterIntake: { emoji: '💧', title: '2L Water', desc: 'Track all day' },
                meditation: { emoji: '🧘', title: '10min Meditation', desc: 'Morning clarity' },
                skillLearning: { emoji: '💻', title: 'Extra Skill', desc: '2nd learning block' },
                socialSkills: { emoji: '💬', title: 'Social Practice', desc: 'Conversation' },
                sleep: { emoji: '😴', title: 'Sleep 10:30 PM', desc: 'Check tomorrow morning' }
              };

              const info = taskInfo[task];
              if (!info) return null;

              return (
                <React.Fragment key={task}>
                  <div onClick={() => toggleTask(task)}
                    className={`bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all active:scale-95 ${info.border ? `border ${info.border}` : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{dailyTasks[task] ? '✅' : '⭕'}</span>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-sm">{info.emoji} {info.title}</h3>
                        <p className="text-white/60 text-xs">{info.desc}</p>
                      </div>
                    </div>
                  </div>
                  {info.hasInput && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <input type="text" value={info.inputValue}
                        onChange={(e) => info.inputChange(e.target.value)}
                        placeholder={info.inputPlaceholder}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none text-xs" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Evening Reflection */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-5 mb-4 sm:mb-6 border border-white/20">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Evening Reflection</h2>
          <div className="space-y-3">
            <div>
              <label className="text-green-400 text-xs font-semibold block mb-2">✅ One win today</label>
              <input type="text" value={reflection.win}
                onChange={(e) => setReflection(p => ({ ...p, win: e.target.value }))}
                placeholder="What did you do well?"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 sm:py-3 text-white placeholder-white/40 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="text-orange-400 text-xs font-semibold block mb-2">🎯 Improve tomorrow</label>
              <input type="text" value={reflection.improve}
                onChange={(e) => setReflection(p => ({ ...p, improve: e.target.value }))}
                placeholder="What will you do better?"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 sm:py-3 text-white placeholder-white/40 focus:outline-none text-sm" />
            </div>
          </div>
        </div>

        {/* Complete Day Button */}
        <button onClick={completeDay}
          disabled={!activeTasks.every(t => dailyTasks[t]) || !gameDevTask || !reflection.win}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mb-4 sm:mb-6">
          {activeTasks.every(t => dailyTasks[t]) && gameDevTask && reflection.win ? 
            '🎉 Complete Day' : 
            '⏳ Complete tasks first'}
        </button>

        {/* Next Level Preview */}
        {level < 4 && (
          <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-5 mb-4 sm:mb-6 border-2 border-yellow-600/50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h2 className="text-lg font-bold text-yellow-400">NEXT: Level {level + 1}</h2>
                <p className="text-white/70 text-xs">{levels[level + 1].name}</p>
              </div>
            </div>
            <p className="text-white/80 text-sm mb-3">{levels[level + 1].description}</p>
            <div className="bg-black/30 rounded-xl p-3 mb-3">
              <p className="text-white/90 text-xs font-semibold mb-2">Unlocks:</p>
              {levels[level + 1].newHabits.map((h, i) => (
                <p key={i} className="text-white/70 text-xs">• {h.name}</p>
              ))}
            </div>
            <div className="flex items-center justify-between bg-black/30 rounded-xl p-3">
              <span className="text-white/70 text-xs">Progress:</span>
              <span className="text-yellow-400 font-bold text-sm">{perfectDaysAtLevel}/{currentLevel.unlockAt}</span>
            </div>
          </div>
        )}

        {/* This Week Stats */}
        {getDaysThisWeek().length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-5 mb-4 sm:mb-6 border border-white/20">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📅</span> This Week
            </h2>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
              <div className="bg-white/5 rounded-xl p-2 text-center">
                <div className="text-lg sm:text-xl font-bold text-green-400">{getWeeklyStats().completed}</div>
                <div className="text-white/60 text-xs">Perfect</div>
              </div>
              <div className="bg-white/5 rounded-xl p-2 text-center">
                <div className="text-lg sm:text-xl font-bold text-blue-400">{getWeeklyStats().workouts}</div>
                <div className="text-white/60 text-xs">Workouts</div>
              </div>
              <div className="bg-white/5 rounded-xl p-2 text-center">
                <div className="text-lg sm:text-xl font-bold text-purple-400">{getWeeklyStats().gameDevDays}</div>
                <div className="text-white/60 text-xs">GameDev</div>
              </div>
              <div className="bg-white/5 rounded-xl p-2 text-center">
                <div className="text-lg sm:text-xl font-bold text-orange-400">{streak}</div>
                <div className="text-white/60 text-xs">Streak</div>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getDaysThisWeek().map((d, i) => (
                <div key={i} className="text-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                    d.completed ? 'bg-green-500' : 'bg-red-500/50'
                  }`}>
                    <span className="text-white text-xs font-bold">{d.day}</span>
                  </div>
                  <span className="text-white/40 text-xs">L{d.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remember Your Why */}
        <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl p-4 sm:p-5 border border-orange-400/30">
          <div className="text-center">
            <span className="text-3xl mb-3 block">📖</span>
            <p className="text-white font-semibold mb-2 text-sm">Remember Your Why</p>
            <p className="text-white/80 text-xs italic">
              "I want to be me who I vision to be. If this doesn't happen, I will never get to live the life I want."
            </p>
            <p className="text-white/60 text-xs mt-3">
              Level {level} • Day {currentDay} • Every checkbox counts
            </p>
          </div>
        </div>

      </div>
  );
};

ReactDOM.render(<MainApp />, document.getElementById('root'));