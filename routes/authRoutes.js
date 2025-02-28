const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const centralServerBaseUrl = 'https://helpdesk-onedriveserver.onrender.com';

router.post('/validate', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        console.log('Missing token');
        return res.status(400).send('Missing token');
    }

    try {
        console.log('Fetching URLs from central server...');
        const getUrlResponse = await fetch(`${centralServerBaseUrl}/list_urls`);
        const responseJson = await getUrlResponse.json();
        const urls = responseJson.urls;

        console.log('Fetched URLs:', urls);

        for (let urlObj of urls) {
            const url = urlObj.ngrok_url;
            console.log(`Validating token with URL: ${url}`);

            try {
                const validationResponse = await fetch(`${url}/validate2`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                    mode: 'cors'
                });

                const validationResponseText = await validationResponse.text();
                console.log(`Validation response from ${url}:`, validationResponseText);

                let validation;
                try {
                    validation = JSON.parse(validationResponseText);
                } catch (e) {
                    console.error(`Failed to parse JSON from ${url}:`, e);
                    continue;
                }

                if (validation.valid) {
                    console.log(`Token valid for URL: ${url}`);
                    return res.send({ success: true, message: 'Token validated.' });
                } else {
                    console.log(`Token invalid for URL: ${url}`);
                }
            } catch (error) {
                console.error(`Error connecting to URL ${url}:`, error);
                continue;
            }
        }

        console.log('Invalid token or no valid URL found.');
        return res.status(403).send({ success: false, message: 'Validation failed.' });
    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).send({ success: false, message: 'Server error' });
    }
});

module.exports = router;
