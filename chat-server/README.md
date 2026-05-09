# TSSWAL Chat Server

Serveur Node.js temps réel pour le chat de TSSWAL.

**Stack** : Express + Socket.io + Mongoose + MongoDB Atlas.

## Démarrage local

```bash
cd chat-server
cp .env.example .env
# Éditez .env avec vos vraies valeurs
npm install
npm start          # ou: npm run dev (avec nodemon)
```

Le serveur écoute sur `http://localhost:4000`.

Endpoints REST :
- `GET /` → ping
- `GET /health` → état Mongo + uptime

Events Socket.io :

| Direction | Event           | Payload                                        |
|-----------|----------------|-----------------------------------------------|
| → server  | `join_group`   | `{ groupId }`                                  |
| → server  | `leave_group`  | `{ groupId }`                                  |
| → server  | `send_message` | `{ groupId, text, imageUrl?, replyTo? }`       |
| → server  | `typing`       | `{ groupId, isTyping }`                        |
| ← client  | `new_message`  | message complet                                 |
| ← client  | `user_typing`  | `{ uid, userName, isTyping }`                  |
| ← client  | `error`        | `{ message }`                                  |

## Auth

Le client passe l'UID Firebase dans le handshake :
```js
io(URL, { auth: { uid, userName } });
```
Le serveur vérifie l'UID dans MongoDB. Pas de JWT pour l'instant — pour la prod, on remplacera par un token signé.

## Déploiement

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) — guide pas-à-pas pour Render et Railway (gratuits, sans carte bancaire).
