<script>
  import { onMount } from "svelte";

  let messages = [];
  let messageInput = "";
  let chatMessages;
  let botInfo = { name: "", image: "" };
  let messageHistory = [];

  // Get bot number from URL parameters
  $: botNumber = new URLSearchParams(window.location.search).get("bot") || "1";

  async function setBotInfo() {
    try {
      const response = await fetch(`/api/models/${botNumber}`);
      if (!response.ok) throw new Error("Model not found");
      botInfo = await response.json();
    } catch (error) {
      console.error("Error fetching model info:", error);
    }
  }

  async function handleSendMessage() {
    const message = messageInput.trim();
    if (!message) return;

    messages = [...messages, { content: message, isUser: true }];
    messageInput = "";

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          botNumber,
          history: messageHistory.map((msg) => ({
            role: msg.role,
            parts: [{ text: msg.content }],
          })),
        }),
      });

      const data = await response.json();
      messages = [...messages, { content: data.response, isUser: false }];
      messageHistory = data.history.map((msg) => ({
        role: msg.role,
        content: msg.parts[0].text,
      }));
    } catch (error) {
      console.error("Error:", error);
      messages = [
        ...messages,
        {
          content: "Sorry, there was an error processing your message.",
          isUser: false,
        },
      ];
    }
  }

  onMount(() => {
    setBotInfo();
  });

  $: if (chatMessages) {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: "smooth",
    });
  }
</script>

<div id="chat-container">
  <div id="chat-header">
    <div class="bot-info">
      <img src={botInfo.image} alt="Bot Avatar" class="bot-avatar" />
      <span class="bot-name">{botInfo.name}</span>
    </div>
    <div class="header-actions">
      <!-- Header buttons -->
    </div>
  </div>

  <div id="chat-messages" bind:this={chatMessages}>
    {#each messages as message}
      <div class="message {message.isUser ? 'user-message' : 'bot-message'}">
        {@html message.content
          .replace(/[<>]/g, (m) => (m === "<" ? "&lt;" : "&gt;"))
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>")
          .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
          .replace(/`([^`]+)`/g, "<code>$1</code>")
          .replace(/\n/g, "<br>")}
      </div>
    {/each}
  </div>

  <div id="input-container">
    <input
      type="text"
      bind:value={messageInput}
      on:keypress={(e) => e.key === "Enter" && handleSendMessage()}
      placeholder="Type your message..."
    />
    <button on:click={handleSendMessage}>Send</button>
  </div>
</div>

<style>
  #chat-container {
    width: 100%;
    max-width: 600px;
    height: 100vh;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }

  #chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background: #f9f9f9;
  }

  .message {
    margin: 8px 0;
    padding: 12px;
    border-radius: 12px;
    max-width: 80%;
    word-break: break-word;
  }

  .user-message {
    background: #8b5cf6;
    color: white;
    margin-left: auto;
  }

  .bot-message {
    background: #eef2ff;
    margin-right: auto;
    color: #1f2937;
  }

  #input-container {
    padding: 10px;
    border-top: 1px solid #ccc;
    background: white;
    display: flex;
    gap: 8px;
  }

  input {
    flex: 1;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }

  button {
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    background: #8b5cf6;
    color: white;
    font-size: 16px;
    cursor: pointer;
  }

  /* Add the rest of your existing styles here */
</style>
