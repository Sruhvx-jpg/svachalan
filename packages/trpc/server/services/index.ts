import UserService from "@repo/services/user";
import EmailService from  "@repo/services/gmailService"
import GmailDotAiService from "@repo/services/gmail.aiService"
import CalendarService from "@repo/services/calendarService"
import MarketplaceService from "@repo/services/marketplace";

export const userService = new UserService();
export const emailService = new EmailService();
export const gmailDotAiService =  new GmailDotAiService()
export const calendarService = new CalendarService()
export const marketplaceService = new MarketplaceService();