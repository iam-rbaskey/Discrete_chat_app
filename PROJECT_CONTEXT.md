
# Decentralized Context-Aware Chat Network: Project Manifest

## Core Vision
Build a futuristic, decentralized chat application where users fully own their identity, data, and communication. The system should minimize reliance on centralized servers by using peer-to-peer networking, distributed storage, and optional blockchain verification, while maintaining a smooth, modern, mobile-first user experience.

## Design Principle
Decentralization must be modular and optional. The app should work in centralized mode by default, and progressively enhance into a decentralized system without breaking usability.

## Decentralization Layers
1. **Layer 1 - Networking**: Peer-to-peer messaging (WebRTC/libp2p)
2. **Layer 2 - Storage**: Distributed encrypted storage (IPFS/Arweave)
3. **Layer 3 - Verification**: On-chain cryptographic proofs
4. **Layer 4 - Execution**: Smart contract based plugins
5. **Layer 5 - Infrastructure**: User-operated nodes

## Core Features Breakdown

### 1. Peer-to-Peer Messaging (P2P-01)
- **Tech**: WebRTC (via PeerJS/SimplePeer) for direct connections.
- **Goal**: Direct message transmission without server routing when online. Server used only for signaling/discovery.
- **Fallback**: Relay servers (TURN) or centralized mode when P2P fails.

### 2. Distributed Message Storage (DST-02)
- **Tech**: IPFS or Arweave.
- **Goal**: Store heavy assets/history distributedly.
- **Security**: Client-side encryption before upload.

### 3. On-Chain Message Proof (BCP-04)
- **Tech**: Ethereum/Polygon/Solana signature verification.
- **Goal**: Optional anchoring of critical agreements/messages on-chain (hash only).

### 4. Smart Contract Plugins (SCP-08)
- **Tech**: Wallet integration (metamask/phantom).
- **Goal**: Execute logic (payments, voting) directly within chat context.

### 5. Self-Hosted Nodes (NODE-11)
- **Goal**: Power users can run nodes to support the network.

## Security Model
- **Encryption**: True End-to-End Encryption (E2EE) using user-controlled keys (RSA/ECDH + AES).
- **Key Management**: Local storage (IndexedDB) with secure backup/password protection.
- **Threat Model**: Server compromise, MITM.

## Development Phases

### Phase 1: Foundation (Current Focus)
- Centralized chat (Existing)
- **End-to-end encryption (Upgrade needed: switch to user-owned keys)**
- **P2P networking layer (New implementation: WebRTC)**

### Phase 2: Distribution
- Distributed storage integration
- On-chain proof system

### Phase 3: Ecosystem
- Smart contract plugins
- Node infrastructure

## Success Criteria
- No message content readable by server.
- Network resilience via P2P.
- User ownership of identity keys.
