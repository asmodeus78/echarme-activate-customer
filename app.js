// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

// Imposta: TOKEN_ADMIN per il negozio (o recuperalo dinamicamente per ogni shop)
const ADMIN_API_VERSION = '2025-07';

const app = express();
app.use(cors());





app.use(bodyParser.json());

// Facoltativo: middleware per verificare la firma dell'App Proxy (HMAC)
// Implementa la verifica di 'signature' o 'signed_fields' come da docs Shopify.

app.post('/apps/account-activation', async (req, res) => {
    try {
        const shop = "echarme-official.myshopify.com"; // fornito dall’App Proxy
        const email = (req.body.email || '').trim().toLowerCase();

        console.log('il tuo shop ' + shop);
        console.log('la tua mail: ' + email);

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
            console.log("STATE: " + customer.state);
            if (customer.state !== 'enabled') {
                console.log("invito da inviare");
                try {
                    await axios.post(
                        `${baseUrl}/customers/${customer.id}/send_invite.json`,
                        { customer_invite: {} },
                        { headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN } }
                    );
                    console.log("invito inviato");
                    res.json({ ok: true });
                } catch (e) {
                    // Se già invitato o errore, non rivelare nulla all’utente
                    console.log(e);
                    res.json({ ok: false, msg:'Errore di connessione riprova tra qualche minuto.' });
                }
            }else{
                res.json({ ok: false, msg:"Account gia attivo. In questo caso è necessario tornare alla <a href='https://www.echarme.it/account/login#login'><b><u>Schermata di login</u></b></a> o <br>effettuare il recupero della password cliccando su <a href='https://www.echarme.it/account/login#recover'><b><u>Password dimenticata.</u></b></a>" });
            }
        }else{
            res.json({ ok: false, msg:"E-mail non riconosciuta, <a href='https://www.echarme.it/account/register'><b><u>Crea un account</u></b></a>."});
        }

        // Risposta sempre generica

    } catch (e) {
        // Log interno, risposta generica all'utente
        res.json({ ok: false });
    }
});




app.post('/apps/account-retrive', async (req, res) => {

    //fa il recupero della password
    try {
        const shop = "echarme-official.myshopify.com"; // fornito dall’App Proxy
        const email = (req.body.email || '').trim().toLowerCase();

        console.log('il tuo shop ' + shop);
        console.log('la tua mail: ' + email);

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
            console.log("STATE: " + customer.state);
            if (customer.state !== 'enabled') {
                console.log("invito da inviare");
                try {
                    await axios.post(
                        `${baseUrl}/customers/${customer.id}/send_invite.json`,
                        { customer_invite: {} },
                        { headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN } }
                    );
                    console.log("invito inviato");
                    res.json({ ok: true });
                } catch (e) {
                    // Se già invitato o errore, non rivelare nulla all’utente
                    console.log(e);
                    res.json({ ok: false, msg:'Errore di connessione riprova tra qualche minuto.' });
                }
            }else{
                // recupera la password
                try {
                    await axios.post(
                        `${baseUrl}/graphql.json`,
                        {
                            query: `
                            mutation customerRecover($email: String!) {
                                customerRecover(email: $email) {
                                    customerUserErrors {
                                        field
                                        message
                                    }
                                }
                            }
                            `,
                            variables: { email: "asmodeus78@gmail.com"  }
                        },
                        { headers: { 'Content-Type': 'application/json','X-Shopify-Access-Token': ACCESS_TOKEN } }
                    ).then(res => {
                        console.log(res.data);
                    });
                    console.log("recupero password inviato");
    
                    res.json({ ok: false, msg:"Ti abbiamo inviato un email con il link per resettare la password" });
               } catch (e) {
                    // mah......
                    console.log(e);
                    res.json({ ok: false, msg:'Errore di connessione riprova tra qualche minuto.' });
                }     
            }
        }else{
            res.json({ ok: false, msg:"E-mail non riconosciuta, <a href='https://www.echarme.it/account/register'><b><u>Crea un account</u></b></a>."});
        }

        // Risposta sempre generica

    } catch (e) {
        // Log interno, risposta generica all'utente
        res.json({ ok: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on ' + PORT));
