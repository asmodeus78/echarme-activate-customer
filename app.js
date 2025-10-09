// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// Imposta: TOKEN_ADMIN per il negozio (o recuperalo dinamicamente per ogni shop)
const ADMIN_API_VERSION = '2025-07';

const app = express();
app.use(bodyParser.json());

// Facoltativo: middleware per verificare la firma dell'App Proxy (HMAC)
// Implementa la verifica di 'signature' o 'signed_fields' come da docs Shopify.

app.post('/apps/account-activation', async (req, res) => {
    try {
        const shop = req.query.shop; // fornito dall’App Proxy
        const email = (req.body.email || '').trim().toLowerCase();

        if (!shop || !email) {
            // Risposta generica
            return res.json({ ok: true });
        }

        // Recupera token per questo shop (es. da DB). Per esempio statico:
        const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

        const baseUrl = `https://${shop}/admin/api/${ADMIN_API_VERSION}`;

        // 1) Cerca cliente per email
        const search = await axios.get(`${baseUrl}/customers/search.json`, {
            params: { query: `email:${email}` },
            headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN }
        });

        const customer = (search.data.customers || [])[0];

        if (customer) {
            // Stati possibili (REST): enabled, disabled, invited, declined
            // Se non è già enabled, invia l'invito/attivazione
            if (customer.state !== 'enabled') {
                try {
                    await axios.post(
                        `${baseUrl}/customers/${customer.id}/send_invite.json`,
                        { customer_invite: {} },
                        { headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN } }
                    );
                } catch (e) {
                    // Se già invitato o errore, non rivelare nulla all’utente
                }
            }
        }

        // Risposta sempre generica
        res.json({ ok: true });
    } catch (e) {
        // Log interno, risposta generica all'utente
        res.json({ ok: true });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on ' + PORT));
