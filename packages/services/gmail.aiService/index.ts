// ++++++++++++++++++++++++ CODE OF CONDUCT ++++++++++++++++++++++++++
//1. Use private function to wrap drizzle db select and  insert an also corsair
//2. use try catch block everywhere, in catch block throw a error mentioning which private function it originated
//3. imports should first start with pnpm package -> in house modules/packages -> current working directory files

import { getTenant } from "@repo/corsair"
import { chat } from "@repo/corsair/src/corsair"

//pnpm packages

//in house modules/packages

//current working dir files

const SYSTEM_PROMT = `You are an intelligent email assistant with access to the user's Gmail inbox.
You can help the user:
- Read and search their emails
- Get summaries of their inbox
- Find specific emails by sender, subject, or content
- Mark emails as read
- Send emails on their behalf
 
Always use Corsair tools to interact with Gmail. Start with list_operations to discover
what's available, use get_schema for parameters, then run_script to execute.
When referencing emails, use their ID, not subject lines.
Be concise and helpful. If an action could be destructive (delete, send), confirm with the user first.`

class GmailDotAIService{
    //======================================== private methods ========================================


    //======================================== public methos ==========================================
    public async chatWithAi(message: string, userId: string){
        const text = await chat(message, userId)
        console.log(text)
        

        return text
    }
    //end
}

export default GmailDotAIService