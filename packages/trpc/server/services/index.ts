import UserService from "@repo/services/user";
import EmailService from  "@repo/services/gmailService"

export const userService = new UserService();
export const emailService = new EmailService();