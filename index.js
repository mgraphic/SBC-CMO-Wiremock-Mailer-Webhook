const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mailhog',
    port: Number(process.env.SMTP_PORT || 1025),
    secure: false,
});

app.post('/send-email', async (req, res) => {
    const { to, subject, body } = req.body;

    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'wiremock@test.local',
        to: to || 'test@example.com',
        subject: subject || 'WireMock event',
        text: body || JSON.stringify(req.body, null, 2),
    });

    res.json({ sent: true });
});

app.listen(PORT, () => {
    console.log(`Mailer listening on port ${PORT}`);
});
