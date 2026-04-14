const USER = { email: 'rami.admin@test.com', password: 'Test@123456' };
const API_URL = 'http://localhost:5000/api';

async function main() {
    try {
        console.log('Starting verification...');

        // 1. Login
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER)
        });
        const loginData = await loginRes.json();
        if (!loginData.success) throw new Error('Login failed: ' + (loginData.message || JSON.stringify(loginData)));
        const token = loginData.data.accessToken;
        console.log('✅ Login successful');

        // 2. Get Metadata
        const headers = { Authorization: `Bearer ${token}` };
        const [catsRes, trainersRes] = await Promise.all([
            fetch(`${API_URL}/institute/categories`, { headers }),
            fetch(`${API_URL}/institute/trainers`, { headers })
        ]);
        const cats = (await catsRes.json()).data;
        const trainers = (await trainersRes.json()).data;

        console.log(`Debug: Cats: ${cats?.length}, Trainers: ${trainers?.length}`);

        // 3. Create Course
        const coursePayload = {
            title: "API Verification Course " + Date.now(),
            categoryId: cats[0].id,
            trainerId: trainers[0].id,
            shortDescription: "Short Desc",
            description: "Long Desc",
            price: 100,
            minStudents: 5,
            maxStudents: 20,
            deliveryType: 'in_person',
            startDate: "2024-01-01",
            endDate: "2024-02-01",
            duration: 10,
            sessions: [
                { date: "2024-01-01", startTime: "09:00", endTime: "10:00", location: "Test Hall", topic: "Intro" }
            ]
        };

        console.log('Sending Payload:', JSON.stringify(coursePayload, null, 2));

        const createRes = await fetch(`${API_URL}/institute/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(coursePayload)
        });

        const text = await createRes.text();
        console.log('Response Status:', createRes.status);
        console.log('Response Body:', text);

        if (!createRes.ok) {
            throw new Error(`Create Course failed with status ${createRes.status}`);
        }

        const createData = JSON.parse(text);

        if (!createData.success) throw new Error('Create Course failed: ' + JSON.stringify(createData));
        console.log('✅ Course Created:', createData.data.id);
        console.log('✅ Verification Successful');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}

main();
