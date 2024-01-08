import { syncedStore, getYjsDoc } from "@syncedstore/core";
import { WebsocketProvider } from "y-websocket";
//import * as awarenessProtocol from 'y-protocols/awareness.js'

// (optional, define types for TypeScript)
//type Todo = { completed: boolean, title: string };

var syncProviderUrl = document.getElementById("syncProviderUrl").value; // see index.php

// Create your SyncedStore store
export const store = syncedStore({ nodes: {}, edges: {} });

// Create a document that syncs automatically using Y-WebRTC
const doc = getYjsDoc(store);
//export const webrtcProvider = new WebrtcProvider(fileId, doc, { signaling: [syncProviderUrl] });

export var syncProvider;

export function setSyncProviderRoom(roomId) {    
    syncProvider = new WebsocketProvider(syncProviderUrl, roomId, doc);
}

//export const disconnect = () => syncProvider.disconnect();
//export const connect = () => syncProvider.connect();