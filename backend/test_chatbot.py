import asyncio
from chatbot import chatbot   # your file name

async def test():
    response = await chatbot.chat(
        user_id="test_user",
        message="I want a career in AI"
    )
    
    print("\nResponse:\n", response["response"])
    print("\nSources:\n", response["sources"])

asyncio.run(test())