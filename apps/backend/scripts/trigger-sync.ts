import axios from 'axios';

async function main() {
    try {
        const response = await axios.post('http://localhost:4000/api/sync', {
            shopDomain: 'deepak-test-dev.myshopify.com'
        });
        console.log('Sync triggered successfully:', response.data);
    } catch (error: any) {
        console.error('Error triggering sync:', error.response ? error.response.data : error.message);
    }
}

main();
