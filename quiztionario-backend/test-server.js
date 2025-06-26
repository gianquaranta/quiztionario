#!/usr/bin/env node

const http = require('http');

const SERVER_URL = process.argv[2] || 'https://prickly-amalita-gianquaranta-b04c7f4a.koyeb.app';

console.log(`🧪 Testing server: ${SERVER_URL}`);

// Test 1: Health check
function testHealth() {
  return new Promise((resolve, reject) => {
    const url = `${SERVER_URL}/health`;
    console.log(`\n1️⃣ Testing health endpoint: ${url}`);
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Health check passed');
          console.log('Response:', JSON.parse(data));
          resolve(true);
        } else {
          console.log(`❌ Health check failed: ${res.statusCode}`);
          reject(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Health check error:', err.message);
      reject(false);
    });
  });
}

// Test 2: Socket.IO endpoint
function testSocketIO() {
  return new Promise((resolve, reject) => {
    const url = `${SERVER_URL}/socket.io/?EIO=4&transport=polling&t=test`;
    console.log(`\n2️⃣ Testing Socket.IO endpoint: ${url}`);
    
    http.get(url, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Socket.IO endpoint accessible');
          console.log('Response length:', data.length);
          resolve(true);
        } else {
          console.log(`❌ Socket.IO endpoint failed: ${res.statusCode}`);
          console.log('Response:', data);
          reject(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Socket.IO test error:', err.message);
      reject(false);
    });
  });
}

// Test 3: Root endpoint
function testRoot() {
  return new Promise((resolve, reject) => {
    const url = `${SERVER_URL}/`;
    console.log(`\n3️⃣ Testing root endpoint: ${url}`);
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Root endpoint working');
          const json = JSON.parse(data);
          console.log('Socket.IO info:', json.socketIO);
          resolve(true);
        } else {
          console.log(`❌ Root endpoint failed: ${res.statusCode}`);
          reject(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Root test error:', err.message);
      reject(false);
    });
  });
}

async function runTests() {
  console.log('🚀 Starting server tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealth },
    { name: 'Root Endpoint', fn: testRoot },
    { name: 'Socket.IO Endpoint', fn: testSocketIO }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed`);
    }
  }
  
  console.log(`\n📊 Results: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('🎉 All tests passed! Server should be working.');
  } else {
    console.log('⚠️ Some tests failed. Check server configuration.');
  }
}

runTests().catch(console.error);
