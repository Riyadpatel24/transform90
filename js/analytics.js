// Analytics System
const AnalyticsSystem = (() => {
  // Calculate success rate
  const getSuccessRate = (weeklyData) => {
    if (weeklyData.length === 0) return 0;
    const completed = weeklyData.filter(d => d.completed).length;
    return Math.round((completed / weeklyData.length) * 100);
  };

  // Get best streak
  const getBestStreak = (weeklyData) => {
    let currentStreak = 0;
    let bestStreak = 0;
    
    weeklyData.forEach(day => {
      if (day.completed) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return bestStreak;
  };

  // Get habit completion rates
  const getHabitStats = (weeklyData) => {
    const stats = {};
    const taskNames = {
      workout: '💪 Workout',
      gameDev: '🎮 Game Dev',
      reading: '📚 Reading',
      vanTime: '🚐 Van Time',
      sleep: '😴 Sleep',
      waterIntake: '💧 Water',
      meditation: '🧘 Meditation',
      earlyWake: '⏰ Early Wake',
      skillLearning: '💻 Skill Learning',
      socialSkills: '💬 Social'
    };

    Object.keys(taskNames).forEach(task => {
      const total = weeklyData.filter(d => d.tasks && d.tasks[task] !== undefined).length;
      const completed = weeklyData.filter(d => d.tasks && d.tasks[task] === true).length;
      
      if (total > 0) {
        stats[task] = {
          name: taskNames[task],
          rate: Math.round((completed / total) * 100),
          completed,
          total
        };
      }
    });

    return stats;
  };

  // Get weekly breakdown
  const getWeeklyBreakdown = (weeklyData) => {
    const weeks = [];
    for (let i = 0; i < weeklyData.length; i += 7) {
      const weekData = weeklyData.slice(i, i + 7);
      const completed = weekData.filter(d => d.completed).length;
      weeks.push({
        week: Math.floor(i / 7) + 1,
        completed,
        total: weekData.length,
        rate: weekData.length > 0 ? Math.round((completed / weekData.length) * 100) : 0
      });
    }
    return weeks;
  };

  // Get best/worst days
  const getBestWorstDays = (weeklyData) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStats = {};
    
    dayNames.forEach((name, idx) => {
      dayStats[idx] = { name, completed: 0, total: 0 };
    });

    weeklyData.forEach(day => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      dayStats[dayOfWeek].total++;
      if (day.completed) dayStats[dayOfWeek].completed++;
    });

    const stats = Object.values(dayStats)
      .filter(d => d.total > 0)
      .map(d => ({
        ...d,
        rate: Math.round((d.completed / d.total) * 100)
      }))
      .sort((a, b) => b.rate - a.rate);

    return {
      best: stats[0] || null,
      worst: stats[stats.length - 1] || null
    };
  };

  // Predict level up date
  const predictLevelUp = (currentDay, level, perfectDaysAtLevel, levels) => {
    const currentLevel = levels[level];
    if (!currentLevel.unlockAt) return null;
    
    const daysNeeded = currentLevel.unlockAt - perfectDaysAtLevel;
    const predictedDay = currentDay + daysNeeded;
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysNeeded);
    
    return {
      daysNeeded,
      predictedDay,
      predictedDate: predictedDate.toLocaleDateString()
    };
  };

  return {
    getSuccessRate,
    getBestStreak,
    getHabitStats,
    getWeeklyBreakdown,
    getBestWorstDays,
    predictLevelUp
  };
})();

// Analytics Dashboard Component
const AnalyticsDashboard = ({ weeklyData, currentDay, level, perfectDaysAtLevel, levels }) => {
  const [activeTab, setActiveTab] = React.useState('overview');

  const successRate = AnalyticsSystem.getSuccessRate(weeklyData);
  const bestStreak = AnalyticsSystem.getBestStreak(weeklyData);
  const habitStats = AnalyticsSystem.getHabitStats(weeklyData);
  const weeklyBreakdown = AnalyticsSystem.getWeeklyBreakdown(weeklyData);
  const { best, worst } = AnalyticsSystem.getBestWorstDays(weeklyData);
  const prediction = AnalyticsSystem.predictLevelUp(currentDay, level, perfectDaysAtLevel, levels);

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'habits', label: '✅ Habits', icon: '✅' },
    { id: 'trends', label: '📈 Trends', icon: '📈' },
    { id: 'insights', label: '💡 Insights', icon: '💡' }
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white text-purple-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
              <div className="text-4xl font-bold text-white mb-1">{successRate}%</div>
              <div className="text-white/60 text-sm">Success Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
              <div className="text-4xl font-bold text-white mb-1">{bestStreak}</div>
              <div className="text-white/60 text-sm">Best Streak</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
              <div className="text-4xl font-bold text-white mb-1">{weeklyData.length}</div>
              <div className="text-white/60 text-sm">Total Days</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
              <div className="text-4xl font-bold text-white mb-1">{weeklyData.filter(d => d.completed).length}</div>
              <div className="text-white/60 text-sm">Perfect Days</div>
            </div>
          </div>

          {prediction && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-5 border-2 border-yellow-500/50">
              <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                <span>🎯</span> Next Level Prediction
              </h3>
              <p className="text-white/80 text-sm mb-2">
                At your current pace, you'll reach <span className="font-bold text-yellow-400">Level {level + 1}</span> in:
              </p>
              <div className="text-3xl font-bold text-white mb-1">{prediction.daysNeeded} days</div>
              <p className="text-white/60 text-xs">Expected: {prediction.predictedDate}</p>
            </div>
          )}
        </div>
      )}

      {/* Habits Tab */}
      {activeTab === 'habits' && (
        <div className="space-y-3">
          {Object.entries(habitStats)
            .sort((a, b) => b[1].rate - a[1].rate)
            .map(([key, stat]) => (
              <div key={key} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-semibold">{stat.name}</span>
                  <span className="text-white/60 text-sm">{stat.completed}/{stat.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      stat.rate >= 80 ? 'bg-green-500' :
                      stat.rate >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${stat.rate}%` }}
                  ></div>
                </div>
                <div className="text-right mt-1">
                  <span className={`text-sm font-bold ${
                    stat.rate >= 80 ? 'text-green-400' :
                    stat.rate >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {stat.rate}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
            <h3 className="text-white font-bold text-lg mb-4">Weekly Performance</h3>
            <div className="space-y-3">
              {weeklyBreakdown.map(week => (
                <div key={week.week}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/70 text-sm">Week {week.week}</span>
                    <span className="text-white/60 text-sm">{week.completed}/{week.total}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${week.rate}%` }}
                    ></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-white text-xs font-semibold">{week.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {best && worst && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-4 border-2 border-green-500/50">
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-white font-bold mb-1">Best Day</div>
                <div className="text-white text-2xl font-bold">{best.name}</div>
                <div className="text-green-300 text-sm">{best.rate}% success</div>
              </div>
              <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl p-4 border-2 border-red-500/50">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="text-white font-bold mb-1">Focus On</div>
                <div className="text-white text-2xl font-bold">{worst.name}</div>
                <div className="text-red-300 text-sm">{worst.rate}% success</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <span>💡</span> AI Insights
            </h3>
            <div className="space-y-3">
              {successRate >= 80 && (
                <div className="bg-green-500/20 rounded-xl p-3 border border-green-500/50">
                  <p className="text-green-200 text-sm">
                    🎉 <span className="font-bold">Outstanding!</span> You're crushing it with {successRate}% success rate. Keep this momentum!
                  </p>
                </div>
              )}
              
              {successRate < 50 && (
                <div className="bg-orange-500/20 rounded-xl p-3 border border-orange-500/50">
                  <p className="text-orange-200 text-sm">
                    💪 <span className="font-bold">Room for Growth:</span> Your {successRate}% success rate shows potential. Focus on consistency!
                  </p>
                </div>
              )}

              {best && worst && best.rate - worst.rate > 30 && (
                <div className="bg-blue-500/20 rounded-xl p-3 border border-blue-500/50">
                  <p className="text-blue-200 text-sm">
                    📊 <span className="font-bold">Pattern Detected:</span> You excel on {best.name}s ({best.rate}%) but struggle on {worst.name}s ({worst.rate}%). Plan ahead for {worst.name}s!
                  </p>
                </div>
              )}

              {bestStreak >= 7 && (
                <div className="bg-purple-500/20 rounded-xl p-3 border border-purple-500/50">
                  <p className="text-purple-200 text-sm">
                    🔥 <span className="font-bold">Streak Master!</span> Your best streak is {bestStreak} days. That's serious discipline!
                  </p>
                </div>
              )}

              {Object.entries(habitStats).some(([k, v]) => v.rate === 100) && (
                <div className="bg-yellow-500/20 rounded-xl p-3 border border-yellow-500/50">
                  <p className="text-yellow-200 text-sm">
                    ⭐ <span className="font-bold">Perfect Habits:</span> You've maintained 100% on some habits. That's dedication!
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-5 border border-purple-400/30">
            <h3 className="text-white font-bold text-lg mb-3">📈 Progress Summary</h3>
            <div className="space-y-2 text-white/80 text-sm">
              <p>• You've completed <span className="font-bold text-white">{weeklyData.filter(d => d.completed).length}</span> perfect days</p>
              <p>• Your average success rate is <span className="font-bold text-white">{successRate}%</span></p>
              <p>• Best performing habit: <span className="font-bold text-white">{Object.entries(habitStats).sort((a,b) => b[1].rate - a[1].rate)[0]?.[1].name || 'N/A'}</span></p>
              <p>• You're currently on Level <span className="font-bold text-white">{level}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};