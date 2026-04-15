import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://safety-test-46d49.web.app';
const PATHS = ['/', '/home', '/booking', '/billing', '/login'];

export const options = {
  scenarios: {
    quick_ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '10s', target: 0 }
      ]
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<2000']
  }
};

export default function () {
  const path = PATHS[Math.floor(Math.random() * PATHS.length)];
  const response = http.get(`${BASE_URL}${path}`, {
    tags: { page: path }
  });

  check(response, {
    'status is 200': (r) => r.status === 200
  });

  sleep(Math.random() * 1.5);
}
