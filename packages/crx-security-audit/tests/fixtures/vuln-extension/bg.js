// Critical
eval('console.log("test")');

// High - XSS
document.getElementById('app').innerHTML = userInput;

// High - Storage
localStorage.setItem('token', 'secret123');

// Medium - CSP
const script = document.createElement('script');
script.src = 'javascript:alert(1)';
