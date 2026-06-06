========== GOOGLE AUTH INIT ==========
Query params: { callback_url: 'com.instaserve.app://auth/callback' }
Frontend callback URL: com.instaserve.app://auth/callback
Server callback URL (for Google): https://insta-serve-1-0.onrender.com/api/auth/google/callback
🌐 Request: {
  method: 'GET',
  origin: undefined,
  path: '/api/auth/google/callback',
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36'
}
========== GOOGLE CALLBACK HIT ==========
Request URL: /api/auth/google/callback?state=com.instaserve.app%253A%252F%252Fauth%252Fcallback&iss=https%3A%2F%2Faccounts.google.com&code=4%2F0AdkVLPy4Qi2AHFzhLcWO4fGpzDgf_srE-L_Suyje3ZvWmDDz1GgSfGjSWqkK_85lEMm8AA&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+openid&authuser=2&prompt=none
Query params: {
  state: 'com.instaserve.app%3A%2F%2Fauth%2Fcallback',
  iss: 'https://accounts.google.com',
  code: '4/0AdkVLPy4Qi2AHFzhLcWO4fGpzDgf_srE-L_Suyje3ZvWmDDz1GgSfGjSWqkK_85lEMm8AA',
  scope: 'email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
  authuser: '2',
  prompt: 'none'
}
Configured callback URL: https://insta-serve-1-0.onrender.com/api/auth/google/callback
✅ Google profile received
Callback URL being used: https://insta-serve-1-0.onrender.com/api/auth/google/callback
FULL GOOGLE ERROR
{
  "index": 0,
  "code": 11000,
  "keyPattern": {
    "phone": 1
  },
  "keyValue": {
    "phone": "9999999999"
  }
}
========== GOOGLE CALLBACK ==========
ERROR: MongoServerError: E11000 duplicate key error collection: test.users index: phone_1 dup key: { phone: "9999999999" }
    at /opt/render/project/src/node_modules/mongodb/lib/operations/insert.js:50:33
    at /opt/render/project/src/node_modules/mongodb/lib/operations/command.js:84:64
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5) {
  index: 0,
  code: 11000,
  keyPattern: { phone: 1 },
  keyValue: { phone: '9999999999' },
  Symbol(errorLabels): Set(0) {}
}
USER: undefined
INFO: undefined
FULL GOOGLE ERROR: MongoServerError: E11000 duplicate key error collection: test.users index: phone_1 dup key: { phone: "9999999999" }
    at /opt/render/project/src/node_modules/mongodb/lib/operations/insert.js:50:33
    at /opt/render/project/src/node_modules/mongodb/lib/operations/command.js:84:64
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5) {
  index: 0,
  code: 11000,
  keyPattern: { phone: 1 },
  keyValue: { phone: '9999999999' },
  Symbol(errorLabels): Set(0) {}
}
🌐 Request: {
  method: 'GET',
  origin: undefined,
  path: '/favicon.ico',
  userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36'
}
Need better 
