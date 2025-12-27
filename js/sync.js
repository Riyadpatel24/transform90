// Email Sync System using localStorage + Cloud Backup
const SyncSystem = (() => {
  const SYNC_KEY = 'transform90_sync_email';
  const LAST_SYNC_KEY = 'transform90_last_sync';
  const BACKUP_KEY_PREFIX = 'transform90_backup_';

  // Get sync email
  const getSyncEmail = () => {
    return localStorage.getItem(SYNC_KEY);
  };

  // Set sync email
  const setSyncEmail = (email) => {
    localStorage.setItem(SYNC_KEY, email);
  };

  // Generate backup code for manual sync
  const generateBackupCode = (data) => {
    const compressed = btoa(JSON.stringify(data));
    return compressed;
  };

  // Restore from backup code
  const restoreFromBackupCode = (code) => {
    try {
      const data = JSON.parse(atob(code));
      return data;
    } catch (e) {
      return null;
    }
  };

  // Save to cloud (simulated - uses localStorage with email as key)
  const saveToCloud = async (email, data) => {
    try {
      // In production, this would call your backend API
      const cloudKey = BACKUP_KEY_PREFIX + btoa(email);
      localStorage.setItem(cloudKey, JSON.stringify(data));
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // Load from cloud
  const loadFromCloud = async (email) => {
    try {
      const cloudKey = BACKUP_KEY_PREFIX + btoa(email);
      const data = localStorage.getItem(cloudKey);
      if (data) {
        return { success: true, data: JSON.parse(data) };
      }
      return { success: false, error: 'No backup found' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // Get last sync time
  const getLastSyncTime = () => {
    const time = localStorage.getItem(LAST_SYNC_KEY);
    return time ? parseInt(time) : null;
  };

  // Auto-sync (call this periodically)
  const autoSync = async (data) => {
    const email = getSyncEmail();
    if (!email) return;
    
    const lastSync = getLastSyncTime();
    const now = Date.now();
    
    // Sync every 5 minutes
    if (!lastSync || now - lastSync > 5 * 60 * 1000) {
      await saveToCloud(email, data);
    }
  };

  return {
    getSyncEmail,
    setSyncEmail,
    generateBackupCode,
    restoreFromBackupCode,
    saveToCloud,
    loadFromCloud,
    getLastSyncTime,
    autoSync
  };
})();

// Sync UI Component
const SyncSettings = ({ currentData, onDataRestore }) => {
  const [email, setEmail] = React.useState(SyncSystem.getSyncEmail() || '');
  const [showBackup, setShowBackup] = React.useState(false);
  const [showRestore, setShowRestore] = React.useState(false);
  const [backupCode, setBackupCode] = React.useState('');
  const [restoreCode, setRestoreCode] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSetupSync = async () => {
    if (!email || !email.includes('@')) {
      setMessage('Please enter a valid email');
      return;
    }
    
    SyncSystem.setSyncEmail(email);
    const result = await SyncSystem.saveToCloud(email, currentData);
    
    if (result.success) {
      setMessage('✅ Sync enabled! Your data is backed up.');
    } else {
      setMessage('❌ Sync failed: ' + result.error);
    }
  };

  const handleBackupNow = async () => {
    const email = SyncSystem.getSyncEmail();
    if (!email) {
      setMessage('Please set up sync first');
      return;
    }

    const result = await SyncSystem.saveToCloud(email, currentData);
    if (result.success) {
      setMessage('✅ Backup saved!');
    } else {
      setMessage('❌ Backup failed');
    }
  };

  const handleGenerateCode = () => {
    const code = SyncSystem.generateBackupCode(currentData);
    setBackupCode(code);
    setShowBackup(true);
  };

  const handleRestoreFromCode = () => {
    const data = SyncSystem.restoreFromBackupCode(restoreCode);
    if (data) {
      onDataRestore(data);
      setMessage('✅ Data restored successfully!');
      setShowRestore(false);
      setRestoreCode('');
    } else {
      setMessage('❌ Invalid backup code');
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!email) {
      setMessage('Please enter your sync email');
      return;
    }

    const result = await SyncSystem.loadFromCloud(email);
    if (result.success) {
      onDataRestore(result.data);
      setMessage('✅ Data restored from cloud!');
    } else {
      setMessage('❌ No backup found for this email');
    }
  };

  const lastSync = SyncSystem.getLastSyncTime();

  return (
    <div className="space-y-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>☁️</span> Cloud Sync
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-white/70 text-sm block mb-2">Sync Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
            />
          </div>

          <button
            onClick={handleSetupSync}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all"
          >
            {SyncSystem.getSyncEmail() ? 'Update Sync Email' : 'Enable Sync'}
          </button>

          {lastSync && (
            <p className="text-white/60 text-xs text-center">
              Last synced: {new Date(lastSync).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>💾</span> Manual Backup
        </h3>

        <div className="space-y-3">
          <button
            onClick={handleGenerateCode}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all"
          >
            Generate Backup Code
          </button>

          {showBackup && (
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-white/70 text-xs mb-2">Save this code somewhere safe:</p>
              <textarea
                value={backupCode}
                readOnly
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs font-mono h-32 resize-none"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(backupCode);
                  setMessage('✅ Copied to clipboard!');
                }}
                className="w-full mt-2 bg-green-500 text-white text-sm py-2 rounded-lg hover:bg-green-600 transition-all"
              >
                Copy Code
              </button>
            </div>
          )}

          <button
            onClick={() => setShowRestore(!showRestore)}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all"
          >
            Restore from Code
          </button>

          {showRestore && (
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-white/70 text-xs mb-2">Paste your backup code:</p>
              <textarea
                value={restoreCode}
                onChange={(e) => setRestoreCode(e.target.value)}
                placeholder="Paste backup code here..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs font-mono h-32 resize-none"
              />
              <button
                onClick={handleRestoreFromCode}
                className="w-full mt-2 bg-orange-500 text-white text-sm py-2 rounded-lg hover:bg-orange-600 transition-all"
              >
                Restore Data
              </button>
            </div>
          )}
        </div>
      </div>

      {SyncSystem.getSyncEmail() && (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <span>🔄</span> Restore from Cloud
          </h3>
          <button
            onClick={handleRestoreFromCloud}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-all"
          >
            Restore from Cloud
          </button>
        </div>
      )}

      {message && (
        <div className={`rounded-xl p-4 text-center ${
          message.includes('✅') ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'
        }`}>
          <p className="text-white text-sm">{message}</p>
        </div>
      )}
    </div>
  );
};
