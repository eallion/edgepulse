/**
 * EdgeOne Edge Function: /api/config/index
 * Re-exports /api/config for clean URL route compatibility in all environments.
 */

import { onRequest as handleRequest } from '../config.js';

export async function onRequest(context) {
  return handleRequest(context);
}

export async function onRequestGet(context) {
  return handleRequest(context);
}

export async function onRequestPost(context) {
  return handleRequest(context);
}
