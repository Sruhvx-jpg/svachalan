// ++++++++++++++++++++++++ CODE OF CONDUCT ++++++++++++++++++++++++++
//1. Use private function to wrap drizzle db select and  insert an also corsair
//2. use try catch block everywhere, in catch block throw a error mentioning which private function it originated
//3. imports should first start with pnpm package -> in house modules/packages -> current working directory files

//pnpm packages
import type { StreamTextResult } from "ai"

//in house modules/packages
import { chat, streamChat } from "@repo/corsair/src/corsair"

//current working dir files

class GmailDotAIService {
    //======================================== private methods ========================================


    //======================================== public methods ==========================================

    /**
     * Non-streaming chat — returns the final AI response text.
     */
    public async chatWithAi(message: string, userId: string): Promise<string> {
        try {
            const text = await chat(message, userId)
            return text
        } catch (error) {
            throw new Error(
                `chatWithAi failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    /**
     * Streaming chat — returns the streamText result for piping to SSE.
     */
    public streamChatWithAi(message: string, userId: string): StreamTextResult<any, any> {
        try {
            return streamChat(message, userId)
        } catch (error) {
            throw new Error(
                `streamChatWithAi failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }
    //end
}

export default GmailDotAIService