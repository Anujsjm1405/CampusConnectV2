const nodemailer = require('nodemailer');
require('dotenv').config();
const path = require('path');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const commonAttachments = [
    {
        filename: 'logo.png',
        path: path.join(__dirname, 'logo.png'),
        cid: 'collegeLogo'
    },
    {
        filename: 'logo_text.png',
        path: path.join(__dirname, 'logo_text.png'),
        cid: 'campusConnectText'
    }
];

const emailBaseStyle = `
    margin: 0;
    padding: 40px 20px;
    background-color: #f8fafc;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
`;

const containerStyle = `
    max-width: 600px;
    margin: auto;
    background: #ffffff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
`;

const headerStyle = `
    background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%);
    padding: 48px 40px;
    text-align: center;
    color: #ffffff;
`;

const logoContainerStyle = `
    display: inline-block;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 16px;
    border-radius: 20px;
    margin-bottom: 24px;
`;

const cardStyle = `
    background: #f1f5f9;
    border-radius: 20px;
    padding: 32px;
    margin: 32px 0;
    border: 1px solid #e2e8f0;
`;

const buttonStyle = `
    background: #4f46e5;
    color: #ffffff;
    text-decoration: none;
    padding: 16px 32px;
    border-radius: 12px;
    display: inline-block;
    font-weight: 800;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: all 0.3s ease;
`;

const sendFacultyMail = async (email, name, login_id, password) => {
    const mailOptions = {
        from: `"CampusConnect Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to CampusConnect: Faculty Account Activated',
        attachments: commonAttachments,
        html: `
<div style="${emailBaseStyle}">
    <div style="${containerStyle}">
        <div style="${headerStyle}">
            <div style="${logoContainerStyle}">
                <img src="cid:collegeLogo" alt="WCE Logo" style="width: 80px; height: auto;" />
            </div>
            <div style="margin-top: 10px;">
                <h1 style="margin: 0; font-size: 36px; font-weight: 900; letter-spacing: -0.05em; color: #ffffff;">
                    Campus<span style="color: #818cf8;">Connect</span>
                </h1>
            </div>
            <p style="margin-top: 16px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.8;">
                Walchand College of Engineering, Sangli
            </p>
        </div>

        <div style="padding: 48px 40px;">
            <h2 style="color: #1e1b4b; font-size: 28px; font-weight: 900; margin: 0 0 24px 0; letter-spacing: -0.02em;">
                Faculty Registration Successful
            </h2>
            <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 32px;">
                Dear <strong>${name}</strong>,<br><br>
                Welcome to the digital heart of our academic community. Your faculty account for the **CampusConnect Portal** has been officially activated by the IT Department.
            </p>

            <div style="${cardStyle}">
                <h3 style="margin-top: 0; color: #1e1b4b; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px;">
                    Secure Credentials
                </h3>
                <div style="margin-bottom: 12px;">
                    <span style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Login ID</span>
                    <code style="font-size: 18px; color: #4f46e5; font-weight: 800; letter-spacing: 0.05em;">${login_id}</code>
                </div>
                <div>
                    <span style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Temporary Password</span>
                    <code style="font-size: 18px; color: #4f46e5; font-weight: 800; letter-spacing: 0.05em;">${password}</code>
                </div>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #64748b; margin-bottom: 40px; font-style: italic;">
                Note: For security reasons, we recommend changing your password upon your first login.
            </p>

            <div style="text-align: center;">
                <a href="${process.env.APP_URL || 'http://localhost:5173'}" style="${buttonStyle}">
                    Launch Faculty Portal
                </a>
            </div>

            <div style="margin-top: 64px; border-top: 1px solid #e2e8f0; padding-top: 32px;">
                <p style="font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0;">
                    Regards,<br>
                    <strong style="color: #475569;">CampusConnect Administration</strong><br>
                    Department of Information Technology<br>
                    Walchand College of Engineering, Sangli
                </p>
            </div>
        </div>

        <div style="background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                This is an automated communication from CampusConnect. Please do not reply directly.
            </p>
        </div>
    </div>
</div>
`
    };
    return transporter.sendMail(mailOptions);
};

const sendStudentMail = async (email, name, prn, password) => {
    const mailOptions = {
        from: `"CampusConnect Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to CampusConnect: Student Portal Access',
        attachments: commonAttachments,
        html: `
<div style="${emailBaseStyle}">
    <div style="${containerStyle}">
        <div style="${headerStyle}">
            <div style="${logoContainerStyle}">
                <img src="cid:collegeLogo" alt="WCE Logo" style="width: 80px; height: auto;" />
            </div>
            <div style="margin-top: 8px;">
                <img src="cid:campusConnectText" alt="CampusConnect" style="width: 220px; height: auto;" />
            </div>
            <p style="margin-top: 16px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.8;">
                Walchand College of Engineering, Sangli
            </p>
        </div>

        <div style="padding: 48px 40px;">
            <h2 style="color: #1e1b4b; font-size: 28px; font-weight: 900; margin: 0 0 24px 0; letter-spacing: -0.02em;">
                Welcome Aboard, ${name.split(' ')[0]}!
            </h2>
            <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 32px;">
                Your student profile for **CampusConnect** is ready. You can now access your personalized timetable, batch schedules, and department updates in one place.
            </p>

            <div style="${cardStyle}">
                <h3 style="margin-top: 0; color: #1e1b4b; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px;">
                    Portal Access
                </h3>
                <div style="margin-bottom: 12px;">
                    <span style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Student PRN</span>
                    <code style="font-size: 18px; color: #4f46e5; font-weight: 800; letter-spacing: 0.05em;">${prn}</code>
                </div>
                <div>
                    <span style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Portal Password</span>
                    <code style="font-size: 18px; color: #4f46e5; font-weight: 800; letter-spacing: 0.05em;">${password}</code>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.APP_URL || 'http://localhost:5173'}" style="${buttonStyle}">
                    Enter Student Hub
                </a>
            </div>

            <div style="margin-top: 64px; border-top: 1px solid #e2e8f0; padding-top: 32px;">
                <p style="font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0;">
                    Best wishes,<br>
                    <strong style="color: #475569;">CampusConnect Team</strong><br>
                    IT Department | WCE Sangli
                </p>
            </div>
        </div>

        <div style="background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                Walchand College of Engineering, Sangli. All Rights Reserved.
            </p>
        </div>
    </div>
</div>
`
    };
    return transporter.sendMail(mailOptions);
};

module.exports = { sendFacultyMail, sendStudentMail };
