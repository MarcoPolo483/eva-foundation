"use strict";
/**
 * EVA Foundation - Security Package
 * Enterprise RBAC, Managed Identity, and compliance utilities
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVA_SECURITY_NAME = exports.EVA_SECURITY_VERSION = void 0;
// Export the main security manager
__exportStar(require("./security-manager"), exports);
// Package metadata
exports.EVA_SECURITY_VERSION = '1.0.0';
exports.EVA_SECURITY_NAME = '@eva/security';
//# sourceMappingURL=index.js.map