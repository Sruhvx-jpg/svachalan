import UserService from "@repo/services/user";
import EmailService from  "@repo/services/gmailService"
import GmailDotAiService from "@repo/services/gmail.aiService"

export const userService = new UserService();
export const emailService = new EmailService();
export const gmailDotAiService =  new GmailDotAiService()