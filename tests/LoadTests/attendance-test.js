import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 50,           
    duration: '30s',   
    thresholds: {
        http_req_duration: ['p(95)<500'], 
        http_req_failed: ['rate==0.00'],   
    },
};

export default function () {
    const url = 'http://localhost:5011/api/auth/login';
    
    // Remember to use the real credentials you tested in Postman!
    const payload = JSON.stringify({
        username: 'akinda123@sliit.lk',
        password: 'Akinda123'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(url, payload, params);

    check(res, {
        'Status is 200 OK': (r) => r.status === 200,
    });

    sleep(1); 
}