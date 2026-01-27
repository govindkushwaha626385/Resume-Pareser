import nodemailer from 'nodemailer';
import { supabase } from '../db/supabaseClient.js';

// Helper: Format date for Google Calendar links (YYYYMMDDTHHMMSSZ)
const formatCalendarDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
};

export const sendCandidateEmail = async (candidateId, type) => {
    try {
        // 1. Fetch Candidate & Profile Data
        const { data: candidate, error } = await supabase
            .from('candidates')
            .select(`
                id,
                candidate_profiles ( profile_json )
            `)
            .eq('id', candidateId)
            .single();

        if (error || !candidate) {
            console.error("Database Error:", error);
            throw new Error("Candidate not found.");
        }

        // 2. Extract Name and Email Safely
        const profile = candidate.candidate_profiles?.[0]?.profile_json || {};
        const candidateEmail = profile.email || profile.contact_info?.email;
        const candidateName = profile.name || "Candidate";

        if (!candidateEmail) {
            throw new Error(`Email address missing for candidate: ${candidateId}`);
        }

        // 3. Configure Gmail Transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 4. Generate Links
        const cleanName = candidateName.replace(/[^a-zA-Z0-9]/g, '');
        const uniqueId = candidateId.slice(-4);
        const defaultLink = `https://meet.jit.si/DiceTech-${cleanName}-${uniqueId}`;
        const meetLink = defaultLink;

        // 5. Prepare Email Content & Determine New Status
        let subject = "";
        let htmlBody = "";
        let textBody = "";
        let newStatus = 'PROCESSED'; 

        // --- COMMON STYLES ---
        const containerStyle = `font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #333;`;
        const cardStyle = `max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;`;
        const headerStyle = `background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px; text-align: center;`;
        const contentStyle = `padding: 40px 30px;`;
        const buttonStyle = `display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 20px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);`;
        const infoBoxStyle = `background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin: 25px 0;`;

        if (type === 'shortlist') {
            newStatus = 'SHORTLISTED'; 

            // Schedule: 2 days from now at 11:00 AM
            const startTime = new Date();
            startTime.setDate(startTime.getDate() + 2);
            startTime.setHours(11, 0, 0, 0);

            const endTime = new Date(startTime);
            endTime.setHours(12, 0, 0, 0);

            // Formatting
            const dateStr = startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const googleStart = formatCalendarDate(startTime);
            const googleEnd = formatCalendarDate(endTime);

            const eventTitle = `Interview with Dice.tech - ${candidateName}`;
            const eventDetails = `Technical Interview.\n\nLink: ${meetLink}`;
            const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${googleStart}/${googleEnd}&details=${encodeURIComponent(eventDetails)}&location=${encodeURIComponent(meetLink)}`;

            subject = `Interview Invitation: ${candidateName} / Dice.tech`;
            
            htmlBody = `
                <div style="${containerStyle}">
                    <div style="${cardStyle}">
                        <div style="${headerStyle}">
                            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">Dice.tech</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Talent Acquisition Team</p>
                        </div>

                        <div style="${contentStyle}">
                            <h2 style="color: #111827; margin-top: 0;">Exciting News, ${candidateName}!</h2>
                            <p style="color: #4B5563; line-height: 1.6;">
                                We've reviewed your application and we are very impressed with your profile. We would love to invite you to the next stage of our hiring process.
                            </p>
                            
                            <div style="${infoBoxStyle}">
                                <h3 style="margin: 0 0 15px 0; color: #4F46E5; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">📅 Interview Details</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 5px 0; color: #64748B; width: 80px;">Date:</td>
                                        <td style="font-weight: 600; color: #1E293B;">${dateStr}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; color: #64748B;">Time:</td>
                                        <td style="font-weight: 600; color: #1E293B;">11:00 AM - 12:00 PM</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; color: #64748B;">Link:</td>
                                        <td><a href="${meetLink}" style="color: #4F46E5; text-decoration: none;">View Meeting Link</a></td>
                                    </tr>
                                </table>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="font-size: 16px; color: #1F2937; margin-bottom: 10px;">📝 What to Expect:</h3>
                                <ul style="color: #4B5563; padding-left: 20px; line-height: 1.6;">
                                    <li><strong>Duration:</strong> 60 Minutes</li>
                                    <li><strong>Format:</strong> Technical discussion & live coding</li>
                                    <li><strong>Preparation:</strong> Please have your IDE ready and a stable internet connection.</li>
                                </ul>
                            </div>

                            <div style="text-center">
                                <a href="${meetLink}" style="${buttonStyle}">Join Interview</a>
                            </div>

                            <div style="text-align: center; margin-top: 20px;">
                                <a href="${calendarUrl}" style="color: #6B7280; font-size: 14px; text-decoration: none;">+ Add to Google Calendar</a>
                            </div>
                        </div>

                        <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
                            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Dice.tech. All rights reserved.</p>
                            <p style="margin: 5px 0;">This is an automated message from our HR system.</p>
                        </div>
                    </div>
                </div>
            `;
            
            textBody = `Hi ${candidateName},\n\nGood news! You have been shortlisted for an interview on ${dateStr} at 11:00 AM.\n\nLink: ${meetLink}\n\nPlease join us for a technical discussion.`;

        } else {
            newStatus = 'REJECTED'; 

            subject = "Update on your application at Dice.tech";
            
            htmlBody = `
                <div style="${containerStyle}">
                    <div style="${cardStyle}">
                        <div style="background: #F3F4F6; padding: 30px; text-align: center; border-bottom: 1px solid #E5E7EB;">
                            <h1 style="color: #374151; margin: 0; font-size: 22px;">Dice.tech</h1>
                        </div>

                        <div style="${contentStyle}">
                            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Hi ${candidateName},</h2>
                            <p style="color: #4B5563; line-height: 1.6;">
                                Thank you so much for giving us the opportunity to consider your application for the position at <strong>Dice.tech</strong>.
                            </p>
                            <p style="color: #4B5563; line-height: 1.6;">
                                We received a large number of applications, and after careful review, we have decided to move forward with other candidates whose experience matches our current specific needs more closely.
                            </p>
                            <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 25px 0;">
                                <p style="margin: 0; color: #1E40AF; font-size: 14px;">
                                    <strong>Note:</strong> We will keep your resume in our talent pool. If a role opens up that matches your skillset perfectly, we will reach out to you.
                                </p>
                            </div>
                            <p style="color: #4B5563; line-height: 1.6;">
                                We appreciate your time and wish you the very best in your job search.
                            </p>
                            <p style="color: #111827; font-weight: bold; margin-top: 30px;">
                                Best regards,<br>
                                <span style="font-weight: normal; color: #6B7280;">Dice.tech HR Team</span>
                            </p>
                        </div>
                    </div>
                </div>
            `;
            
            textBody = `Hi ${candidateName},\n\nThank you for applying to Dice.tech. While your skills are impressive, we have decided to move forward with other candidates at this time.\n\nWe will keep your resume on file for future opportunities.\n\nBest,\nDice.tech HR`;
        }

        // 6. Send Email
        await transporter.sendMail({
            from: `"Dice.tech HR" <${process.env.EMAIL_USER}>`,
            to: candidateEmail,
            subject: subject,
            text: textBody,
            html: htmlBody
        });

        // 7. 🔥 UPDATE DATABASE STATUS 🔥
        await supabase
            .from('candidates')
            .update({ status: newStatus })
            .eq('id', candidateId);

        // 8. Log to Audit Table
        await supabase.from('candidate_audit_logs').insert([{
            candidate_id: candidateId,
            step: 'EMAIL_SENT',
            status: 'OK',
            details: { type, newStatus, recipient: candidateEmail }
        }]);

        return { status: "success", link: meetLink };

    } catch (err) {
        console.error("Email Service Error:", err);
        throw new Error(`Failed to send email: ${err.message}`);
    }
};