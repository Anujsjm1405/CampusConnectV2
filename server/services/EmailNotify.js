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

const sendFacultyMail = async (email, name, login_id, password) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'CampusConnect Faculty Account Created',
        attachments: 
        [
            {
                filename: 'logo.png',
                path: path.join(__dirname, 'logo.png'),
                cid: 'collegeLogo'
            }
        ],
      html: `
<div style="
    margin:0;
    padding:30px 15px;
    background-color:#eef3f8;
    font-family:Arial, Helvetica, sans-serif;
">

    <div style="
        max-width:700px;
        margin:auto;
        background:white;
        border-radius:16px;
        overflow:hidden;
        box-shadow:0 6px 18px rgba(0,0,0,0.12);
    ">

        <!-- Header -->
        <div style="
            background:linear-gradient(135deg,#0f4c81,#1565c0);
            padding:35px 28px;
            text-align:center;
            color:white;
        ">

            <img 
                src="cid:collegeLogo"
                alt="WCE Logo"
                style="
                    width:95px;
                    background:white;
                    padding:10px;
                    border-radius:14px;
                    margin-bottom:18px;
                "
            />

            <h1 style="
                margin:0;
                font-size:34px;
                letter-spacing:0.5px;
            ">
                CampusConnect
            </h1>

            <p style="
                margin-top:10px;
                font-size:15px;
                opacity:0.95;
            ">
                Walchand College of Engineering, Sangli
            </p>

        </div>

        <!-- Body -->
        <div style="
            padding:42px 38px;
            color:#333;
            line-height:1.8;
        ">

            <h2 style="
                color:#0f4c81;
                margin-top:0;
                margin-bottom:25px;
                font-size:30px;
            ">
                Faculty Account Registration Successful
            </h2>

            <p>
                Dear ${name},
            </p>

            <p>
                Greetings from the Department of Information Technology,
                Walchand College of Engineering, Sangli.
            </p>

            <p>
                Your faculty account for the 
                <strong>CampusConnect Portal</strong> has been successfully created 
                by the administration team.
            </p>

            <!-- Credentials Card -->
            <div style="
                background:#f4f8fc;
                border-left:6px solid #1565c0;
                padding:25px;
                border-radius:12px;
                margin:30px 0;
            ">

                <h3 style="
                    margin-top:0;
                    color:#0f4c81;
                    font-size:22px;
                ">
                    Login Credentials
                </h3>

                <p style="margin:12px 0;">
                    <strong>Login ID:</strong> ${login_id}
                </p>

                <p style="margin:12px 0;">
                    <strong>Password:</strong> ${password}
                </p>

            </div>


            <p>
                We welcome you to the CampusConnect platform and wish you
                a productive academic journey ahead.
            </p>

            <!-- Button -->
            <div style="
                text-align:center;
                margin:40px 0 20px;
            ">

                <a 
                    href="https://www.walchandsangli.ac.in/"
                    style="
                        background:#1565c0;
                        color:white;
                        text-decoration:none;
                        padding:14px 30px;
                        border-radius:8px;
                        display:inline-block;
                        font-weight:bold;
                        font-size:15px;
                    "
                >
                    Visit College Website
                </a>

            </div>

            <p style="margin-top:35px;">
                Regards,<br>
                <strong>CampusConnect Administration Team</strong><br>
                Department of Information Technology<br>
                Walchand College of Engineering, Sangli
            </p>

        </div>

        <!-- Footer -->
        <div style="
            background:#f0f4f8;
            padding:22px;
            text-align:center;
            font-size:13px;
            color:#555;
            border-top:1px solid #d8e2ec;
        ">

            <p style="margin:5px 0;">
                Walchand College of Engineering, Sangli
            </p>

            <p style="margin:5px 0;">
                🌐 www.walchandsangli.ac.in
            </p>

            <p style="margin:5px 0;">
                📧 campusconnect@gmail.com
            </p>

            <p style="
                margin-top:14px;
                color:#777;
                font-size:12px;
            ">
                This is an automated email generated by CampusConnect.
                Please do not reply directly to this message.
            </p>

        </div>

    </div>

</div>
`
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendFacultyMail };