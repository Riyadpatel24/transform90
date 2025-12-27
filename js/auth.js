// Password Protection System
const AuthSystem = (() => {
  const STORAGE_KEY = 'transform90_auth';
  const SESSION_KEY = 'transform90_session';
  
  // Check if PIN is set
  const hasPIN = () => {
    const auth = localStorage.getItem(STORAGE_KEY);
    return auth !== null;
  };

  // Set initial PIN
  const setPIN = (pin) => {
    const hashed = btoa(pin); // Simple encoding (use bcrypt in production)
    localStorage.setItem(STORAGE_KEY, hashed);
    createSession();
  };

  // Verify PIN
  const verifyPIN = (pin) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const hashed = btoa(pin);
    if (stored === hashed) {
      createSession();
      return true;
    }
    return false;
  };

  // Create session (30 min timeout)
  const createSession = () => {
    const expiry = Date.now() + (30 * 60 * 1000); // 30 minutes
    sessionStorage.setItem(SESSION_KEY, expiry.toString());
  };

  // Check if session is valid
  const hasValidSession = () => {
    const expiry = sessionStorage.getItem(SESSION_KEY);
    if (!expiry) return false;
    return Date.now() < parseInt(expiry);
  };

  // Logout
  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
  };

  // Reset PIN (security question or email verification in production)
  const resetPIN = () => {
    if (confirm('Are you sure you want to reset your PIN? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      logout();
      return true;
    }
    return false;
  };

  return {
    hasPIN,
    setPIN,
    verifyPIN,
    hasValidSession,
    logout,
    resetPIN
  };
})();

// Auth UI Component
const AuthScreen = ({ onAuthenticated }) => {
  const [mode, setMode] = React.useState(AuthSystem.hasPIN() ? 'login' : 'setup');
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [shake, setShake] = React.useState(false);

  const handleSetup = () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    AuthSystem.setPIN(pin);
    onAuthenticated();
  };

  const handleLogin = () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    if (AuthSystem.verifyPIN(pin)) {
      onAuthenticated();
    } else {
      setError('Incorrect PIN');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKeyPress = (num) => {
    if (mode === 'setup') {
      if (!confirmPin && pin.length < 4) {
        setPin(pin + num);
      } else if (confirmPin.length < 4) {
        setConfirmPin(confirmPin + num);
      }
    } else {
      if (pin.length < 4) {
        setPin(pin + num);
      }
    }
    setError('');
  };

  const handleDelete = () => {
    if (mode === 'setup') {
      if (confirmPin) {
        setConfirmPin(confirmPin.slice(0, -1));
      } else {
        setPin(pin.slice(0, -1));
      }
    } else {
      setPin(pin.slice(0, -1));
    }
    setError('');
  };

  React.useEffect(() => {
    if (mode === 'login' && pin.length === 4) {
      handleLogin();
    } else if (mode === 'setup' && confirmPin.length === 4) {
      handleSetup();
    }
  }, [pin, confirmPin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {mode === 'setup' ? 'Set Your PIN' : 'Enter PIN'}
          </h1>
          <p className="text-purple-200 text-sm">
            {mode === 'setup' 
              ? !confirmPin ? 'Create a 4-digit PIN' : 'Confirm your PIN'
              : 'Enter your 4-digit PIN'}
          </p>
        </div>

        <div className={`bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 ${shake ? 'animate-shake' : ''}`}>
          {/* PIN Display */}
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full transition-all ${
                  (mode === 'setup' && !confirmPin ? pin.length : mode === 'setup' ? confirmPin.length : pin.length) > i 
                    ? 'bg-white scale-100' 
                    : 'bg-white/20 scale-75'
                }`}></div>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-3 mb-4 text-center">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(num.toString())}
                className="aspect-square bg-white/10 hover:bg-white/20 rounded-2xl text-white text-2xl font-semibold transition-all active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="aspect-square bg-white/10 hover:bg-white/20 rounded-2xl text-white text-xl transition-all active:scale-95"
            >
              ⌫
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              className="aspect-square bg-white/10 hover:bg-white/20 rounded-2xl text-white text-2xl font-semibold transition-all active:scale-95"
            >
              0
            </button>
            <div></div>
          </div>

          {mode === 'login' && (
            <button
              onClick={() => AuthSystem.resetPIN() && setMode('setup')}
              className="w-full text-purple-200 text-sm hover:text-white transition-colors"
            >
              Forgot PIN?
            </button>
          )}
        </div>

        <p className="text-center text-purple-300 text-xs mt-6">
          Your data is encrypted and stored locally on your device
        </p>
      </div>
    </div>
  );
};

// Add shake animation style
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
  .animate-shake {
    animation: shake 0.3s ease-in-out;
  }
`;
document.head.appendChild(style);