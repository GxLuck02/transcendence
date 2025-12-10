# ft_transcendence

A full-stack multiplayer Pong web application with real-time gameplay, tournaments, live chat, and blockchain score recording.

> Final project of the 42 school curriculum

## Overview

ft_transcendence is a single-page application that allows users to play Pong against each other in real-time, participate in tournaments, chat with other players, and record tournament results on the Avalanche blockchain.

### Key Features

- **Real-time Multiplayer Pong** - Play against friends via WebSocket with server-authoritative game logic
- **Local Multiplayer** - Two players on the same keyboard
- **AI Opponent** - Three difficulty levels with trajectory prediction
- **Tournament System** - Dynamic bracket generation with elimination rounds
- **Live Chat** - Global chat room and direct messages with game invitations
- **Blockchain Integration** - Tournament scores recorded on Avalanche testnet
- **OAuth Authentication** - Sign in with 42 or GitHub accounts

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | TypeScript, Vite, Custom SPA Router |
| **Backend** | Node.js, Fastify 4.x |
| **Database** | SQLite (better-sqlite3) |
| **Real-time** | WebSocket (@fastify/websocket) |
| **Authentication** | JWT, bcrypt, OAuth 2.0 |
| **Blockchain** | Avalanche Fuji testnet, Solidity, Web3.js |
| **Infrastructure** | Docker, Nginx, Redis |

## Quick Start

### Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)

### Installation

```bash
# Clone the repository
git clone <repository_url>
cd transcendence

# Build and start all services
make
```

The application will be available at **https://localhost:8443**

> Note: Accept the self-signed SSL certificate in your browser

### Development Commands

```bash
make          # Setup + build + start (single command)
make up       # Start services
make down     # Stop services
make logs     # View real-time logs
make clean    # Stop and remove containers
make re       # Full rebuild
```

## Project Structure

```
transcendence/
├── fastify-backend/
│   └── src/
│       ├── server.js              # Main server, user routes, JWT auth
│       ├── db.js                  # SQLite schema and migrations
│       ├── routes/
│       │   ├── pong.js            # Match management, matchmaking
│       │   ├── chat.js            # Messages, notifications
│       │   ├── oauth.js           # OAuth 2.0 (42 + GitHub)
│       │   └── blockchain.js      # Avalanche integration
│       └── websockets/
│           ├── pong.js            # Remote game rooms
│           ├── pong_engine_server.js  # Server-side game physics
│           └── chat.js            # Global chat
├── frontend/
│   └── src/
│       ├── main.ts                # SPA router and pages
│       ├── services/              # Auth, chat, tournament services
│       ├── games/                 # Pong engine, AI, remote play
│       └── utils/
│           └── validation.ts      # Input validation
├── nginx/
│   └── nginx.conf                 # SSL termination, reverse proxy
├── docker-compose.yml
└── Makefile
```

## Modules Implemented

### Mandatory Part (25%)
- Pong game with two local players
- Tournament system with player aliases
- Match announcements and bracket progression
- Single-page application with browser navigation support

### Major Modules (60 points)

| Module | Description |
|--------|-------------|
| **Backend Framework** | Fastify + Node.js with full REST API |
| **Remote Players** | WebSocket-based multiplayer with server-side game logic |
| **Live Chat** | Real-time messaging, direct messages, game invitations |
| **AI Opponent** | Three difficulty levels, trajectory prediction algorithm |
| **Remote Authentication** | OAuth 2.0 with 42 and GitHub providers |
| **Blockchain** | Tournament scores on Avalanche Fuji testnet |

### Minor Modules (10 points)

| Module | Description |
|--------|-------------|
| **Database** | SQLite with better-sqlite3 |
| **Stats Dashboard** | Player statistics and match history |

## Configuration

### OAuth Setup (Optional)

Create or edit the `.env` file:

```bash
# 42 OAuth
OAUTH42_CLIENT_ID=your_client_id
OAUTH42_SECRET=your_secret
OAUTH42_REDIRECT_URI=https://localhost:8443/api/auth/oauth/42/callback/

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret
GITHUB_REDIRECT_URI=https://localhost:8443/api/auth/oauth/github/callback/
```

### Blockchain Setup (Optional)

```bash
# Avalanche Fuji testnet
WEB3_PROVIDER_URI=https://api.avax-test.network/ext/bc/C/rpc
BLOCKCHAIN_PRIVATE_KEY=your_private_key_without_0x
CONTRACT_ADDRESS=deployed_contract_address
```

Get test AVAX from the [Avalanche Faucet](https://faucet.avax.network/).

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register/` | Create account |
| POST | `/api/users/login/` | Login |
| POST | `/api/users/logout/` | Logout |
| GET | `/api/auth/oauth/42/` | 42 OAuth flow |
| GET | `/api/auth/oauth/github/` | GitHub OAuth flow |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me/` | Current user |
| GET | `/api/users/profile/` | User profile |
| PUT | `/api/users/profile/` | Update profile |
| GET | `/api/users/stats/` | User statistics |
| GET | `/api/users/friends/` | Friends list |
| POST | `/api/users/friends/:id/add/` | Add friend |
| DELETE | `/api/users/friends/:id/remove/` | Remove friend |
| POST | `/api/users/block/:id/` | Block user |
| DELETE | `/api/users/unblock/:id/` | Unblock user |

### Pong
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pong/matches/create/` | Create match |
| POST | `/api/pong/matches/:id/result/` | Record result |
| GET | `/api/pong/matches/history/` | Match history |
| POST | `/api/pong/rooms/create/` | Create private room |
| POST | `/api/pong/matchmaking/join/` | Join queue |
| POST | `/api/pong/matchmaking/leave/` | Leave queue |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations/` | List conversations |
| GET | `/api/chat/messages/?user=:id` | Get messages |
| POST | `/api/chat/messages/send/` | Send message |
| GET | `/api/chat/notifications/` | Get notifications |

### WebSocket Endpoints
| Endpoint | Description |
|----------|-------------|
| `WS /ws/pong/:room` | Real-time Pong game |
| `WS /ws/chat/` | Global chat room |

## AI Algorithm

The AI opponent uses **trajectory prediction** to determine paddle movement:

1. **Refresh Rate**: Updates game state once per second (as required by subject)
2. **Prediction**: Calculates ball trajectory including wall bounces
3. **Movement**: Simulates keyboard input to move toward predicted position
4. **Difficulty Levels**:
   - **Easy**: 120px error margin, 50% paddle speed
   - **Medium**: 40px error margin, 75% paddle speed
   - **Hard**: Perfect prediction, 150% paddle speed

The implementation does not use pathfinding algorithms (A* is prohibited by the subject).

## Security

- Password hashing with bcrypt (12 rounds)
- JWT authentication with access/refresh tokens
- Input validation on frontend and backend
- SQL injection protection via prepared statements
- XSS protection with HTML sanitization
- HTTPS/WSS encryption
- Rate limiting (100 req/min global, 5 req/min for auth)
- OAuth state parameter for CSRF protection

## Troubleshooting

### Services not starting
```bash
docker-compose logs          # Check all logs
docker-compose logs api      # Check backend logs
make re                      # Full rebuild
```

### WebSocket connection issues
```bash
docker-compose ps            # Verify services are running
docker-compose logs nginx    # Check proxy configuration
```

### Database issues
```bash
docker-compose exec api ls -la /app/data/  # Check database file
make clean && make                          # Reset everything
```

## Documentation

- [Project Status Report](docs/RECAP_PROJET.md)
- [Security Audit](TODO/SECURITY_AUDIT.md)
- [Subject Requirements](docs/en.subject.txt)

## License

This project was developed as part of the 42 school curriculum.

---

**Score: 95-100/100** (6 major modules + 2 minor modules)
