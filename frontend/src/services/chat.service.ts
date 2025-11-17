/**
 * Chat WebSocket Client
 * Part of ft_transcendence project
 */

interface ChatWSMessage {
  type: 'connection_established' | 'message' | 'user_joined' | 'user_left' | 'error';
  message?: string;
  username?: string;
}

interface ChatOutgoingMessage {
  type: 'message';
  message: string;
}

type MessageType = 'info' | 'error' | 'warning';

export class ChatClient {
  private socket: WebSocket | null = null;
  private connected: boolean = false;
  private messagesContainer: HTMLElement | null = null;
  private messageInput: HTMLInputElement | null = null;
  private userList: HTMLElement | null = null;
  private connectedUsers: Set<string> = new Set();

  public connect(): void {
    // Get protocol (ws or wss)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat/`;

    console.log('Connecting to chat WebSocket:', wsUrl);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('✅ Chat WebSocket connected');
        this.connected = true;
        this.showSystemMessage('Connecté au chat');
      };

      this.socket.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data) as ChatWSMessage;
        this.handleMessage(data);
      };

      this.socket.onerror = (error: Event) => {
        console.error('❌ Chat WebSocket error:', error);
        this.showSystemMessage('Erreur de connexion au chat', 'error');
      };

      this.socket.onclose = () => {
        console.log('Chat WebSocket closed');
        this.connected = false;
        this.showSystemMessage('Déconnecté du chat', 'warning');
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.showSystemMessage('Impossible de se connecter au chat', 'error');
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }

  private handleMessage(data: ChatWSMessage): void {
    switch (data.type) {
      case 'connection_established':
        console.log('Connection confirmed:', data.message);
        break;

      case 'message':
        if (data.username && data.message) {
          this.displayMessage(data.username, data.message);
        }
        break;

      case 'user_joined':
        if (data.username) {
          this.connectedUsers.add(data.username);
          this.updateUserList();
          this.showSystemMessage(`${data.username} a rejoint le chat`);
        }
        break;

      case 'user_left':
        if (data.username) {
          this.connectedUsers.delete(data.username);
          this.updateUserList();
          this.showSystemMessage(`${data.username} a quitté le chat`);
        }
        break;

      case 'error':
        this.showSystemMessage(`Erreur: ${data.message || 'Erreur inconnue'}`, 'error');
        break;

      default:
        console.log('Unknown message type:', data);
    }
  }

  public sendMessage(message: string): boolean {
    if (!this.connected || !this.socket) {
      this.showSystemMessage('Non connecté au chat', 'error');
      return false;
    }

    if (!message || message.trim() === '') {
      return false;
    }

    try {
      const outgoingMessage: ChatOutgoingMessage = {
        type: 'message',
        message: message.trim(),
      };
      this.socket.send(JSON.stringify(outgoingMessage));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      this.showSystemMessage("Erreur lors de l'envoi du message", 'error');
      return false;
    }
  }

  private displayMessage(username: string, message: string): void {
    if (!this.messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.style.padding = '0.5rem';
    messageDiv.style.borderBottom = '1px solid rgba(255,255,255,0.1)';

    const timestamp = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    messageDiv.innerHTML = `
      <span style="color: #00d4ff; font-weight: bold;">${this.escapeHtml(username)}</span>
      <span style="color: #888; font-size: 0.8em; margin-left: 0.5rem;">${timestamp}</span>
      <br>
      <span style="color: #fff;">${this.escapeHtml(message)}</span>
    `;

    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private showSystemMessage(message: string, type: MessageType = 'info'): void {
    if (!this.messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.style.padding = '0.5rem';
    messageDiv.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
    messageDiv.style.fontStyle = 'italic';

    let color = '#888';
    if (type === 'error') color = '#ff4444';
    else if (type === 'warning') color = '#ffaa00';
    else if (type === 'info') color = '#00d4ff';

    messageDiv.innerHTML = `
      <span style="color: ${color};">
        <strong>Système:</strong> ${this.escapeHtml(message)}
      </span>
    `;

    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private updateUserList(): void {
    if (!this.userList) return;

    const userList = this.userList; // Capture reference for closure
    userList.innerHTML = '';

    if (this.connectedUsers.size === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.style.padding = '0.5rem';
      emptyItem.style.color = '#888';
      emptyItem.textContent = 'Aucun utilisateur';
      userList.appendChild(emptyItem);
    } else {
      Array.from(this.connectedUsers).forEach((username) => {
        const userItem = document.createElement('li');
        userItem.style.padding = '0.5rem';
        userItem.innerHTML = `🟢 ${this.escapeHtml(username || '')}`;
        userList.appendChild(userItem);
      });
    }
  }

  private escapeHtml(text: string | null): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public init(messagesContainerId: string, messageInputId: string, userListId: string): void {
    this.messagesContainer = document.getElementById(messagesContainerId);
    this.messageInput = document.getElementById(messageInputId) as HTMLInputElement | null;
    this.userList = document.getElementById(userListId);

    if (!this.messagesContainer || !this.messageInput) {
      console.error('Chat elements not found');
      return;
    }

    const messageInput = this.messageInput; // Capture in closure before connect

    // Connect to WebSocket
    this.connect();

    // Setup message form
    const form = messageInput.closest('form');
    if (form) {
      form.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        const message = messageInput.value;
        if (this.sendMessage(message)) {
          messageInput.value = '';
        }
      });
    }
  }

  public cleanup(): void {
    this.disconnect();
    this.messagesContainer = null;
    this.messageInput = null;
    this.userList = null;
    this.connectedUsers.clear();
  }
}

// Export singleton instance
export const chatClient = new ChatClient();

console.log('✅ Chat client loaded (TypeScript)');
